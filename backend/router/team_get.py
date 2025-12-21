# app/teams.py

from typing import Annotated, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, ConfigDict

from database import SessionLocal
from models import Team, Student

router = APIRouter(prefix="/teams", tags=["teams"])


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

        result.append(
            TeamOut(
                team_id=team.team_id,
                team_name=team.team_name,
                status=team.status,
                members=members
            )
        )

    return result
