# app/projects.py

from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, ConfigDict

from database import SessionLocal
from models import Project, Team, Archive
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
    marks: Optional[int] = None


class ProjectResponse(BaseModel):
    project_id: int
    team_id: int
    title: str
    abstract: Optional[str]
    domain: Optional[str]
    report_link: Optional[str]
    marks: Optional[int]

    model_config = ConfigDict(from_attributes=True)


# -------- ARCHIVE --------

class ArchiveResponse(BaseModel):
    archive_id: int
    title: str
    sem: Optional[int]
    abstract: Optional[str]
    report_link: Optional[str]

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# GET ALL PROJECTS
# ============================================================================

@router.get("/", response_model=List[ProjectResponse])
def get_all_projects(db: DB):
    return db.query(Project).all()


# ============================================================================
# GET SINGLE PROJECT
# ============================================================================

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: DB):

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
# CREATE PROJECT (1 TEAM → 1 PROJECT)
# ============================================================================

@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED
)
def add_project(payload: ProjectCreate, db: DB):

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
def update_project(project_id: int, payload: ProjectUpdate, db: DB):

    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"Project with id {project_id} not found."
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
# DELETE PROJECT
# ============================================================================

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: DB):

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

@router.post(
    "/{project_id}/archive",
    response_model=ArchiveResponse,
    status_code=status.HTTP_201_CREATED
)
def archive_project(project_id: int, db: DB):

    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"Project with id {project_id} not found."
        )

    # Create snapshot archive
    new_archive = Archive(
        title=project.title,
        sem=None,
        abstract=project.abstract,
        report_link=project.report_link
    )

    try:
        db.add(new_archive)
        db.commit()
        db.refresh(new_archive)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while archiving project."
        ) from e

    return new_archive


@router.put('/phase1/{project_id}', response_model=ProjectResponse)
def get_phase1_project(project_id: int, marks : int,db: DB):

    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"Project with id {project_id} not found."
        )
    
    project.marks = marks
    try:
        # Commit the changes to the database
        db.commit()
        # Refresh the project instance to reflect the updated state
        db.refresh(project)
    except Exception as e:
        # Rollback in case of any database error
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while updating project marks."
        ) from e

    # Return the updated project
    return project


@router.put('/phase2/{project_id}', response_model=ProjectResponse)
def get_phase2_project(project_id: int, marks : int,db: DB):

    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"Project with id {project_id} not found."
        )
    
    current_marks = project.marks if project.marks else 0
    project.marks = math.ceil(current_marks * 0.4 + marks * 0.6)
    try:
        # Commit the changes to the database
        db.commit()
        # Refresh the project instance to reflect the updated state
        db.refresh(project)
    except Exception as e:
        # Rollback in case of any database error
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while updating project marks."
        ) from e

    # Return the updated project
    return project