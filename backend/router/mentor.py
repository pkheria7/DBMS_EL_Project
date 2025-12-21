# app/mentor.py

from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from database import SessionLocal
from models import Team, Faculty, mentors_table

router = APIRouter(prefix="/mentors", tags=["mentors"])


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
# REQUEST SCHEMA (LOCAL)
# ============================================================================

class MentorAssignRequest(BaseModel):
    team_name: str = Field(..., example="Alpha Team")
    faculty_names: List[str] = Field(
        ...,
        min_items=2,
        max_items=2,
        example=["Dr. Anil Kumar", "Dr. Sneha Rao"]
    )


# ============================================================================
# ASSIGN MENTORS TO TEAM
# ============================================================================

@router.post(
    "/assign",
    status_code=status.HTTP_201_CREATED
)
def assign_mentors(payload: MentorAssignRequest, db: DB):
    """
    Assign exactly 2 faculty mentors to a team using team_name and faculty names.
    """

    # 1️⃣ Find team
    team = db.query(Team).filter(
        Team.team_name == payload.team_name
    ).first()

    if not team:
        raise HTTPException(
            status_code=404,
            detail=f"Team '{payload.team_name}' not found."
        )

    # 2️⃣ Find faculty members
    faculty_list = db.query(Faculty).filter(
        Faculty.name.in_(payload.faculty_names)
    ).all()

    if len(faculty_list) != len(payload.faculty_names):
        found = {f.name for f in faculty_list}
        missing = [name for name in payload.faculty_names if name not in found]
        raise HTTPException(
            status_code=404,
            detail=f"Faculty not found: {missing}"
        )

    # 3️⃣ Check existing mentor assignments
    existing = db.execute(
        mentors_table.select().where(
            mentors_table.c.team_id == team.team_id
        )
    ).fetchall()

    existing_faculty_ids = {row.faculty_id for row in existing}

    for faculty in faculty_list:
        if faculty.faculty_id in existing_faculty_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Faculty '{faculty.name}' is already assigned to this team."
            )

    # 4️⃣ Insert mentor mappings
    for faculty in faculty_list:
        db.execute(
            mentors_table.insert().values(
                team_id=team.team_id,
                faculty_id=faculty.faculty_id
            )
        )

    db.commit()

    return {
        "message": "Mentors assigned successfully",
        "team_id": team.team_id,
        "team_name": team.team_name,
        "mentors": [
            {"faculty_id": f.faculty_id, "name": f.name}
            for f in faculty_list
        ]
    }