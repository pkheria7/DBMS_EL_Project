# app/teams.py
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import SessionLocal
from models import Students, Teams, TeamMembers
from schemas import TeamCreate, TeamOut, StudentBrief

router = APIRouter(prefix="/teams", tags=["teams"])

# local get_db (keeps things simple)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DB = Annotated[Session, Depends(get_db)]


CLUSTER_PARENT_MAP = {
    "AI": "CS", "CD": "CS", "CS": "CS", "CY": "CS", "IS": "CS",
    "EC": "EC", "EE": "EC", "EI": "EC", "ET": "EC",
    "AS": "ME", "IM": "ME", "ME": "ME",
    "CV": "CV", "BT": "CV", "CH": "CV",
}

def normalize_cluster(code: str | None) -> str:
    if not code:
        return ""
    return CLUSTER_PARENT_MAP.get(code.upper(), code.upper())


@router.post("/form", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
def form_team(payload: TeamCreate, db: DB):
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

    # 3) all from same parent cluster? (CS / EC / ME / CV)
    normalized_clusters = {normalize_cluster(s.cluster) for s in students}
    if len(normalized_clusters) != 1:
        raise HTTPException(
            status_code=400,
            detail=f"All members must belong to the same parent cluster (CS / EC / ME / CV). "
                   f"Clusters found: {sorted(list(normalized_clusters))}"
        )
    team_cluster = normalized_clusters.pop()

    # 4) branch diversity (department) -> validate distribution patterns
    from collections import Counter
    departments = [s.department for s in students if s.department]
    dept_counter = Counter(departments)
    team_size = len(member_ids)
    
    if team_size == 4:
        counts = sorted(dept_counter.values(), reverse=True)
        # Allowed: 2+2, 2+1+1
        valid_4 = (
            counts == [2, 2] or
            counts == [2, 1, 1]
        )
        if not valid_4:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid branch distribution for 4-member team. Allowed: 2+2 or 2+1+1. Found: {dept_counter}"
            )
    elif team_size == 5:
        counts = sorted(dept_counter.values(), reverse=True)
        # Allowed: 3+2, 3+1+1, 2+2+1
        valid_5 = (
            counts == [3, 2] or
            counts == [3, 1, 1] or
            counts == [2, 2, 1]
        )
        if not valid_5:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid branch distribution for 5-member team. Allowed: 3+2, 3+1+1, or 2+2+1. Found: {dept_counter}"
            )

    # 5) ensure students are not already in an active team
    # We'll check team_members join to teams with status 'active'
    already = (
        db.query(TeamMembers)
          .join(Teams, TeamMembers.team_id == Teams.id)
          .filter(TeamMembers.student_id.in_(member_ids))
          .filter(func.lower(Teams.status) == "active")
          .all()
    )
    if already:
        taken_student_ids = {tm.student_id for tm in already}
        taken_students = [s for s in students if s.id in taken_student_ids]
        student_names = [f"{s.name} ({s.id})" if s.name else s.id for s in taken_students]
        raise HTTPException(
            status_code=400, 
            detail=f"Some students are already in an active team: {', '.join(student_names)}"
        )

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
        StudentBrief.model_validate(s) for s in students
    ]

    return TeamOut(
        id=new_team.id,
        teamname=new_team.teamname,
        cluster=new_team.cluster,
        status=new_team.status,
        members=members_out
    )
