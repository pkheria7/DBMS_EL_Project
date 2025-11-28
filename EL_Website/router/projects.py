# app/projects.py
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Projects, Teams

router = APIRouter(prefix="/projects", tags=["projects"])

# local DB dependency (keeps it simple)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DB = Annotated[Session, Depends(get_db)]


# ---------- Pydantic schemas (Pydantic v2 compatible) ----------
class ProjectCreate(BaseModel):
    team_id: int = Field(..., example=1)
    title: str = Field(..., example="Smart Parking System")
    description: Optional[str] = Field(None, example="An IoT based smart parking solution.")
    domain: Optional[str] = Field(None, example="IoT / Smart City")
    demovideolink: Optional[str] = Field(None, example="https://youtu.be/example")
    year: Optional[str] = Field(None, example="2025")
    similarityscore: Optional[float] = Field(None, example=0.0)
    projectid: Optional[int] = Field(None, example=1001)

    model_config = {"from_attributes": True}


class ProjectOut(BaseModel):
    id: int
    projectid: Optional[int]
    team_id: int
    title: str
    description: Optional[str]
    domain: Optional[str]
    similarityscore: Optional[float]
    demovideolink: Optional[str]
    year: Optional[str]

    model_config = {"from_attributes": True}


# ---------- POST endpoint ----------
@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def add_project(payload: ProjectCreate, db: DB):
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
        similarityscore=payload.similarityscore,
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
