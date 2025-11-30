from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from database import SessionLocal
from models import Students

router = APIRouter(prefix="/students", tags=["students"])

# local DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------
# 🔍 2) Search for students (Name / USN / ID)
# Example: /students/search?query=ani
# -------------------------------
@router.get("/search", summary="Search students by ID, USN, or Name")
def search_students(query: str, db: Session = Depends(get_db)):
    query = query.strip().lower()

    students = db.query(Students).filter(
        (Students.id.ilike(f"%{query}%")) |
        (Students.usn.ilike(f"%{query}%")) |
        (Students.name.ilike(f"%{query}%"))
    ).all()

    if not students:
        raise HTTPException(status_code=404, detail="No matching students found")

    return [
        {
            "id": s.id,
            "usn": s.usn,
            "name": s.name,
            "email": s.email,
            "department": s.department,
            "cluster": s.cluster,
            "semester": s.semester,
            "skills": s.skills,
        }
        for s in students
    ]

