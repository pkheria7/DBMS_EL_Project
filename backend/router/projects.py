# app/projects.py

from typing import Annotated, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, ConfigDict

from database import SessionLocal
from models import Project, Team, Archive
from semantic_search import semantic_search
from auth_utils import get_current_user, require_faculty
from cache import cache_delete
import math

router = APIRouter(prefix="/projects", tags=["projects"])


# ============================================================================
# DATABASE DEPENDENCY
# ============================================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DB = Annotated[Session, Depends(get_db)]


# ============================================================================
# PYDANTIC SCHEMAS (LOCAL ONLY)
# ============================================================================

# -------- PROJECT --------

class ProjectCreate(BaseModel):
    team_id: int = Field(..., example=1)
    title: str
    abstract: Optional[str] = None
    domain: Optional[str] = None
    report_link: Optional[str] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    domain: Optional[str] = None
    report_link: Optional[str] = None
    phase1_marks: Optional[int] = None
    phase2_marks: Optional[int] = None
    marks: Optional[int] = None


class ProjectResponse(BaseModel):
    project_id: int
    team_id: int
    title: str
    abstract: Optional[str]
    domain: Optional[str]
    report_link: Optional[str]
    phase1_marks: Optional[int]
    phase2_marks: Optional[int]
    marks: Optional[int]
    phase1_deadline: Optional[datetime]
    phase2_deadline: Optional[datetime]
    is_locked: bool
    phase1_feedback: Optional[str]
    phase2_feedback: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class DeadlineSet(BaseModel):
    phase1_deadline: Optional[datetime] = None
    phase2_deadline: Optional[datetime] = None


class DeadlineStatusResponse(BaseModel):
    project_id: int
    is_locked: bool
    phase1_deadline: Optional[datetime]
    phase2_deadline: Optional[datetime]
    phase1_hours_remaining: Optional[float]
    phase2_hours_remaining: Optional[float]
    phase1_expired: bool
    phase2_expired: bool


# -------- ARCHIVE --------

class ArchiveResponse(BaseModel):
    archive_id: int
    project_id: Optional[int]
    title: str
    sem: Optional[int]
    abstract: Optional[str]
    report_link: Optional[str]

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# GET ALL PROJECTS
# ============================================================================

@router.get("/", response_model=List[ProjectResponse])
def get_all_projects(db: DB, _=Depends(get_current_user)):
    return db.query(Project).all()


# ============================================================================
# GET SINGLE PROJECT
# ============================================================================

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: DB, _=Depends(get_current_user)):

    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"Project with id {project_id} not found."
        )

    return project


# ============================================================================
# GET PROJECT BY TEAM ID
# ============================================================================

@router.get("/team/{team_id}", response_model=ProjectResponse)
def get_project_by_team(team_id: int, db: DB, _=Depends(get_current_user)):

    project = db.query(Project).filter(
        Project.team_id == team_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"No project found for team {team_id}."
        )

    return project


# ============================================================================
# CREATE PROJECT (1 TEAM → 1 PROJECT)
# ============================================================================

@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED
)
def add_project(payload: ProjectCreate, db: DB, _=Depends(get_current_user)):

    # 1. Validate team
    team = db.query(Team).filter(
        Team.team_id == payload.team_id
    ).first()

    if not team:
        raise HTTPException(
            status_code=404,
            detail=f"Team with id {payload.team_id} not found."
        )

    # 2. Enforce one-project-per-team
    existing = db.query(Project).filter(
        Project.team_id == payload.team_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="This team already has a project registered."
        )

    # 3. Create project
    new_project = Project(
        team_id=payload.team_id,
        title=payload.title,
        abstract=payload.abstract,
        domain=payload.domain,
        report_link=payload.report_link
    )

    try:
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while creating project."
        ) from e

    return new_project


# ============================================================================
# UPDATE PROJECT
# ============================================================================

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, payload: ProjectUpdate, db: DB, _=Depends(get_current_user)):

    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"Project with id {project_id} not found."
        )

    # Block student edits when project is manually locked
    if project.is_locked:
        raise HTTPException(
            status_code=403,
            detail="Project is locked and cannot be edited."
        )

    # Block student edits when both deadlines have passed
    now = datetime.now(timezone.utc)
    p1_expired = project.phase1_deadline and now > project.phase1_deadline.replace(tzinfo=timezone.utc)
    p2_expired = project.phase2_deadline and now > project.phase2_deadline.replace(tzinfo=timezone.utc)
    if p1_expired and p2_expired:
        raise HTTPException(
            status_code=403,
            detail="Submission deadline has passed. Project can no longer be edited."
        )

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)

    try:
        db.commit()
        db.refresh(project)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while updating project."
        ) from e

    return project


# ============================================================================
# SET DEADLINES (Feature A)
# ============================================================================

@router.put("/{project_id}/deadlines", response_model=ProjectResponse)
def set_deadlines(project_id: int, payload: DeadlineSet, db: DB, _=Depends(require_faculty)):

    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"Project with id {project_id} not found."
        )

    if payload.phase1_deadline:
        project.phase1_deadline = payload.phase1_deadline
    if payload.phase2_deadline:
        project.phase2_deadline = payload.phase2_deadline

    try:
        db.commit()
        db.refresh(project)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while setting deadlines.") from e

    return project


@router.put("/{project_id}/lock", response_model=ProjectResponse)
def toggle_lock(project_id: int, lock: bool, db: DB, _=Depends(require_faculty)):
    """Manually lock or unlock a project. Locked projects cannot be edited by students."""

    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found.")

    project.is_locked = lock

    try:
        db.commit()
        db.refresh(project)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while updating lock.") from e

    return project


# ============================================================================
# DEADLINE STATUS (Feature A)
# ============================================================================

@router.get("/{project_id}/deadline-status", response_model=DeadlineStatusResponse)
def get_deadline_status(project_id: int, db: DB, _=Depends(get_current_user)):

    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found.")

    now = datetime.now(timezone.utc)

    def hours_remaining(deadline: Optional[datetime]) -> Optional[float]:
        if not deadline:
            return None
        delta = deadline.replace(tzinfo=timezone.utc) - now
        return round(delta.total_seconds() / 3600, 2)

    def is_expired(deadline: Optional[datetime]) -> bool:
        if not deadline:
            return False
        return now > deadline.replace(tzinfo=timezone.utc)

    return DeadlineStatusResponse(
        project_id=project.project_id,
        is_locked=project.is_locked,
        phase1_deadline=project.phase1_deadline,
        phase2_deadline=project.phase2_deadline,
        phase1_hours_remaining=hours_remaining(project.phase1_deadline),
        phase2_hours_remaining=hours_remaining(project.phase2_deadline),
        phase1_expired=is_expired(project.phase1_deadline),
        phase2_expired=is_expired(project.phase2_deadline),
    )


# ============================================================================
# DELETE PROJECT
# ============================================================================

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: DB, _=Depends(require_faculty)):

    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"Project with id {project_id} not found."
        )

    try:
        db.delete(project)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while deleting project."
        ) from e

    return None


# ============================================================================
# ARCHIVE PROJECT (SNAPSHOT)
# ============================================================================

def _add_to_vector_db(archive_id: int, title: str, abstract: str):
    try:
        semantic_search.add_archive(archive_id=archive_id, title=title, abstract=abstract)
    except Exception as e:
        print(f"Warning: Failed to add archive {archive_id} to vector DB: {e}")


@router.post(
    "/{project_id}/archive",
    response_model=ArchiveResponse,
    status_code=status.HTTP_201_CREATED
)
def archive_project(project_id: int, background_tasks: BackgroundTasks, db: DB, _=Depends(require_faculty)):

    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"Project with id {project_id} not found."
        )

    new_archive = Archive(
        project_id=project.project_id,
        title=project.title,
        sem=None,
        abstract=project.abstract,
        report_link=project.report_link,
    )

    try:
        db.add(new_archive)
        db.commit()
        db.refresh(new_archive)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while archiving project.") from e

    # Embedding generation runs after response is sent — doesn't block the caller
    background_tasks.add_task(
        _add_to_vector_db,
        new_archive.archive_id,
        new_archive.title or "",
        new_archive.abstract or "",
    )

    cache_delete("archives:all")
    return new_archive


@router.put('/phase1/{project_id}', response_model=ProjectResponse)
def set_phase1(project_id: int, marks: int, db: DB, feedback: Optional[str] = None, _=Depends(require_faculty)):

    project = db.query(Project).filter(Project.project_id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found.")

    project.phase1_marks = marks if marks is not None else 0
    if feedback is not None:
        project.phase1_feedback = feedback

    if project.phase1_marks > 0 and project.phase2_marks > 0:
        project.marks = math.ceil(project.phase1_marks * 0.4 + project.phase2_marks * 0.6)
    else:
        project.marks = None

    try:
        db.commit()
        db.refresh(project)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while updating project marks.") from e

    return project


@router.put('/phase2/{project_id}', response_model=ProjectResponse)
def set_phase2(project_id: int, marks: int, db: DB, feedback: Optional[str] = None, _=Depends(require_faculty)):

    project = db.query(Project).filter(Project.project_id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found.")

    project.phase2_marks = marks if marks is not None else 0
    if feedback is not None:
        project.phase2_feedback = feedback

    if project.phase1_marks > 0 and project.phase2_marks > 0:
        project.marks = math.ceil(project.phase1_marks * 0.4 + project.phase2_marks * 0.6)
    else:
        project.marks = None

    try:
        db.commit()
        db.refresh(project)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while updating project marks.") from e

    return project