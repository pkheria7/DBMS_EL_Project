from typing import Annotated, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Teams, TeamMembers, Students

router = APIRouter(prefix="/teams", tags=["teams"])

# local DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DB = Annotated[Session, Depends(get_db)]

# ----------- Pydantic Schemas -----------

from pydantic import BaseModel

class StudentBrief(BaseModel):
    id: str
    name: str | None
    email: str | None
    department: str | None
    cluster: str | None

    # Pydantic v2: allow from_orm/from_attributes
    model_config = {"from_attributes": True}


class TeamOut(BaseModel):
    id: int
    teamname: str | None
    cluster: str | None
    status: str
    members: list[StudentBrief]

    model_config = {"from_attributes": True}


# ----------- GET all teams -----------

@router.get("/", response_model=List[TeamOut])
def get_all_teams(db: DB):
    teams = db.query(Teams).all()

    output = []

    for team in teams:
        # get all students via TeamMembers
        member_links = db.query(TeamMembers).filter(TeamMembers.team_id == team.id).all()

        students = []
        for link in member_links:
            student = db.query(Students).filter(Students.id == link.student_id).first()
            if student:
                students.append(StudentBrief.from_orm(student))

        output.append(
            TeamOut(
                id=team.id,
                teamname=team.teamname,
                cluster=team.cluster,
                status=team.status,
                members=students
            )
        )

    return output
