# app/students.py
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import bcrypt
from datetime import datetime

# adjust import paths to your project structure
from database import SessionLocal  # get_db returns a Session; if not present see helper below
from models import Students, TeamMembers, Teams  # your SQLAlchemy model class for students
from schemas import StudentCreate, StudentResponse, StudentOut
from mongodb import get_users_collection, get_resumes_collection


router = APIRouter(prefix="/students", tags=["students"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]


@router.post("/register", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def register_student(payload: StudentCreate, db: db_dependency):
    # Generate ID if not provided
    student_id = payload.id
    if not student_id:
        # Generate ID from USN or use a unique identifier
        student_id = payload.usn
    
    # Check for existing student by id or email (avoid duplicates in SQLite)
    existing = db.query(Students).filter(
        (Students.id == student_id) | (Students.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this id or email already exists."
        )
    
    # Check for existing user in MongoDB
    users_col = get_users_collection()
    existing_user = users_col.find_one({"email": payload.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered in the system."
        )

    # Hash the password using bcrypt directly
    password_bytes = payload.password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    # Save login credentials to MongoDB
    user_doc = {
        "user_id": student_id,
        "email": payload.email,
        "name": payload.name,
        "password": hashed_password,
        "user_type": "student",
        "created_at": datetime.utcnow()
    }
    users_col.insert_one(user_doc)
    
    # Save resume link to MongoDB if provided
    if payload.resumelink:
        resumes_col = get_resumes_collection()
        resume_doc = {
            "student_id": student_id,
            "resume_link": payload.resumelink,
            "uploaded_at": datetime.utcnow()
        }
        resumes_col.insert_one(resume_doc)

    # Create new Students instance for SQLite (without password)
    new_student = Students(
        id=student_id,
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


@router.get("/", response_model=List[StudentOut])
def get_all_students(db: Session = Depends(get_db)):
    # 1. Get all students
    students = db.query(Students).all()

    # 2. Find students who are in an ACTIVE team
    active_members = (
        db.query(TeamMembers.student_id)
        .join(Teams, Teams.id == TeamMembers.team_id)
        .filter(Teams.status == "active")
        .all()
    )
    active_ids = {row[0] for row in active_members}  # convert tuple to set of IDs

    # 3. Construct response list
    result = []
    for stu in students:
        result.append(StudentOut(
            id=stu.id,
            usn=stu.usn,
            name=stu.name,
            email=stu.email,
            department=stu.department,
            cluster=stu.cluster,
            skills=stu.skills,
            is_in_active_team=stu.id in active_ids
        ))

    return result
