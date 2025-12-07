# app/faculty.py
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# adjust import paths to your project structure
from database import SessionLocal
from models import Faculty  # your SQLAlchemy Faculty model
from schemas import FacultyCreate, FacultyResponse

router = APIRouter(prefix="/faculty", tags=["faculty"])

# local get_db dependency (keeps things simple and avoids import issues)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]


@router.post("/register", response_model=FacultyResponse, status_code=status.HTTP_201_CREATED)
def register_faculty(payload: FacultyCreate, db: db_dependency):
    # prevent duplicates by id or email
    existing = db.query(Faculty).filter(
        (Faculty.id == payload.id) | (Faculty.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faculty with this id or email already exists."
        )

    new_faculty = Faculty(
        id=payload.id,
        facultyid=payload.facultyid,
        name=payload.name,
        department=payload.department,
        email=payload.email,
    )

    try:
        db.add(new_faculty)
        db.commit()
        db.refresh(new_faculty)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while creating faculty.") from e

    return new_faculty
