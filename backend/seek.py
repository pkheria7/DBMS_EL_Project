import random
from database import SessionLocal
from models import Student, Skill

# ---------------- CONFIG ---------------- #

TOTAL_STUDENTS = 150

CLUSTER_PARENT_MAP = {
    "AI": "CS", "CD": "CS", "CS": "CS", "CY": "CS", "IS": "CS",
    "EC": "EC", "EE": "EC", "EI": "EC", "ET": "EC",
    "AS": "ME", "IM": "ME", "ME": "ME",
    "CV": "CV", "BT": "CV", "CH": "CV",
}

PARENT_BRANCH_TO_DEPT = {
    "CS": "cse",
    "EC": "ece",
    "ME": "me",
    "CV": "cv",
}

SEM_YEAR_MAP = {
    1: "25", 2: "25",
    3: "24", 4: "24",
    5: "23", 6: "23"
}

SKILLS_POOL = [
    "Python", "C++", "Java", "SQL", "Data Structures",
    "Algorithms", "Machine Learning", "Deep Learning",
    "Web Development", "FastAPI", "React",
    "Cloud Computing", "Docker", "Git",
    "Computer Networks", "DBMS", "Operating Systems",
    "Data Analysis", "NLP", "Computer Vision",
    "Cyber Security", "Blockchain", "IoT"
]

FIRST_NAMES = [
    "anil", "rohan", "akash", "rahul", "kiran", "arjun",
    "suresh", "manoj", "varun", "aditya", "tejas",
    "harsha", "nithin", "pranav", "vivek"
]

# ---------------- SEED LOGIC ---------------- #

def seed_students():
    db = SessionLocal()

    used_usns = set()
    students = []
    skills = []

    # Decide academic cycle ONCE
    sem_cycle = random.choice([
        [1, 3, 5],   # ODD batch
        [2, 4, 6]    # EVEN batch
    ])

    while len(students) < TOTAL_STUDENTS:
        branch = random.choice(list(CLUSTER_PARENT_MAP.keys()))
        parent_branch = CLUSTER_PARENT_MAP[branch]

        sem = random.choice(sem_cycle)
        year = SEM_YEAR_MAP[sem]

        roll = random.randint(1, 80)
        roll_str = str(roll).zfill(3)

        usn = f"1RV{year}{branch}{roll_str}"
        if usn in used_usns:
            continue
        used_usns.add(usn)

        fname = random.choice(FIRST_NAMES)
        email = f"{fname}.{branch.lower()}{year}@rvce.edu.in"

        dept_id = PARENT_BRANCH_TO_DEPT[parent_branch]

        student = Student(
            usn=usn,
            name=f"{fname.capitalize()} Student",
            email=email,
            ph_no=f"9{random.randint(100000000, 999999999)}",
            sem=sem,
            github=f"https://github.com/{fname}{roll}",
            resume="https://drive.google.com/resume",
            dept_id=dept_id,
            team_id=None
        )

        students.append(student)

        # Assign 2–4 skills
        for sk in random.sample(SKILLS_POOL, random.randint(2, 4)):
            skills.append(Skill(usn=usn, skill=sk))

    db.add_all(students)
    db.add_all(skills)
    db.commit()
    db.close()

    cycle_type = "ODD" if sem_cycle[0] % 2 == 1 else "EVEN"
    print(f"✅ Inserted {len(students)} students | {cycle_type} semester batch")

if __name__ == "__main__":
    seed_students()