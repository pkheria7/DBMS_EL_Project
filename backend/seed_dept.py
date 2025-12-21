from database import SessionLocal
from models import Cluster, Department

# ---------------- CLUSTERS ---------------- #

CLUSTERS = {
    "CSE": "Computer Science & Engineering",
    "ECE": "Electronics & Communication Engineering",
    "ME": "Mechanical Engineering",
    "CV": "Civil Engineering",
}

# ---------------- DEPARTMENTS ---------------- #

DEPARTMENTS = {
    "AI": ("Artificial Intelligence & Machine Learning", "CSE"),
    "CD": ("Computer Science & Design", "CSE"),
    "CS": ("Computer Science & Engineering", "CSE"),
    "CY": ("Cyber Security", "CSE"),
    "IS": ("Information Science & Engineering", "CSE"),

    "EC": ("Electronics & Communication Engineering", "ECE"),
    "EE": ("Electrical & Electronics Engineering", "ECE"),
    "EI": ("Electronics & Instrumentation Engineering", "ECE"),
    "ET": ("Electronics & Telecommunication Engineering", "ECE"),

    "AS": ("Aerospace Engineering", "ME"),
    "IM": ("Industrial Engineering & Management", "ME"),
    "ME": ("Mechanical Engineering", "ME"),

    "CV": ("Civil Engineering", "CV"),
    "BT": ("Biotechnology", "CV"),
    "CH": ("Chemical Engineering", "CV"),
}

# ---------------- SEED LOGIC ---------------- #

def seed_clusters_and_departments():
    db = SessionLocal()

    # ---- Insert Clusters ---- #
    for cid, cname in CLUSTERS.items():
        if not db.query(Cluster).filter_by(cluster_id=cid).first():
            db.add(Cluster(
                cluster_id=cid,
                cluster_name=cname
            ))

    db.flush()

    # ---- Insert Departments ---- #
    for dept_id, (dept_name, cluster_id) in DEPARTMENTS.items():
        if not db.query(Department).filter_by(dept_id=dept_id).first():
            db.add(Department(
                dept_id=dept_id,
                dept_name=dept_name,
                cluster_id=cluster_id
            ))

    db.commit()
    db.close()

    print("✅ Clusters and Departments seeded with proper academic names")

# ---------------- RUN ---------------- #

if __name__ == "__main__":
    seed_clusters_and_departments()
