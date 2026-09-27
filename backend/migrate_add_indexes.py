"""
Migration: Create indexes on Postgres tables for search performance.
Safe to run multiple times — uses CREATE INDEX IF NOT EXISTS.
"""
from sqlalchemy import text
from database import engine

INDEXES = [
    # Student — hot search/filter columns
    "CREATE INDEX IF NOT EXISTS ix_student_name       ON student (name)",
    "CREATE INDEX IF NOT EXISTS ix_student_dept_sem   ON student (dept_id, sem)",
    "CREATE INDEX IF NOT EXISTS ix_student_team_id    ON student (team_id)",
    # Faculty — search columns
    "CREATE INDEX IF NOT EXISTS ix_faculty_name        ON faculty (name)",
    "CREATE INDEX IF NOT EXISTS ix_faculty_designation ON faculty (designation)",
    # Project — filter by team and marks
    "CREATE INDEX IF NOT EXISTS ix_project_team_id    ON project (team_id)",
    "CREATE INDEX IF NOT EXISTS ix_project_is_locked  ON project (is_locked)",
    # Archive — title search
    "CREATE INDEX IF NOT EXISTS ix_archive_title      ON archive (title)",
]

def run():
    with engine.begin() as conn:
        for stmt in INDEXES:
            conn.execute(text(stmt))
            name = stmt.split("ix_")[1].split(" ")[0]
            print(f"  ✓ ix_{name}")
    print("All indexes created.")

if __name__ == "__main__":
    run()
