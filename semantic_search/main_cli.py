import typer, rich.table, rich.console
from db import init_db, insert_project
from encoder import embed, extract_triples
from crud import search_similar
from index import build_index
import numpy as np

app = typer.Typer(help="DeepProjectMatch – Python 3.12")

@app.command()
def add(title: str, abstract: str):
    """Insert a new project into DB."""
    init_db()
    vec = embed(title + " " + abstract)
    gr  = extract_triples(title + " " + abstract)
    insert_project(title, abstract, vec.astype("float32").tobytes(), gr)
    # rebuild vector index
    rows = fetch_all()
    embs = np.vstack([np.frombuffer(r[3], dtype="float32") for r in rows])
    build_index(embs)
    typer.echo("✅ Stored & index rebuilt.")

@app.command()
def search(title: str, abstract: str):
    """Find projects ≥ 50 % similarity."""
    init_db()
    vec = embed(title + " " + abstract)
    gr  = extract_triples(title + " " + abstract)
    hits = search_similar(title, abstract, vec, gr)
    console = rich.console.Console()
    table   = rich.table.Table(title=f"Hits ≥ 50 %  –  {len(hits)} found")
    table.add_column("Score %", style="cyan", width=8)
    table.add_column("Title", style="bold")
    table.add_column("Abstract (140 chars)", style="dim")
    for h in hits:
        table.add_row(str(h["score"]), h["title"], h["abstract"][:140] + "…")
    console.print(table)

# re-export for index rebuild
from db import fetch_all

if __name__ == "__main__":
    app()