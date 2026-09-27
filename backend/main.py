from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import models
from database import engine
from router import student, faculty, teams, team_get, profile_update, projects, student_get, archives, auth, mentor, notifications, uploads, team_invites
from rate_limit import limiter

# create app first
app = FastAPI()

# rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # allow all origins (React frontend)
    allow_credentials=True,
    allow_methods=["*"],           # allows GET, POST, PUT, DELETE, OPTIONS
    allow_headers=["*"],           # allows JSON and custom headers
)

# create database tables
models.Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Team Management API"}

# include routers
app.include_router(auth.router)
app.include_router(student.router)
app.include_router(faculty.router)
app.include_router(teams.router)
app.include_router(team_get.router)
app.include_router(profile_update.router)
app.include_router(projects.router)
app.include_router(student_get.router)
app.include_router(archives.router)
app.include_router(mentor.router)
app.include_router(notifications.router)
app.include_router(uploads.router)
app.include_router(team_invites.router)