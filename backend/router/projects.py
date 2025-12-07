# app/projects.py
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Projects, Teams, Archives
from schemas import ProjectCreate, ProjectUpdate, ProjectOut, ArchiveResponse

router = APIRouter(prefix="/projects", tags=["projects"])

# local DB dependency (keeps it simple)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DB = Annotated[Session, Depends(get_db)]


# ---------- GET all projects ----------
@router.get("/", response_model=List[ProjectOut])
def get_all_projects(db: DB):
    """Get all projects."""
    projects = db.query(Projects).all()
    return projects


# ---------- GET one project ----------
@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: DB):
    """Get a single project by ID."""
    project = db.query(Projects).filter(Projects.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found.")
    return project


# ---------- POST endpoint ----------
@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def add_project(payload: ProjectCreate, db: DB):
    """Create a new project."""
    # 1) ensure the team exists
    team = db.query(Teams).filter(Teams.id == payload.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail=f"Team with id {payload.team_id} not found.")

    # 2) ensure the team doesn't already have a project
    existing = db.query(Projects).filter(Projects.team_id == payload.team_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="This team already has a project registered.")

    # 3) create project record
    new_project = Projects(
        projectid=payload.projectid,
        team_id=payload.team_id,
        title=payload.title,
        description=payload.description,
        domain=payload.domain,
        similarityscore=None,  # Will be computed by vector search system later
        demovideolink=payload.demovideolink,
        year=payload.year
    )

    try:
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while creating project.") from e

    return new_project


# ---------- PUT endpoint (Update) ----------
@router.put("/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, payload: ProjectUpdate, db: DB):
    """Update an existing project."""
    project = db.query(Projects).filter(Projects.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found.")

    # Update only provided fields
    update_data = payload.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(project, key, value)

    try:
        db.add(project)
        db.commit()
        db.refresh(project)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while updating project.") from e

    return project


# ---------- DELETE endpoint ----------
@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: DB):
    """Delete a project."""
    project = db.query(Projects).filter(Projects.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found.")

    try:
        db.delete(project)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while deleting project.") from e

    return None


# ---------- POST archive endpoint ----------
@router.post("/{project_id}/archive", response_model=ArchiveResponse, status_code=status.HTTP_201_CREATED)
def archive_project(project_id: int, db: DB):
    """Archive a project by creating an archive entry."""
    # 1) Get the project
    project = db.query(Projects).filter(Projects.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found.")

    # 2) Check if already archived
    existing_archive = db.query(Archives).filter(Archives.project_id == project_id).first()
    if existing_archive:
        raise HTTPException(status_code=400, detail="This project is already archived.")

    # 3) Create archive entry from project data
    new_archive = Archives(
        project_id=project_id,
        projecttitle=project.title,
        domain=project.domain,
        year=project.year,
        contactinfo=None  # Can be updated later if needed
    )

    try:
        db.add(new_archive)
        db.commit()
        db.refresh(new_archive)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while archiving project.") from e

    return new_archive
