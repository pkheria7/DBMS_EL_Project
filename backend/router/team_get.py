# app/teams.py

from typing import Annotated, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, ConfigDict

from database import SessionLocal
from models import Team, Student

router = APIRouter(prefix="/teams", tags=["teams"])

# ============================================================================
# CLUSTER MAPPING
# ============================================================================

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

DB = Annotated[Session, Depends(get_db)]


# ============================================================================
# LOCAL PYDANTIC SCHEMAS
# ============================================================================

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
# GET ALL TEAMS WITH MEMBERS
# ============================================================================

@router.get("/", response_model=List[TeamOut])
def get_all_teams(db: DB):

    teams = db.query(Team).all()
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