# app/profiles.py

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from database import SessionLocal
from models import Student, Faculty

router = APIRouter(prefix="/profiles", tags=["profiles"])


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

# -------- STUDENT --------

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    ph_no: Optional[str] = None
    sem: Optional[int] = None
    github: Optional[str] = None
    resume: Optional[str] = None
    dept_id: Optional[str] = None
    # team_id is NOT editable by students - excluded from schema


class StudentResponse(BaseModel):
    usn: str
    name: str
    email: EmailStr
    ph_no: Optional[str]
    sem: Optional[int]
    github: Optional[str]
    resume: Optional[str]
    dept_id: str
    team_id: Optional[int]

    model_config = ConfigDict(from_attributes=True)


# -------- FACULTY --------

class FacultyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    ph_no: Optional[str] = None
    designation: Optional[str] = None
    dept_id: Optional[str] = None


class FacultyResponse(BaseModel):
    faculty_id: int
    name: str
    email: EmailStr
    ph_no: Optional[str]
    designation: Optional[str]
    dept_id: str

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# UPDATE STUDENT PROFILE
# ============================================================================

@router.put("/students/{usn}", response_model=StudentResponse)
def update_student(usn: str, payload: StudentUpdate, db: DB):

    student = db.query(Student).filter(Student.usn == usn).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Email uniqueness check
    if payload.email:
        other = db.query(Student).filter(
            Student.email == payload.email,
            Student.usn != usn
        ).first()
        if other:
            raise HTTPException(
                status_code=400,
                detail="Email already used by another student."
            )

    update_data = payload.model_dump(exclude_unset=True)
    # Explicitly exclude team_id and usn from updates (system-controlled fields)
    update_data.pop('team_id', None)
    update_data.pop('usn', None)
    
    for key, value in update_data.items():
        setattr(student, key, value)

    try:
        db.commit()
        db.refresh(student)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while updating student."
        ) from e

    return student


# ============================================================================
# UPDATE FACULTY PROFILE
# ============================================================================

@router.put("/faculty/{faculty_id}", response_model=FacultyResponse)
def update_faculty(faculty_id: int, payload: FacultyUpdate, db: DB):

    faculty = db.query(Faculty).filter(
        Faculty.faculty_id == faculty_id
    ).first()

    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found.")

    # Email uniqueness check
    if payload.email:
        other = db.query(Faculty).filter(
            Faculty.email == payload.email,
            Faculty.faculty_id != faculty_id
        ).first()
        if other:
            raise HTTPException(
                status_code=400,
                detail="Email already used by another faculty."
            )

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(faculty, key, value)

    try:
        db.commit()
        db.refresh(faculty)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while updating faculty."
        ) from e

    return faculty