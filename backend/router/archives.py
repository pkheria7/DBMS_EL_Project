# app/archives.py
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Archives
from schemas import ArchiveResponse

router = APIRouter(prefix="/archives", tags=["archives"])

# local DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DB = Annotated[Session, Depends(get_db)]


# ---------- GET all archives ----------
@router.get("/", response_model=List[ArchiveResponse])
def get_all_archives(db: DB):
    """Get all archived projects."""
    archives = db.query(Archives).all()
    return archives


# ---------- GET one archive ----------
@router.get("/{archive_id}", response_model=ArchiveResponse)
def get_archive(archive_id: int, db: DB):
    """Get a single archive by ID."""
    archive = db.query(Archives).filter(Archives.id == archive_id).first()
    if not archive:
        raise HTTPException(status_code=404, detail=f"Archive with id {archive_id} not found.")
    return archive

