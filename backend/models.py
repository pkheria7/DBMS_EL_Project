# models.py
import string
from sqlalchemy import (
    Column,
    String,
    Integer,
    ForeignKey,
    Text,
    Table,
    DateTime,
    Boolean,
    Index,
)
from sqlalchemy.orm import relationship
from database import Base


# ----------------------------
# ASSOCIATION TABLES
# ----------------------------

mentors_table = Table(
    "mentors",
    Base.metadata,
    Column("team_id", ForeignKey("team.team_id"), primary_key=True),
    Column("faculty_id", ForeignKey("faculty.faculty_id"), primary_key=True),
)

bookmarks_table = Table(
    "bookmarks",
    Base.metadata,
    Column("team_id", ForeignKey("team.team_id"), primary_key=True),
    Column("archive_id", ForeignKey("archive.archive_id"), primary_key=True),
)


# ----------------------------
# CORE TABLES
# ----------------------------

class Cluster(Base):
    __tablename__ = "cluster"

    cluster_id = Column(String, primary_key=True, index=True)
    cluster_name = Column(String(100), nullable=False)

    departments = relationship("Department", back_populates="cluster")






class Team(Base):
    __tablename__ = "team"

    team_id = Column(Integer, primary_key=True, index=True)
    team_name = Column(String(100), nullable=False)
    status = Column(String(50))

    students = relationship("Student", back_populates="team")
    project = relationship("Project", back_populates="team", uselist=False)
    mentors = relationship(
        "Faculty",
        secondary=mentors_table,
        back_populates="mentored_teams",
    )
    bookmarks = relationship(
        "Archive",
        secondary=bookmarks_table,
        back_populates="bookmarked_by_teams",
    )


class Student(Base):
    __tablename__ = "student"

    usn = Column(String(20), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    ph_no = Column(String(15))
    sem = Column(Integer)
    github = Column(String(255))
    resume = Column(String(255))

    dept_id = Column(String, ForeignKey("department.dept_id"))
    team_id = Column(Integer, ForeignKey("team.team_id"))

    department = relationship("Department", back_populates="students")
    team = relationship("Team", back_populates="students")
    skills = relationship("Skill", back_populates="student", cascade="all, delete")

    __table_args__ = (
        Index("ix_student_name", "name"),
        Index("ix_student_dept_sem", "dept_id", "sem"),
        Index("ix_student_team_id", "team_id"),
    )


class Skill(Base):
    __tablename__ = "skills"

    usn = Column(String(20), ForeignKey("student.usn"), primary_key=True)
    skill = Column(String(100), primary_key=True)

    student = relationship("Student", back_populates="skills")


class Department(Base):
    __tablename__ = "department"

    dept_id = Column(String, primary_key=True, index=True)
    dept_name = Column(String(100), nullable=False)

    cluster_id = Column(String, ForeignKey("cluster.cluster_id"))

    cluster = relationship("Cluster", back_populates="departments")
    students = relationship("Student", back_populates="department")
    faculty = relationship("Faculty", back_populates="department")

class Faculty(Base):
    __tablename__ = "faculty"

    faculty_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    ph_no = Column(String(15))
    designation = Column(String(50))

    dept_id = Column(String(100), ForeignKey("department.dept_id"))

    department = relationship("Department", back_populates="faculty")
    mentored_teams = relationship(
        "Team",
        secondary=mentors_table,
        back_populates="mentors",
    )

    __table_args__ = (
        Index("ix_faculty_name", "name"),
        Index("ix_faculty_designation", "designation"),
    )


class Project(Base):
    __tablename__ = "project"

    project_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    abstract = Column(Text)
    domain = Column(String(100))
    report_link = Column(String(255))
    phase1_marks = Column(Integer, default=0)
    phase2_marks = Column(Integer, default=0)
    marks = Column(Integer)  # final_marks - kept for backward compatibility

    # Feature A: Deadline management
    phase1_deadline = Column(DateTime, nullable=True)
    phase2_deadline = Column(DateTime, nullable=True)
    is_locked = Column(Boolean, default=False, nullable=False)

    # Feature B: Faculty feedback
    phase1_feedback = Column(Text, nullable=True)
    phase2_feedback = Column(Text, nullable=True)

    team_id = Column(Integer, ForeignKey("team.team_id"), unique=True)

    team = relationship("Team", back_populates="project")


class Archive(Base):
    __tablename__ = "archive"

    archive_id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("project.project_id"))
    title = Column(String(200), nullable=False)
    sem = Column(Integer)
    abstract = Column(Text)
    report_link = Column(String(255))

    bookmarked_by_teams = relationship(
        "Team",
        secondary=bookmarks_table,
        back_populates="bookmarks",
    )
