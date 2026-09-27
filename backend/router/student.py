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
from auth_utils import get_current_user
from cache import cache_get, cache_set, cache_delete

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
    ph_no: Optional[str] = None
    sem: Optional[int] = None
    github: Optional[str] = None
    resume: Optional[str] = None
    cluster: Optional[str] = None
    is_in_active_team: bool

    model_config = ConfigDict(from_attributes=True)

class NoteamStudentSearch(BaseModel):
    sem : int
    cluster : str
    query : Optional[str]
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
        raise HTTPException(status_code=500, detail="Database error while creating student.") from e

    # MongoDB write — compensate by rolling back Postgres row if it fails
    try:
        users_col.insert_one({
            "user_id": payload.usn,
            "email": payload.email,
            "name": payload.name,
            "password": hashed_password,
            "user_type": "student",
            "created_at": datetime.utcnow(),
        })
    except Exception as e:
        db.delete(new_student)
        db.commit()
        raise HTTPException(status_code=500, detail="Registration failed. Please retry.") from e

    if payload.resume:
        try:
            resumes_col = get_resumes_collection()
            resumes_col.insert_one({
                "usn": payload.usn,
                "resume_link": payload.resume,
                "uploaded_at": datetime.utcnow(),
            })
        except Exception:
            pass  # resume storage is non-critical, don't fail registration

    cache_delete("students:all")
    return new_student


# ============================================================================
# CLUSTER MAPPING
# ============================================================================

CLUSTER_PARENT_MAP = {
    "AI": "CSE", "CD": "CSE", "CS": "CSE", "CY": "CSE", "IS": "CSE", "ISE": "CSE",
    "EC": "ECE", "EE": "ECE", "EI": "ECE", "ET": "ECE",
    "AS": "ME", "IM": "ME", "ME": "ME",
    "CV": "CV", "BT": "CV", "CH": "CV"
}

VALID_CLUSTERS = {"CSE", "ECE", "ME", "CV"}


# ============================================================================
# GET ALL STUDENTS (WITH ACTIVE TEAM FLAG)
# ============================================================================

@router.get("/", response_model=List[StudentOut])
def get_all_students(db: DB, _=Depends(get_current_user)):
    cached = cache_get("students:all")
    if cached is not None:
        return cached

    students = db.query(Student).all()

    # Active teams
    active_team_ids = {
        t.team_id for t in db.query(Team).filter(Team.status == "active").all()
    }

    result = []
    for stu in students:
        cluster = None
        if stu.dept_id:
            if stu.dept_id in VALID_CLUSTERS:
                cluster = stu.dept_id
            else:
                cluster = CLUSTER_PARENT_MAP.get(stu.dept_id)

        result.append(
            StudentOut(
                usn=stu.usn,
                name=stu.name,
                email=stu.email,
                dept_id=stu.dept_id,
                ph_no=stu.ph_no,
                sem=stu.sem,
                github=stu.github,
                resume=stu.resume,
                cluster=cluster,
                is_in_active_team=stu.team_id in active_team_ids
            ).model_dump()
        )

    cache_set("students:all", result, 60)
    return result

@router.post(
    "/no-team",
    response_model=List[StudentOut],
    summary="Get all students without a team and in the same cluster and semester"
)
def get_students_without_team(
    payload: NoteamStudentSearch,
    db: DB,
    _=Depends(get_current_user),
):

    # Fetch students without a team
    q = f"%{payload.query.strip().lower()}%"
    students = db.query(Student).filter(
        (Student.team_id == None) & (Student.sem == payload.sem) &
        ((Student.usn.ilike(q)) |
         (Student.name.ilike(q)) |
         (Student.email.ilike(q)))
    ).all()

    # Active teams
    active_team_ids = {
        t.team_id for t in db.query(Team).filter(Team.status == "active").all()
    }

    result = []
    for stu in students:
        # Derive cluster from dept_id
        derived_cluster = None
        if stu.dept_id:
            if stu.dept_id in VALID_CLUSTERS:
                derived_cluster = stu.dept_id
            else:
                derived_cluster = CLUSTER_PARENT_MAP.get(stu.dept_id)
        
        # Check if the student's cluster matches the input cluster
        if derived_cluster == payload.cluster:
            result.append(
                StudentOut(
                    usn=stu.usn,
                    name=stu.name,
                    email=stu.email,
                    dept_id=stu.dept_id,
                    ph_no=stu.ph_no,
                    sem=stu.sem,
                    github=stu.github,
                    resume=stu.resume,
                    cluster=derived_cluster,
                    is_in_active_team=stu.team_id in active_team_ids
                )
            )

    return result


@router.get(
    "/search",
    response_model=List[StudentOut],
    summary="Search students by USN, name, or email"
)
def search_students(query: str, db: DB, _=Depends(get_current_user)):

    q = f"%{query.strip().lower()}%"

    students = db.query(Student).filter(
        ((Student.usn.ilike(q)) |
         (Student.name.ilike(q)) |
         (Student.email.ilike(q)))
    ).all()

    if not students:
        raise HTTPException(
            status_code=404,
            detail="No matching students found."
        )

    

    result = []
    for stu in students:
        # Derive cluster from dept_id
        cluster = None
        if stu.dept_id:
            if stu.dept_id in VALID_CLUSTERS:
                cluster = stu.dept_id
            else:
                cluster = CLUSTER_PARENT_MAP.get(stu.dept_id)
        
        result.append(
            StudentOut(
                usn=stu.usn,
                name=stu.name,
                email=stu.email,
                dept_id=stu.dept_id,
                ph_no=stu.ph_no,
                sem=stu.sem,
                github=stu.github,
                resume=stu.resume,
                cluster=cluster,
                is_in_active_team=stu.team_id is not None
            )
        )

    return result