"""
Pydantic schemas for the DBMS EL Project API.

All request/response models are centralized here and organized by entity.
"""
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ============================================================================
# STUDENT SCHEMAS
# ============================================================================

class StudentBase(BaseModel):
    """Base schema with common student fields."""
    usn: str
    name: str
    email: EmailStr
    department: Optional[str] = None
    cluster: Optional[str] = None
    semester: Optional[str] = None
    skills: Optional[str] = None
    resumelink: Optional[str] = None
    githublink: Optional[str] = None


class StudentCreate(StudentBase):
    """Schema for creating a new student (POST /students/register)."""
    id: Optional[str] = Field(None, example="stu123")
    usn: str = Field(..., example="USN001")
    name: str = Field(..., example="Alice Example")
    email: EmailStr = Field(..., example="alice@example.com")
    password: str = Field(..., example="securePassword123", min_length=6)
    department: Optional[str] = Field(None, example="CSE")
    cluster: Optional[str] = Field(None, example="AI")
    semester: Optional[str] = Field(None, example="6")
    skills: Optional[str] = Field(None, example="python,sql,ml")
    resumelink: Optional[str] = Field(None, example="/mnt/data/WhatsApp Image 2025-11-16 at 11.31.22 PM.jpeg")
    githublink: Optional[str] = Field(None, example="https://github.com/alice")


class StudentUpdate(BaseModel):
    """Schema for updating a student (PUT /profiles/students/{student_id})."""
    usn: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    cluster: Optional[str] = None
    semester: Optional[str] = None
    skills: Optional[str] = None
    resumelink: Optional[str] = Field(
        None,
        example="/mnt/data/WhatsApp Image 2025-11-16 at 11.31.22 PM.jpeg"
    )
    githublink: Optional[str] = None


class StudentResponse(StudentBase):
    """Schema for student response (includes ID)."""
    id: str
    model_config = ConfigDict(from_attributes=True)


class StudentOut(BaseModel):
    """Schema for GET /students/ endpoint with is_in_active_team flag."""
    id: str
    usn: str
    name: str
    email: str
    department: str
    cluster: str
    skills: str
    is_in_active_team: bool
    model_config = ConfigDict(from_attributes=True)


class StudentBrief(BaseModel):
    """Brief student schema for nested responses (e.g., in teams)."""
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    cluster: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# FACULTY SCHEMAS
# ============================================================================

class FacultyBase(BaseModel):
    """Base schema with common faculty fields."""
    facultyid: Optional[str] = None
    name: str
    department: Optional[str] = None
    email: EmailStr


class FacultyCreate(FacultyBase):
    """Schema for creating a new faculty (POST /faculty/register)."""
    id: Optional[str] = Field(None, example="fac123")
    facultyid: Optional[str] = Field(None, example="FAC001")
    name: str = Field(..., example="Dr. Raj Gupta")
    department: Optional[str] = Field(None, example="CSE")
    email: EmailStr = Field(..., example="raj.gupta@example.com")
    password: str = Field(..., example="securePassword123", min_length=6)


class FacultyUpdate(BaseModel):
    """Schema for updating a faculty (PUT /profiles/faculty/{faculty_id})."""
    facultyid: Optional[str] = None
    name: Optional[str] = None
    department: Optional[str] = None
    email: Optional[EmailStr] = None
    profile_pic: Optional[str] = Field(
        None,
        example="/mnt/data/WhatsApp Image 2025-11-16 at 11.31.22 PM.jpeg"
    )


class FacultyResponse(FacultyBase):
    """Schema for faculty response (includes ID)."""
    id: str
    model_config = ConfigDict(from_attributes=True)


class FacultyOut(BaseModel):
    """Schema for faculty response with optional profile_pic."""
    id: str
    facultyid: Optional[str] = None
    name: Optional[str] = None
    department: Optional[str] = None
    email: Optional[EmailStr] = None
    profile_pic: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# TEAM SCHEMAS
# ============================================================================

class TeamBase(BaseModel):
    """Base schema with common team fields."""
    teamname: Optional[str] = None
    cluster: Optional[str] = None
    semester: Optional[str] = None
    status: str = "active"
    mentor_id: Optional[str] = None


class TeamCreate(BaseModel):
    """Schema for creating a new team (POST /teams/form)."""
    teamname: Optional[str] = Field(None, example="Alpha Squad")
    member_ids: List[str] = Field(..., min_items=4, max_items=5, example=["stu001", "stu002", "stu003", "stu004"])


class TeamUpdate(BaseModel):
    """Schema for updating a team (PUT /teams/{team_id})."""
    teamname: Optional[str] = None
    cluster: Optional[str] = None
    semester: Optional[str] = None
    status: Optional[str] = None
    mentor_id: Optional[str] = None
    members: Optional[List[str]] = None  # List of student IDs


class TeamResponse(TeamBase):
    """Schema for team response (includes ID and teamid)."""
    id: int
    teamid: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


class TeamOut(BaseModel):
    """Schema for team response with members list."""
    id: int
    teamname: Optional[str] = None
    cluster: Optional[str] = None
    status: str
    members: List[StudentBrief]
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# PROJECT SCHEMAS
# ============================================================================

class ProjectBase(BaseModel):
    """Base schema with common project fields."""
    title: str
    description: Optional[str] = None
    domain: Optional[str] = None
    demovideolink: Optional[str] = None
    year: Optional[str] = None


class ProjectCreate(BaseModel):
    """
    Schema for creating a new project.
    NOTE: similarityscore is NOT provided by the user — it will be computed by vector search system.
    """
    team_id: int = Field(..., example=1)
    title: str = Field(..., example="Smart Parking System")
    description: Optional[str] = Field(None, example="An IoT-based smart parking solution.")
    domain: Optional[str] = Field(None, example="IoT / Smart City")
    demovideolink: Optional[str] = Field(None, example="https://youtu.be/example")
    year: Optional[str] = Field(None, example="2025")
    projectid: Optional[int] = Field(None, example=1001)  # optional
    # similarityscore will be computed by vector search system


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""
    title: Optional[str] = None
    description: Optional[str] = None
    domain: Optional[str] = None
    demovideolink: Optional[str] = None
    year: Optional[str] = None
    projectid: Optional[int] = None
    # similarityscore cannot be updated manually (computed by vector search system)


class ProjectResponse(ProjectBase):
    """Schema for project response (includes system-generated fields)."""
    id: int
    projectid: Optional[int] = None
    team_id: int
    similarityscore: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)


class ProjectOut(BaseModel):
    """Output schema fully visible to frontend."""
    id: int
    projectid: Optional[int] = None
    team_id: int
    title: str
    description: Optional[str] = None
    domain: Optional[str] = None
    similarityscore: Optional[float] = None
    demovideolink: Optional[str] = None
    year: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# ARCHIVE SCHEMAS
# ============================================================================

class ArchiveBase(BaseModel):
    """Base schema with common archive fields."""
    projecttitle: str
    domain: Optional[str] = None
    year: Optional[str] = None
    contactinfo: Optional[str] = None


class ArchiveCreate(ArchiveBase):
    """Schema for creating a new archive (POST /archives/)."""
    archiveid: Optional[int] = None
    project_id: int = Field(..., example=1)
    projecttitle: str = Field(..., example="Smart Parking System")
    domain: Optional[str] = Field(None, example="IoT / Smart City")
    year: Optional[str] = Field(None, example="2025")
    contactinfo: Optional[str] = Field(None, example="contact@example.com")


class ArchiveUpdate(BaseModel):
    """Schema for updating an archive (PUT /archives/{archive_id})."""
    archiveid: Optional[int] = None
    projecttitle: Optional[str] = None
    domain: Optional[str] = None
    year: Optional[str] = None
    contactinfo: Optional[str] = None
    project_id: Optional[int] = None


class ArchiveResponse(ArchiveBase):
    """Schema for archive response (includes ID, archiveid, and project_id)."""
    id: int
    archiveid: Optional[int] = None
    project_id: int
    model_config = ConfigDict(from_attributes=True)

