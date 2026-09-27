# app/archives.py

from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict

from database import SessionLocal
from models import Archive
from semantic_search import semantic_search
from auth_utils import get_current_user
from cache import cache_get, cache_set

router = APIRouter(prefix="/archives", tags=["archives"])


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
# LOCAL PYDANTIC SCHEMA
# ============================================================================

class ArchiveResponse(BaseModel):
    archive_id: int
    project_id: Optional[int]
    title: str
    sem: Optional[int]
    abstract: Optional[str]
    report_link: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class SimilarArchiveResponse(BaseModel):
    archive_id: int
    project_id: Optional[int]
    title: str
    sem: Optional[int]
    abstract: Optional[str]
    report_link: Optional[str]
    similarity_score: float

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# GET ALL ARCHIVES
# ============================================================================

# ============================================================================
# GET ALL ARCHIVES
# ============================================================================

@router.get("/", response_model=List[ArchiveResponse])
def get_all_archives(db: DB, _=Depends(get_current_user)):
    cached = cache_get("archives:all")
    if cached is not None:
        return cached
    archives = db.query(Archive).all()
    result = [ArchiveResponse.model_validate(a).model_dump() for a in archives]
    cache_set("archives:all", result, 120)
    return result


# ============================================================================
# SEARCH SIMILAR ARCHIVES (must be before /{archive_id} route)
# ============================================================================

@router.get("/similar", response_model=List[SimilarArchiveResponse])
def search_similar_archives(
    db: DB,
    title: Optional[str] = Query(None, description="Title to search for"),
    abstract: Optional[str] = Query(None, description="Abstract to search for"),
    limit: int = Query(9, ge=1, le=9, description="Maximum number of results"),
    _=Depends(get_current_user),
):
    """
    Search for similar archives based on title and/or abstract.
    At least one of title or abstract must be provided.
    Returns archives ordered by similarity score.
    """
    # Validate that at least one search parameter is provided
    if not title and not abstract:
        raise HTTPException(
            status_code=400,
            detail="At least one of 'title' or 'abstract' must be provided"
        )
    
    try:
        # Combine title and abstract for search
        search_text = ""
        if title:
            search_text += title
        if abstract:
            if search_text:
                search_text += " "
            search_text += abstract
        
        # Perform semantic search
        similar_results = semantic_search.search_similar(
            query_text=search_text,
            limit=limit,
            score_threshold=0.3
        )
        
        # Fetch full archive details from database
        response = []
        for result in similar_results:
            archive = db.query(Archive).filter(
                Archive.archive_id == result["archive_id"]
            ).first()
            if archive:
                response.append({
                    "archive_id": archive.archive_id,
                    "project_id": archive.project_id,
                    "title": archive.title,
                    "sem": archive.sem,
                    "abstract": archive.abstract,
                    "report_link": archive.report_link,
                    "similarity_score": result["similarity_score"]
                })
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching for similar archives: {str(e)}"
        )


# ============================================================================
# GET SINGLE ARCHIVE
# ============================================================================

@router.get("/{archive_id}", response_model=ArchiveResponse)
def get_archive(archive_id: int, db: DB, _=Depends(get_current_user)):

    archive = db.query(Archive).filter(
        Archive.archive_id == archive_id
    ).first()

    if not archive:
        raise HTTPException(
            status_code=404,
            detail=f"Archive with id {archive_id} not found."
        )

    return archive
