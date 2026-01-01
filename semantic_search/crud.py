import numpy as np
from db import fetch_all
from scorer import score_pair
from index import load_index, search_vector
from config import MIN_SCORE, TOP_K

def search_similar(title: str, abstract: str, emb: np.ndarray, graph: list) -> list[dict]:
    index = load_index()
    scores, ids = search_vector(emb, index, TOP_K)
    keep_ids = set(ids[scores >= MIN_SCORE])

    rows = fetch_all()
    hits = []
    for rid, rtitle, rabs, remb_bytes, rgraph_json in rows:
        if rid not in keep_ids:
            continue
        remb = np.frombuffer(remb_bytes, dtype="float32")
        rgr  = __import__("json").loads(rgraph_json)
        final = score_pair(title, abstract, emb, graph,
                           rtitle, rabs, remb, rgr)
        if final >= MIN_SCORE:
            hits.append({
                "id": rid,
                "title": rtitle,
                "abstract": rabs,
                "score": round(final * 100, 1)
            })
    hits.sort(key=lambda x: x["score"], reverse=True)
    return hits