import random
from database import SessionLocal
from models import Team, Project

# ---------------- CONFIG ---------------- #

PROJECT_DOMAINS = [
    "Artificial Intelligence",
    "Machine Learning",
    "Web Development",
    "Cyber Security",
    "Data Science",
    "Internet of Things",
    "Blockchain",
    "Cloud Computing",
    "Computer Vision",
    "Natural Language Processing"
]

PROJECT_TITLES = [
    "Smart Attendance System",
    "AI-Based Recommendation Engine",
    "Secure Online Voting Platform",
    "Traffic Prediction System",
    "Student Performance Analytics",
    "Automated Resume Screening",
    "Smart Parking Management",
    "Real-Time Chat Application",
    "Fraud Detection System",
    "Healthcare Monitoring Platform"
]

ABSTRACTS = [
    "This project focuses on designing an efficient and scalable solution using modern technologies.",
    "The system aims to solve real-world problems by leveraging data-driven approaches.",
    "This application integrates automation and analytics to improve accuracy and performance.",
    "The project emphasizes security, scalability, and user experience.",
    "A comprehensive solution built using contemporary software engineering practices."
]

# ---------------- SEED LOGIC ---------------- #

def seed_projects():
    db = SessionLocal()

    teams = db.query(Team).all()

    created = 0

    for team in teams:
        # Skip if project already exists
        if team.project is not None:
            continue

        project = Project(
            title=random.choice(PROJECT_TITLES),
            domain=random.choice(PROJECT_DOMAINS),
            abstract=random.choice(ABSTRACTS),
            report_link="https://drive.google.com/project-report",
            marks=random.randint(60, 100),
            team_id=team.team_id
        )

        db.add(project)
        created += 1

    db.commit()
    db.close()

    print(f"✅ Created {created} projects (1 per team)")

# ---------------- RUN ---------------- #

if __name__ == "__main__":
    seed_projects()
