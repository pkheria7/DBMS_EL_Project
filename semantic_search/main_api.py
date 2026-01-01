from fastapi import FastAPI
from pydantic import BaseModel
from db import init_db
from encoder import embed, extract_triples
from crud import search_similar
from index import build_index
import numpy as np

app = FastAPI(title="DeepProjectMatch-API", version="1.0.0")

class ProjectIn(BaseModel):
    title: str
    abstract: str

@app.on_event("startup")
def startup():
    init_db()

@app.post("/search")
def search_endpoint(payload: ProjectIn):
    vec = embed(payload.title + " " + payload.abstract)
    gr  = extract_triples(payload.title + " " + payload.abstract)
    hits = search_similar(payload.title, payload.abstract, vec, gr)
    return {"hits": hits}

@app.post("/add")
def add_endpoint(payload: ProjectIn):
    from db import insert_project
    vec = embed(payload.title + " " + payload.abstract)
    gr  = extract_triples(payload.title + " " + payload.abstract)
    insert_project(payload.title, payload.abstract,
                   vec.astype("float32").tobytes(), gr)
    # rebuild index
    rows = __import__("db").fetch_all()
    embs = np.vstack([np.frombuffer(r[3], dtype="float32") for r in rows])
    build_index(embs)
    return {"status": "stored"}