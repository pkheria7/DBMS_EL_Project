# app/teams.py
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import SessionLocal
from models import Students, Teams, TeamMembers

router = APIRouter(prefix="/teams", tags=["teams"])

# local get_db (keeps things simple)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DB = Annotated[Session, Depends(get_db)]

# Request payload
class TeamCreateRequest(BaseModel):
    teamname: str | None = Field(None, example="Alpha Squad")
    member_ids: List[str] = Field(..., min_items=4, max_items=5, example=["stu001","stu002","stu003","stu004"])

# Response schemas
class StudentBrief(BaseModel):
    id: str
    name: str | None
    email: str | None
    department: str | None
    cluster: str | None

    class Config:
        orm_mode = True

class TeamOut(BaseModel):
    id: int
    teamname: str | None
    cluster: str | None
    status: str
    members: List[StudentBrief]

    class Config:
        orm_mode = True


@router.post("/form", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
def form_team(payload: TeamCreateRequest, db: DB):
    member_ids = payload.member_ids

    # 1) size enforced by Pydantic (4-5) but double-check
    if not (4 <= len(member_ids) <= 5):
        raise HTTPException(status_code=400, detail="Team must have 4 or 5 members.")

    # 2) fetch students from DB
    students = db.query(Students).filter(Students.id.in_(member_ids)).all()
    if len(students) != len(member_ids):
        found_ids = {s.id for s in students}
        missing = [sid for sid in member_ids if sid not in found_ids]
        raise HTTPException(status_code=404, detail=f"Student(s) not found: {missing}")

    # 3) all from same cluster?
    clusters = {s.cluster for s in students}
    if len(clusters) != 1:
        raise HTTPException(status_code=400, detail=f"All members must be from the same cluster. Clusters found: {clusters}")
    team_cluster = clusters.pop()

    # 4) branch diversity (department) -> need at least 3 distinct departments
    departments = [s.department or "" for s in students]
    distinct_depts = set(departments)
    # remove empty dept entries if any (consider them as one dept if needed)
    distinct_depts = {d for d in distinct_depts if d}
    if len(distinct_depts) < 3:
        raise HTTPException(
            status_code=400,
            detail=f"Team must include at least 3 different branches (departments). Found: {sorted(list(distinct_depts))}"
        )

    # 5) ensure students are not already in an active team
    # We'll check team_members join to teams with status 'active'
    already = (
        db.query(TeamMembers)
          .join(Teams, TeamMembers.team_id == Teams.id)
          .filter(TeamMembers.student_id.in_(member_ids))
          .filter(Teams.status == "active")
          .all()
    )
    if already:
        taken_student_ids = [tm.student_id for tm in already]
        raise HTTPException(status_code=400, detail=f"Some students are already in an active team: {taken_student_ids}")

    # 6) create Teams row
    new_team = Teams(
        teamname=payload.teamname,
        cluster=team_cluster,
        status="active",
    )
    db.add(new_team)
    db.flush()  # get new_team.id without committing

    # 7) create TeamMembers rows
    for s in students:
        tm = TeamMembers(team_id=new_team.id, student_id=s.id)
        db.add(tm)

    # 8) optional: set team's semester from members if desired (majority or first)
    # new_team.semester = students[0].semester

    try:
        db.commit()
        db.refresh(new_team)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error creating team.") from e

    # build response members list
    members_out = [
        StudentBrief.from_orm(s) for s in students
    ]

    return TeamOut(
        id=new_team.id,
        teamname=new_team.teamname,
        cluster=new_team.cluster,
        status=new_team.status,
        members=members_out
    )
