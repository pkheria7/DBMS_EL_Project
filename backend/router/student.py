# app/students.py
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# adjust import paths to your project structure
from database import SessionLocal  # get_db returns a Session; if not present see helper below
from models import Students, TeamMembers, Teams  # your SQLAlchemy model class for students
from schemas import StudentCreate, StudentResponse, StudentOut


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
