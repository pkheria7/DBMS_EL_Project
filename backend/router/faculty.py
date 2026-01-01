# app/faculty.py

from typing import Annotated, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field, ConfigDict
import bcrypt
from datetime import datetime

from database import SessionLocal
from models import Faculty , mentors_table , Team, Student
from mongodb import get_users_collection

router = APIRouter(prefix="/faculty", tags=["faculty"])


CLUSTER_PARENT_MAP = {
    "AI": "CSE", "CD": "CSE", "CS": "CSE", "CY": "CSE", "IS": "CSE",
    "EC": "ECE", "EE": "ECE", "EI": "ECE", "ET": "ECE",
    "AS": "ME", "IM": "ME", "ME": "ME",
    "CV": "CV", "BT": "CV", "CH": "CV"
}

# Valid cluster names (in case dept_id is already a cluster)
VALID_CLUSTERS = {"CSE", "ECE", "ME", "CV"}
# ============================================================================
# DATABASE DEPENDENCY
# ============================================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]


# ============================================================================
# PYDANTIC SCHEMAS (LOCAL TO THIS FILE)
# ============================================================================

class FacultyCreate(BaseModel):
    name: str = Field(..., example="Dr. Raj Gupta")
    email: EmailStr = Field(..., example="raj.gupta@example.com")
    password: str = Field(..., min_length=6)
    ph_no: Optional[str] = Field(None, example="9876543210")
    designation: Optional[str] = Field(None, example="Associate Professor")
    dept_id: str = Field(..., example="CSE")


class FacultyResponse(BaseModel):
    faculty_id: int
    name: str
    email: EmailStr
    ph_no: Optional[str] = None
    designation: Optional[str] = None
    dept_id: str

    model_config = ConfigDict(from_attributes=True)


class FacultySearchOut(BaseModel):
    faculty_id: int
    name: str
    email: EmailStr
    designation: Optional[str]
    dept_id: str
    ph_no: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class StudentBrief(BaseModel):
    usn: str
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)

class TeamOut(BaseModel):
    team_id: int
    team_name: str
    status: str
    cluster: str | None
    members: List[StudentBrief]

    model_config = ConfigDict(from_attributes=True)

# ============================================================================
# GET ALL FACULTY
# ============================================================================

@router.get(
    "/",
    response_model=List[FacultySearchOut]
)
def get_all_faculty(db: db_dependency):
    faculty_list = db.query(Faculty).all()
    return faculty_list

# ============================================================================
# REGISTER FACULTY
# ============================================================================

@router.post(
    "/register",
    response_model=FacultyResponse,
    status_code=status.HTTP_201_CREATED
)
def register_faculty(payload: FacultyCreate, db: db_dependency):

    # Check duplicate faculty email in SQL
    existing_faculty = db.query(Faculty).filter(
        Faculty.email == payload.email
    ).first()
    if existing_faculty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faculty with this email already exists."
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

    # Create faculty (SQL)
    new_faculty = Faculty(
        name=payload.name,
        email=payload.email,
        ph_no=payload.ph_no,
        designation=payload.designation,
        dept_id=payload.dept_id,
    )

    try:
        db.add(new_faculty)
        db.commit()
        db.refresh(new_faculty)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Error while creating faculty record."
        ) from e

    # Store credentials in MongoDB
    users_col.insert_one({
        "user_id": new_faculty.faculty_id,
        "email": payload.email,
        "name": payload.name,
        "password": hashed_password,
        "user_type": "faculty",
        "created_at": datetime.utcnow()
    })

    return new_faculty


# ============================================================================
# SEARCH FACULTY
# ============================================================================

@router.get(
    "/search",
    response_model=List[FacultySearchOut]
)
def search_faculty(query: str, db: db_dependency):
    """
    Search faculty by:
    - name
    - email
    - designation
    """
    q = f"%{query.strip().lower()}%"

    faculty_list = db.query(Faculty).filter(
        (Faculty.name.ilike(q)) |
        (Faculty.email.ilike(q)) |
        (Faculty.designation.ilike(q))
    ).all()

    if not faculty_list:
        raise HTTPException(
            status_code=404,
            detail="No matching faculty found."
        )

    return faculty_list


# ============================================================================
# get faculty projects
# ============================================================================

@router.get(
    "/{faculty_id}/teams",
    response_model=List[TeamOut]
)
def get_all_teams(faculty_id: int, db: db_dependency):
    teamids = db.query(mentors_table.c.team_id).filter(
        mentors_table.c.faculty_id == faculty_id
    ).all()

    # Extract team IDs from the result
    teamids = [team_id[0] for team_id in teamids]  # Flatten the list of tuples

    if not teamids:
        raise HTTPException(
            status_code=404,
            detail="No teams found for the given faculty."
        )

    teams = db.query(Team).filter(Team.team_id.in_(teamids)).all()
    result = []

    for team in teams:
        members = db.query(Student).filter(
            Student.team_id == team.team_id
        ).all()

        # Derive cluster from members' dept_id
        # All members should be in the same cluster (validation rule)
        cluster = None
        if members:
            # Get the first member's dept_id to determine cluster
            first_dept_id = members[0].dept_id
            if first_dept_id:
                if first_dept_id in VALID_CLUSTERS:
                    # dept_id is already a cluster name
                    cluster = first_dept_id
                else:
                    # Look up branch code in mapping
                    cluster = CLUSTER_PARENT_MAP.get(first_dept_id)

        result.append(
            TeamOut(
                team_id=team.team_id,
                team_name=team.team_name,
                status=team.status,
                cluster=cluster,
                members=members
            )
        )

    return result