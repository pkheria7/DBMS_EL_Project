from typing import Annotated, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Teams, TeamMembers, Students
from schemas import TeamOut, StudentBrief

router = APIRouter(prefix="/teams", tags=["teams"])

# local DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DB = Annotated[Session, Depends(get_db)]


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
                students.append(StudentBrief.model_validate(student))

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
