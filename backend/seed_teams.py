from collections import defaultdict, deque
from database import SessionLocal
from models import Student, Team

# ---------------- CONFIG ---------------- #

TOTAL_TEAMS = 20

CLUSTER_PARENT_MAP = {
    "AI": "CS", "CD": "CS", "CS": "CS", "CY": "CS", "IS": "CS",
    "EC": "EC", "EE": "EC", "EI": "EC", "ET": "EC",
    "AS": "ME", "IM": "ME", "ME": "ME",
    "CV": "CV", "BT": "CV", "CH": "CV",
}

# ---------------- HELPERS ---------------- #

def parent_cluster(branch: str) -> str | None:
    return CLUSTER_PARENT_MAP.get(branch)

# ---------------- FAST SEED ---------------- #

def seed_teams_fast():
    db = SessionLocal()

    students = (
        db.query(Student)
        .filter(Student.team_id == None)
        .all()
    )

    if len(students) < TOTAL_TEAMS * 4:
        raise RuntimeError("❌ Not enough students")

    # Bucket: parent_cluster -> sem -> branch -> deque(students)
    bucket = defaultdict(lambda: defaultdict(lambda: defaultdict(deque)))

    for s in students:
        if not s.dept_id or not s.sem:
            continue
        p = parent_cluster(s.dept_id)
        if p:
            bucket[p][s.sem][s.dept_id].append(s)

    created = 0

    for cluster, sem_map in bucket.items():
        if created >= TOTAL_TEAMS:
            break

        for sem, branch_map in sem_map.items():
            branches = list(branch_map.keys())

            while created < TOTAL_TEAMS:
                # sort branches by availability (largest first)
                branches = sorted(branches, key=lambda b: len(branch_map[b]), reverse=True)

                # need at least 3 branches for size-5 patterns
                available = [b for b in branches if len(branch_map[b]) > 0]
                if len(available) < 3:
                    break

                # ---- build team ----
                team_students = []

                # pattern: 2+2+1 (size 5)
                b1, b2, b3 = available[:3]

                if len(branch_map[b1]) >= 2 and len(branch_map[b2]) >= 2:
                    team_students.extend([branch_map[b1].popleft() for _ in range(2)])
                    team_students.extend([branch_map[b2].popleft() for _ in range(2)])
                    team_students.append(branch_map[b3].popleft())

                # fallback: 2+1+1 (size 4)
                elif len(branch_map[b1]) >= 2:
                    team_students.extend([branch_map[b1].popleft() for _ in range(2)])
                    team_students.append(branch_map[b2].popleft())
                    team_students.append(branch_map[b3].popleft())

                else:
                    break  # no valid pattern left

                # Ensure all students are from the same cluster and semester
                if len(set(s.sem for s in team_students)) > 1 or len(set(parent_cluster(s.dept_id) for s in team_students)) > 1:
                    raise RuntimeError(f"❌ Team members from different clusters or semesters detected in cluster {cluster}, semester {sem}")

                # create team
                team = Team(
                    team_name=f"{cluster}_SEM_{sem}_TEAM_{created + 1}",
                    status="active"
                )
                db.add(team)
                db.flush()

                for s in team_students:
                    s.team_id = team.team_id

                created += 1

                if created >= TOTAL_TEAMS:
                    break

    if created < TOTAL_TEAMS:
        raise RuntimeError(f"❌ Only {created} teams could be formed")

    db.commit()
    db.close()

    print(f"⚡ Successfully created {created} teams (FAST MODE)")

# ---------------- RUN ---------------- #

if __name__ == "__main__":
    seed_teams_fast()