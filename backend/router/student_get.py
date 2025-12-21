from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, EmailStr, ConfigDict

from database import SessionLocal
from models import Student

router = APIRouter(prefix="/students", tags=["students"])


# ============================================================================
# DATABASE DEPENDENCY
# ============================================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================================
# LOCAL RESPONSE SCHEMA
# ============================================================================

class StudentSearchOut(BaseModel):
    usn: str
    name: str
    email: EmailStr
    sem: int | None
    dept_id: str
    team_id: int | None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# SEARCH STUDENTS
# Example: /students/search?query=ani
# ============================================================================

@router.get(
    "/search",
    response_model=List[StudentSearchOut],
    summary="Search students by USN, name, or email"
)
def search_students(query: str, db: Session = Depends(get_db)):

    q = f"%{query.strip().lower()}%"

    students = db.query(Student).filter(
        (Student.usn.ilike(q)) |
        (Student.name.ilike(q)) |
        (Student.email.ilike(q))
    ).all()

    if not students:
        raise HTTPException(
            status_code=404,
            detail="No matching students found."
        )

    return students
