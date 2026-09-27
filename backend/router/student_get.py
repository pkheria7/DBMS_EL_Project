from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, EmailStr, ConfigDict

from database import SessionLocal
from models import Student
from auth_utils import get_current_user

router = APIRouter(prefix="/students", tags=["students"])

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


# ============================================================================
# LOCAL RESPONSE SCHEMA
# ============================================================================

class StudentSearchOut(BaseModel):
    usn: str
    name: str
    email: EmailStr
    ph_no: str | None
    sem: int | None
    github: str | None
    resume: str | None
    dept_id: str
    cluster: str | None
    team_id: int | None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# SEARCH STUDENTS
# Example: /students/search?query=ani
# ============================================================================

@router.get(
    "/search",
    response_model=List[StudentSearchOut],
    summary="Search students by USN, name, or email"
)
def search_students(query: str, db: Session = Depends(get_db), _=Depends(get_current_user)):

    q = f"%{query.strip().lower()}%"

    students = db.query(Student).filter(
        (Student.usn.ilike(q)) |
        (Student.name.ilike(q)) |
        (Student.email.ilike(q))
    ).all()

    if not students:
        raise HTTPException(
            status_code=404,
            detail="No matching students found."
        )

    # Build response with cluster derivation
    result = []
    for student in students:
        if not student.dept_id:
            cluster = None
        elif student.dept_id in VALID_CLUSTERS:
            # dept_id is already a cluster name (CSE, ECE, ME, CV)
            cluster = student.dept_id
        else:
            # Look up branch code in mapping
            cluster = CLUSTER_PARENT_MAP.get(student.dept_id)
        
        result.append(
            StudentSearchOut(
                usn=student.usn,
                name=student.name,
                email=student.email,
                ph_no=student.ph_no,
                sem=student.sem,
                github=student.github,
                resume=student.resume,
                dept_id=student.dept_id,
                cluster=cluster,
                team_id=student.team_id
            )
        )

    return result