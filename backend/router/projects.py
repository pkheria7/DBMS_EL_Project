# app/projects.py
from typing import Annotated, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Projects, Teams
from semantic_search import semantic_search

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


class SimilarProjectOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    domain: Optional[str]
    year: Optional[str]
    similarity_score: float

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
        
        # Add to vector database for semantic search
        try:
            semantic_search.add_project(
                project_id=new_project.id,
                title=new_project.title or "",
                description=new_project.description or ""
            )
        except Exception as ve:
            # Log error but don't fail the request
            print(f"Warning: Failed to add project to vector database: {ve}")
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while creating project.") from e

    return new_project


# ---------- GET endpoint for similarity search ----------
@router.get("/similar", response_model=List[SimilarProjectOut])
def search_similar_projects(
    db: DB,
    title: str = Query(..., description="Project title to search for"),
    description: Optional[str] = Query(None, description="Project description to search for"),
    limit: int = Query(5, ge=1, le=20, description="Maximum number of similar projects to return"),
):
    """
    Search for similar projects based on title and description using semantic search.
    Returns projects ordered by similarity score.
    """
    try:
        # Combine title and description for search
        search_text = title
        if description:
            search_text += f" {description}"
        
        # Perform semantic search - get project_ids with scores
        similar_results = semantic_search.search_similar(
            query_text=search_text,
            limit=limit,
            score_threshold=0.3  # Minimum 30% similarity
        )
        
        # Fetch full project details from database
        response = []
        for result in similar_results:
            project = db.query(Projects).filter(Projects.id == result["project_id"]).first()
            if project:
                response.append({
                    "id": project.id,
                    "title": project.title,
                    "description": project.description,
                    "domain": project.domain,
                    "year": project.year,
                    "similarity_score": result["similarity_score"]
                })
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching for similar projects: {str(e)}"
        )


# ---------- GET endpoint for project by ID with similar projects ----------
@router.get("/{project_id}/similar", response_model=List[SimilarProjectOut])
def get_similar_projects_by_id(
    project_id: int,
    db: DB,
    limit: int = Query(5, ge=1, le=20, description="Maximum number of similar projects to return")
):
    """
    Get similar projects for a specific project ID.
    """
    try:
        # Get the project
        project = db.query(Projects).filter(Projects.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")
        
        # Combine title and description for search
        search_text = project.title or ""
        if project.description:
            search_text += f" {project.description}"
        
        # Perform semantic search
        similar_results = semantic_search.search_similar(
            query_text=search_text,
            limit=limit + 1,  # Get one extra to filter out current project
            score_threshold=0.3
        )
        
        # Fetch full project details from database, excluding current project
        response = []
        for result in similar_results:
            if result["project_id"] == project_id:
                continue  # Skip the current project
            
            similar_project = db.query(Projects).filter(Projects.id == result["project_id"]).first()
            if similar_project:
                response.append({
                    "id": similar_project.id,
                    "title": similar_project.title,
                    "description": similar_project.description,
                    "domain": similar_project.domain,
                    "year": similar_project.year,
                    "similarity_score": result["similarity_score"]
                })
                
            if len(response) >= limit:
                break
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error finding similar projects: {str(e)}"
        )
