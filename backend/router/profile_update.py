# app/profiles.py
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Students, Faculty
from schemas import StudentUpdate, FacultyUpdate, StudentResponse, FacultyOut

router = APIRouter(prefix="/profiles", tags=["profiles"])

# local db dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DB = Annotated[Session, Depends(get_db)]


# ---- PUT endpoints ----
@router.put("/students/{student_id}", response_model=StudentResponse)
def update_student(student_id: str, payload: StudentUpdate, db: DB):
    student = db.query(Students).filter(Students.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # If email provided, ensure uniqueness (other than this student)
    if payload.email:
        other = db.query(Students).filter(Students.email == payload.email, Students.id != student_id).first()
        if other:
            raise HTTPException(status_code=400, detail="Email is already used by another student.")

    # Apply updates only for fields provided
    update_data = payload.model_dump(exclude_unset=True)  # pydantic v2 method
    for key, val in update_data.items():
        setattr(student, key, val)

    try:
        db.add(student)
        db.commit()
        db.refresh(student)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error updating student.") from e

    return StudentResponse.model_validate(student)


@router.put("/faculty/{faculty_id}", response_model=FacultyOut)
def update_faculty(faculty_id: str, payload: FacultyUpdate, db: DB):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found.")

    # If email provided, ensure uniqueness (other than this faculty)
    if payload.email:
        other = db.query(Faculty).filter(Faculty.email == payload.email, Faculty.id != faculty_id).first()
        if other:
            raise HTTPException(status_code=400, detail="Email is already used by another faculty.")

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        # handle naming mismatch if your model uses different column name for profile_pic
        if key == "profile_pic" and not hasattr(faculty, "profile_pic"):
            # try setting resumelink-like field or skip
            setattr(faculty, "profile_pic", val)  # will raise if attribute does not exist
        else:
            setattr(faculty, key, val)

    try:
        db.add(faculty)
        db.commit()
        db.refresh(faculty)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error updating faculty.") from e

    return FacultyOut.model_validate(faculty)
