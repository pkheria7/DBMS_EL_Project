# app/archives.py

from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict

from database import SessionLocal
from models import Archive

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


# ============================================================================
# GET ALL ARCHIVES
# ============================================================================

@router.get("/", response_model=List[ArchiveResponse])
def get_all_archives(db: DB):
    return db.query(Archive).all()


# ============================================================================
# GET SINGLE ARCHIVE
# ============================================================================

@router.get("/{archive_id}", response_model=ArchiveResponse)
def get_archive(archive_id: int, db: DB):

    archive = db.query(Archive).filter(
        Archive.archive_id == archive_id
    ).first()

    if not archive:
        raise HTTPException(
            status_code=404,
            detail=f"Archive with id {archive_id} not found."
        )

    return archive
