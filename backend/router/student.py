# app/students.py

from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field, ConfigDict
import bcrypt
from datetime import datetime

from database import SessionLocal
from models import Student, Team
from mongodb import get_users_collection, get_resumes_collection

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

DB = Annotated[Session, Depends(get_db)]


# ============================================================================
# PYDANTIC SCHEMAS (LOCAL ONLY)
# ============================================================================

class StudentCreate(BaseModel):
    usn: str = Field(..., example="1RV21CS001")
    name: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    ph_no: Optional[str] = None
    sem: Optional[int] = None
    github: Optional[str] = None
    resume: Optional[str] = None
    dept_id: str = Field(..., example="CSE")


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


class StudentOut(BaseModel):
    usn: str
    name: str
    email: EmailStr
    dept_id: str
    is_in_active_team: bool

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# REGISTER STUDENT
# ============================================================================

@router.post(
    "/register",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED
)
def register_student(payload: StudentCreate, db: DB):

    # Check duplicate student in SQL
    existing = db.query(Student).filter(
        (Student.usn == payload.usn) |
        (Student.email == payload.email)
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this USN or email already exists."
        )

    # Check duplicate user in MongoDB
    users_col = get_users_collection()
    if users_col.find_one({"email": payload.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered in authentication system."
        )

    # Hash password
    hashed_password = bcrypt.hashpw(
        payload.password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    # Create student (SQL)
    new_student = Student(
        usn=payload.usn,
        name=payload.name,
        email=payload.email,
        ph_no=payload.ph_no,
        sem=payload.sem,
        github=payload.github,
        resume=payload.resume,
        dept_id=payload.dept_id,
    )

    try:
        db.add(new_student)
        db.commit()
        db.refresh(new_student)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while creating student."
        ) from e

    # Store auth credentials in MongoDB
    users_col.insert_one({
        "user_id": payload.usn,
        "email": payload.email,
        "name": payload.name,
        "password": hashed_password,
        "user_type": "student",
        "created_at": datetime.utcnow()
    })

    # Store resume link separately (MongoDB)
    if payload.resume:
        resumes_col = get_resumes_collection()
        resumes_col.insert_one({
            "usn": payload.usn,
            "resume_link": payload.resume,
            "uploaded_at": datetime.utcnow()
        })

    return new_student


# ============================================================================
# GET ALL STUDENTS (WITH ACTIVE TEAM FLAG)
# ============================================================================

@router.get("/", response_model=List[StudentOut])
def get_all_students(db: DB):

    students = db.query(Student).all()

    # Active teams
    active_team_ids = {
        t.team_id for t in db.query(Team).filter(Team.status == "active").all()
    }

    result = []
    for stu in students:
        result.append(
            StudentOut(
                usn=stu.usn,
                name=stu.name,
                email=stu.email,
                dept_id=stu.dept_id,
                is_in_active_team=stu.team_id in active_team_ids
            )
        )

    return result



@router.get(
    "/search",
    response_model=List[StudentOut],
    summary="Search students by USN, name, or email"
)
def search_students(query: str, db: Session = Depends(get_db)):

    q = f"%{query.strip().lower()}%"

    students = db.query(Student).filter(
        ((Student.usn.ilike(q)) |
         (Student.name.ilike(q)) |
         (Student.email.ilike(q))) &
        (Student.team_id == None)
    ).all()

    if not students:
        raise HTTPException(
            status_code=404,
            detail="No matching students found."
        )

    result = []
    for stu in students:
        result.append(
            StudentOut(
                usn=stu.usn,
                name=stu.name,
                email=stu.email,
                dept_id=stu.dept_id,
                is_in_active_team=stu.team_id in active_team_ids
            )
        )

    return result