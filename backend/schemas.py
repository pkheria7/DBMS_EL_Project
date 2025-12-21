# """
# Pydantic schemas for DBMS EL Project API
# Aligned with normalized database schema.
# """

# from typing import List, Optional
# from pydantic import BaseModel, EmailStr, Field, ConfigDict


# # ============================================================================
# # CLUSTER SCHEMAS
# # ============================================================================

# class ClusterBase(BaseModel):
#     cluster_name: str


# class ClusterCreate(ClusterBase):
#     pass


# class ClusterResponse(ClusterBase):
#     cluster_id: int
#     model_config = ConfigDict(from_attributes=True)


# # ============================================================================
# # DEPARTMENT SCHEMAS
# # ============================================================================

# class DepartmentBase(BaseModel):
#     dept_name: str
#     cluster_id: int


# class DepartmentCreate(DepartmentBase):
#     pass


# class DepartmentResponse(DepartmentBase):
#     dept_id: int
#     model_config = ConfigDict(from_attributes=True)


# # ============================================================================
# # STUDENT SCHEMAS
# # ============================================================================

# class StudentBase(BaseModel):
#     usn: str
#     name: str
#     email: EmailStr
#     ph_no: Optional[str] = None
#     sem: Optional[int] = None
#     github: Optional[str] = None
#     resume: Optional[str] = None
#     dept_id: int
#     team_id: Optional[int] = None


# class StudentCreate(StudentBase):
#     pass


# class StudentUpdate(BaseModel):
#     name: Optional[str] = None
#     email: Optional[EmailStr] = None
#     ph_no: Optional[str] = None
#     sem: Optional[int] = None
#     github: Optional[str] = None
#     resume: Optional[str] = None
#     dept_id: Optional[int] = None
#     team_id: Optional[int] = None


# class StudentResponse(StudentBase):
#     model_config = ConfigDict(from_attributes=True)


# # ----------------------------
# # SKILLS
# # ----------------------------

# class SkillBase(BaseModel):
#     skill: str


# class SkillCreate(SkillBase):
#     usn: str


# class SkillResponse(SkillBase):
#     usn: str
#     model_config = ConfigDict(from_attributes=True)


# # ============================================================================
# # FACULTY SCHEMAS
# # ============================================================================

# class FacultyBase(BaseModel):
#     name: str
#     email: EmailStr
#     ph_no: Optional[str] = None
#     designation: Optional[str] = None
#     dept_id: int


# class FacultyCreate(FacultyBase):
#     pass


# class FacultyUpdate(BaseModel):
#     name: Optional[str] = None
#     email: Optional[EmailStr] = None
#     ph_no: Optional[str] = None
#     designation: Optional[str] = None
#     dept_id: Optional[int] = None


# class FacultyResponse(FacultyBase):
#     faculty_id: int
#     model_config = ConfigDict(from_attributes=True)


# # ============================================================================
# # TEAM SCHEMAS
# # ============================================================================

# class TeamBase(BaseModel):
#     team_name: str
#     status: Optional[str] = "active"


# class TeamCreate(TeamBase):
#     pass


# class TeamUpdate(BaseModel):
#     team_name: Optional[str] = None
#     status: Optional[str] = None


# class TeamResponse(TeamBase):
#     team_id: int
#     model_config = ConfigDict(from_attributes=True)


# # ============================================================================
# # MENTOR (TEAM ↔ FACULTY)
# # ============================================================================

# class MentorAssign(BaseModel):
#     team_id: int
#     faculty_id: int


# # ============================================================================
# # PROJECT SCHEMAS
# # ============================================================================

# class ProjectBase(BaseModel):
#     title: str
#     abstract: Optional[str] = None
#     domain: Optional[str] = None
#     report_link: Optional[str] = None
#     marks: Optional[int] = None


# class ProjectCreate(ProjectBase):
#     team_id: int


# class ProjectUpdate(BaseModel):
#     title: Optional[str] = None
#     abstract: Optional[str] = None
#     domain: Optional[str] = None
#     report_link: Optional[str] = None
#     marks: Optional[int] = None


# class ProjectResponse(ProjectBase):
#     project_id: int
#     team_id: int
#     model_config = ConfigDict(from_attributes=True)


# # ============================================================================
# # ARCHIVE SCHEMAS
# # ============================================================================

# class ArchiveBase(BaseModel):
#     title: str
#     sem: Optional[int] = None
#     abstract: Optional[str] = None
#     report_link: Optional[str] = None


# class ArchiveCreate(ArchiveBase):
#     pass


# class ArchiveUpdate(BaseModel):
#     title: Optional[str] = None
#     sem: Optional[int] = None
#     abstract: Optional[str] = None
#     report_link: Optional[str] = None


# class ArchiveResponse(ArchiveBase):
#     archive_id: int
#     model_config = ConfigDict(from_attributes=True)


# # ============================================================================
# # BOOKMARK SCHEMAS (TEAM ↔ ARCHIVE)
# # ============================================================================

# class BookmarkCreate(BaseModel):
#     team_id: int
#     archive_id: int
