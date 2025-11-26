# app/students.py
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

# adjust import paths to your project structure
from database import SessionLocal  # get_db returns a Session; if not present see helper below
from models import Students  # your SQLAlchemy model class for students


router = APIRouter(prefix="/students", tags=["students"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

# Pydantic schema for the incoming request
class StudentCreate(BaseModel):
    id: str = Field(..., example="stu123")
    usn: str = Field(..., example="USN001")
    name: str = Field(..., example="Alice Example")
    email: EmailStr = Field(..., example="alice@example.com")
    department: str = Field(None, example="CSE")
    cluster: str | None = Field(None, example="AI")
    semester: str | None = Field(None, example="6")
    skills: str | None = Field(None, example="python,sql,ml")
    resumelink: str | None = Field(None, example="/mnt/data/WhatsApp Image 2025-11-16 at 11.31.22 PM.jpeg")
    githublink: str | None = Field(None, example="https://github.com/alice")


# Pydantic schema for response
class StudentOut(BaseModel):
    id: str
    usn: str | None
    name: str
    email: EmailStr
    department: str | None
    cluster: str | None
    semester: str | None
    skills: str | None
    resumelink: str | None
    githublink: str | None

    class Config:
        orm_mode = True


@router.post("/register", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def register_student(payload: StudentCreate, db: db_dependency):
    # Check for existing student by id or email (avoid duplicates)
    existing = db.query(Students).filter(
        (Students.id == payload.id) | (Students.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this id or email already exists."
        )

    # Create new Students instance
    new_student = Students(
        id=payload.id,
        usn=payload.usn,
        name=payload.name,
        email=payload.email,
        department=payload.department,
        cluster=payload.cluster,
        semester=payload.semester,
        skills=payload.skills,
        resumelink=payload.resumelink,
        githublink=payload.githublink
    )

    # print("New student data:", new_student)

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return new_student
