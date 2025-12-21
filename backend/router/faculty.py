# app/faculty.py
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import bcrypt
from datetime import datetime

# adjust import paths to your project structure
from database import SessionLocal
from models import Faculty  # your SQLAlchemy Faculty model
from schemas import FacultyCreate, FacultyResponse
from mongodb import get_users_collection

router = APIRouter(prefix="/faculty", tags=["faculty"])

# local get_db dependency (keeps things simple and avoids import issues)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]


@router.post("/register", response_model=FacultyResponse, status_code=status.HTTP_201_CREATED)
def register_faculty(payload: FacultyCreate, db: db_dependency):
    # Generate ID if not provided
    faculty_id = payload.id
    if not faculty_id:
        # Generate ID from facultyid or use a unique identifier
        faculty_id = payload.facultyid if payload.facultyid else payload.email.split('@')[0]
    
    # prevent duplicates by id or email in SQLite
    existing = db.query(Faculty).filter(
        (Faculty.id == faculty_id) | (Faculty.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faculty with this id or email already exists."
        )
    
    # Check for existing user in MongoDB
    users_col = get_users_collection()
    existing_user = users_col.find_one({"email": payload.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered in the system."
        )

    # Hash the password using bcrypt directly
    password_bytes = payload.password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    # Save login credentials to MongoDB
    user_doc = {
        "user_id": faculty_id,
        "email": payload.email,
        "name": payload.name,
        "password": hashed_password,
        "user_type": "faculty",
        "created_at": datetime.utcnow()
    }
    users_col.insert_one(user_doc)

    # Create new faculty in SQLite (without password)
    new_faculty = Faculty(
        id=faculty_id,
        facultyid=payload.facultyid,
        name=payload.name,
        department=payload.department,
        email=payload.email,
    )

    try:
        db.add(new_faculty)
        db.commit()
        db.refresh(new_faculty)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while creating faculty.") from e

    return new_faculty


@router.get("/search")
def search_faculty(query: str, db: db_dependency):
    """Search for faculty by ID, name, email, or faculty ID"""
    query = query.strip().lower()
    
    faculty_list = db.query(Faculty).filter(
        (Faculty.id.ilike(f"%{query}%")) |
        (Faculty.facultyid.ilike(f"%{query}%")) |
        (Faculty.name.ilike(f"%{query}%")) |
        (Faculty.email.ilike(f"%{query}%"))
    ).all()
    
    if not faculty_list:
        raise HTTPException(status_code=404, detail="No matching faculty found")
    
    return [
        {
            "id": f.id,
            "facultyid": f.facultyid,
            "name": f.name,
            "email": f.email,
            "department": f.department,
        }
        for f in faculty_list
    ]
