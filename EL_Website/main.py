from fastapi import FastAPI
import models
from database import engine
from router import student , faculty , teams, team_get , profile_update, projects

app = FastAPI()

models.Base.metadata.create_all(bind=engine)

app.include_router(student.router)
app.include_router(faculty.router)
app.include_router(teams.router)
app.include_router(team_get.router)
app.include_router(profile_update.router)
app.include_router(projects.router)