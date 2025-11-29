# models.py
from database import Base
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship


# -----------------------------
# TeamMembers association table (explicit model)
# -----------------------------
class TeamMembers(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)

    # relationships for the association object
    team = relationship("Teams", back_populates="members")
    student = relationship("Students", back_populates="members")


# -----------------------------
# Students Table
# -----------------------------
class Students(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True)
    usn = Column(String)
    name = Column(String)
    email = Column(String)
    department = Column(String)
    cluster = Column(String)
    semester = Column(String)
    skills = Column(String)
    resumelink = Column(String)
    githublink = Column(String)

    # association objects (TeamMembers)
    members = relationship("TeamMembers", back_populates="student", cascade="all, delete-orphan")

    # convenience many-to-many relationship to Teams via the association table
    teams = relationship(
        "Teams",
        secondary="team_members",
        back_populates="students",
        viewonly=True,  # set to False if you want to add to the secondary from Students side
    )


# -----------------------------
# Teams Table
# -----------------------------
class Teams(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    teamid = Column(Integer, unique=True, nullable=True)
    teamname = Column(String, nullable=True)
    cluster = Column(String, nullable=True)
    semester = Column(String, nullable=True)
    status = Column(String, default="active")  # e.g. active/inactive

    # FK to Faculty (mentor)
    mentor_id = Column(String, ForeignKey("faculty.id"), nullable=True)

    # association objects
    members = relationship("TeamMembers", back_populates="team", cascade="all, delete-orphan")

    # convenience many-to-many relationship to Students via the association table
    students = relationship(
        "Students",
        secondary="team_members",
        back_populates="teams",
        viewonly=True,
    )

    # relationship to mentor (Faculty)
    mentor = relationship("Faculty", back_populates="teams")

    # relationship to projects
    projects = relationship("Projects", back_populates="team", cascade="all, delete-orphan")


# -----------------------------
# Faculty Table
# -----------------------------
class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(String, primary_key=True)
    facultyid = Column(String)
    name = Column(String)
    department = Column(String)
    email = Column(String)

    # teams mentored by this faculty
    teams = relationship("Teams", back_populates="mentor")


# -----------------------------
# Projects Table
# -----------------------------
class Projects(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    projectid = Column(Integer)
    team_id = Column(Integer, ForeignKey("teams.id"))
    title = Column(String)
    description = Column(String)
    domain = Column(String)
    similarityscore = Column(Float)
    demovideolink = Column(String)
    year = Column(String)

    team = relationship("Teams", back_populates="projects")
    archives = relationship("Archives", back_populates="project", cascade="all, delete-orphan")


# -----------------------------
# Archives Table
# -----------------------------
class Archives(Base):
    __tablename__ = "archives"

    id = Column(Integer, primary_key=True)
    archiveid = Column(Integer)
    projecttitle = Column(String)
    domain = Column(String)
    year = Column(String)
    contactinfo = Column(String)

    project_id = Column(Integer, ForeignKey("projects.id"))
    project = relationship("Projects", back_populates="archives")
