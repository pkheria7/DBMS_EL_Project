from collections import defaultdict
from database import SessionLocal
from models import Team, Faculty, mentors_table

# ---------------- CONFIG ---------------- #

MENTORS_PER_PROJECT = 2
MAX_PROJECTS_PER_FACULTY = 5

# ---------------- SEED LOGIC ---------------- #

def seed_mentors():
    db = SessionLocal()

    # Fetch teams that have a project
    teams = (
        db.query(Team)
        .join(Team.project)
        .all()
    )

    faculty = db.query(Faculty).all()

    if not faculty:
        raise RuntimeError("❌ No faculty found in database")

    # Track mentor load
    faculty_load = defaultdict(int)

    # Preload existing mentor assignments (idempotency safety)
    existing = db.execute(mentors_table.select()).fetchall()
    for team_id, faculty_id in existing:
        faculty_load[faculty_id] += 1

    created = 0

    for team in teams:
        # Skip if team already has mentors
        if team.mentors:
            continue

        # Pick faculty with least load (< max)
        available_faculty = sorted(
            [f for f in faculty if faculty_load[f.faculty_id] < MAX_PROJECTS_PER_FACULTY],
            key=lambda f: faculty_load[f.faculty_id]
        )

        if len(available_faculty) < MENTORS_PER_PROJECT:
            raise RuntimeError("❌ Not enough available faculty to assign mentors")

        chosen = available_faculty[:MENTORS_PER_PROJECT]

        for f in chosen:
            team.mentors.append(f)
            faculty_load[f.faculty_id] += 1

        created += 1

    db.commit()
    db.close()

    print(f"✅ Mentors assigned to {created} teams (2 mentors each)")

# ---------------- RUN ---------------- #

if __name__ == "__main__":
    seed_mentors()
