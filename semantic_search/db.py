import sqlite3, contextlib, json
from config import DB_FILE

DB_FILE.parent.mkdir(parents=True, exist_ok=True)

@contextlib.contextmanager
def conn_ctx():
    con = sqlite3.connect(DB_FILE, isolation_level=None)
    try:
        yield con
    finally:
        con.close()

def init_db() -> None:
    with conn_ctx() as con:
        con.execute("""
            CREATE TABLE IF NOT EXISTS projects(
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                title     TEXT NOT NULL,
                abstract  TEXT NOT NULL,
                embedding BLOB NOT NULL,
                graph     TEXT NOT NULL
            );
        """)

def insert_project(title: str, abstract: str, emb_bytes: bytes, graph: list) -> None:
    with conn_ctx() as con:
        con.execute(
            "INSERT INTO projects(title, abstract, embedding, graph) VALUES (?,?,?,?)",
            (title, abstract, emb_bytes, json.dumps(graph))
        )

def fetch_all() -> list[tuple]:
    with conn_ctx() as con:
        cur = con.execute("SELECT id, title, abstract, embedding, graph FROM projects")
        return cur.fetchall()