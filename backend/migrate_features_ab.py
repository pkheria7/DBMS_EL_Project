"""
Migration: Add deadline and feedback fields to project table.
Covers Feature A (deadlines) and Feature B (faculty feedback).
Safe to run multiple times — skips columns that already exist.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "WHOLE_INFO.db")

NEW_COLUMNS = [
    ("phase1_deadline", "DATETIME"),
    ("phase2_deadline", "DATETIME"),
    ("is_locked",       "INTEGER NOT NULL DEFAULT 0"),
    ("phase1_feedback", "TEXT"),
    ("phase2_feedback", "TEXT"),
]

def get_existing_columns(cursor, table):
    cursor.execute(f"PRAGMA table_info({table})")
    return {row[1] for row in cursor.fetchall()}

def run():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}. Start the app once to create it, then re-run this script.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    existing = get_existing_columns(cursor, "project")
    added = []
    skipped = []

    for col_name, col_type in NEW_COLUMNS:
        if col_name in existing:
            skipped.append(col_name)
        else:
            cursor.execute(f"ALTER TABLE project ADD COLUMN {col_name} {col_type}")
            added.append(col_name)

    conn.commit()
    conn.close()

    if added:
        print(f"Added columns: {', '.join(added)}")
    if skipped:
        print(f"Already existed (skipped): {', '.join(skipped)}")
    print("Migration complete.")

if __name__ == "__main__":
    run()
