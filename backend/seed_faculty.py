import random
from database import SessionLocal
from models import Faculty

# ---------------- CONFIG ---------------- #

TOTAL_FACULTY = 50

FACULTY_NAMES = [
    "anil", "suresh", "mahesh", "ramesh", "prakash", "sridhar",
    "raghav", "narayan", "venkatesh", "hariprasad",
    "shankar", "ganesh", "krishna", "murthy", "lokesh",
    "ravindra", "subramanya", "chandrashekar", "keshav", "aravind",
    "sunil", "ajith", "vinod", "satish", "manjunath",
    "pradeep", "santosh", "ravi", "mohan", "ashok",
    "vijay", "naresh", "rajesh", "dinesh", "kumar",
    "srikanth", "srinivas", "uday", "harsha", "tejas",
    "arjun", "pavan", "naveen", "karthik", "shashank",
    "sudhir", "bharath", "yogesh", "chetan", "raghu"
]

DEPARTMENTS = [
    "CS", "IS", "AI", "EC", "EE", "ME", "CV", "BT", "CH"
]

DESIGNATIONS = [
    "Assistant Professor",
    "Associate Professor",
    "Professor"
]

# ---------------- SEED LOGIC ---------------- #

def seed_faculty():
    db = SessionLocal()

    used_emails = set()
    faculty_list = []

    i = 0
    while len(faculty_list) < TOTAL_FACULTY:
        fname = FACULTY_NAMES[i % len(FACULTY_NAMES)]
        dept = random.choice(DEPARTMENTS)

        email = f"{fname}@rvce.edu.in"

        # ensure uniqueness (important)
        if email in used_emails:
            i += 1
            continue

        used_emails.add(email)

        faculty = Faculty(
            name=f"Dr {fname.capitalize()}",
            email=email,
            ph_no=f"080{random.randint(1000000, 9999999)}",
            designation=random.choice(DESIGNATIONS),
            dept_id=dept
        )

        faculty_list.append(faculty)
        i += 1

    db.add_all(faculty_list)
    db.commit()
    db.close()

    print(f"✅ Successfully added {len(faculty_list)} faculty members")

# ---------------- RUN ---------------- #

if __name__ == "__main__":
    seed_faculty()
