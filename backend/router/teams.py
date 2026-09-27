# app/teams.py

from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from database import SessionLocal
from models import Student, Team
from auth_utils import get_current_user
from cache import cache_delete

router = APIRouter(prefix="/teams", tags=["teams"])


# ============================================================================
# CLUSTER MAPPING (same as student endpoints)
# ============================================================================

CLUSTER_PARENT_MAP = {
    "AI": "CSE", "CD": "CSE", "CS": "CSE", "CY": "CSE", "IS": "CSE",
    "EC": "ECE", "EE": "ECE", "EI": "ECE", "ET": "ECE",
    "AS": "ME", "IM": "ME", "ME": "ME",
    "CV": "CV", "BT": "CV", "CH": "CV"
}

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

DB = Annotated[Session, Depends(get_db)]


# ============================================================================
# LOCAL PYDANTIC SCHEMAS
# ============================================================================

class TeamCreate(BaseModel):
    team_name: str = Field(..., example="Alpha Team")
    member_usns: List[str] = Field(..., min_items=4, max_items=5)


class StudentBrief(BaseModel):
    usn: str
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class TeamOut(BaseModel):
    team_id: int
    team_name: str
    status: str
    members: List[StudentBrief]

    model_config = ConfigDict(from_attributes=True)


def parent_cluster(dept_id: str) -> str | None:
    """
    Derive cluster from dept_id using the same logic as student endpoints.
    """
    if not dept_id:
        return None
    elif dept_id in VALID_CLUSTERS:
        # dept_id is already a cluster name (CSE, ECE, ME, CV)
        return dept_id
    else:
        # Look up branch code in mapping
        return CLUSTER_PARENT_MAP.get(dept_id)

# ============================================================================
# FORM TEAM
# ============================================================================
@router.post(
    "/form",
    response_model=TeamOut,
    status_code=status.HTTP_201_CREATED
)
def form_team(payload: TeamCreate, db: DB, _=Depends(get_current_user)):

    member_usns = payload.member_usns

    # 1️⃣ Validate team size
    if not (4 <= len(member_usns) <= 5):
        raise HTTPException(
            status_code=400,
            detail="Team must have 4 or 5 members."
        )

    # 2️⃣ Fetch students
    students = db.query(Student).filter(
        Student.usn.in_(member_usns)
    ).all()

    if len(students) != len(member_usns):
        found = {s.usn for s in students}
        missing = [u for u in member_usns if u not in found]
        raise HTTPException(
            status_code=404,
            detail=f"Student(s) not found: {missing}"
        )

    # 3️⃣ Ensure no student already in a team
    already_in_team = [s.usn for s in students if s.team_id is not None]
    if already_in_team:
        raise HTTPException(
            status_code=400,
            detail=f"These students are already in a team: {already_in_team}"
        )

    # 4️⃣ Ensure all students are from the same semester
    semesters = {s.sem for s in students}
    if len(semesters) > 1:
        raise HTTPException(
            status_code=400,
            detail="All team members must be from the same semester."
        )

    # 5️⃣ Ensure all students are from the same cluster
    from_cluster = {parent_cluster(s.dept_id) for s in students}
    if len(from_cluster) > 1:
        raise HTTPException(
            status_code=400,
            detail="All team members must be from the same cluster."
        )

    # 6️⃣ Create team
    new_team = Team(
        team_name=payload.team_name,
        status="active"
    )

    try:
        db.add(new_team)
        db.flush()  # get team_id

        # 7️⃣ Assign students to team
        for student in students:
            student.team_id = new_team.team_id

        db.commit()
        db.refresh(new_team)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while creating team."
        ) from e

    cache_delete("teams:all", "students:all")
    return TeamOut(
        team_id=new_team.team_id,
        team_name=new_team.team_name,
        status=new_team.status,
        members=students
    )