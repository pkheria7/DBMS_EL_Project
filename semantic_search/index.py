import faiss, numpy as np
from config import FAISS_INDEX, EMB_DIM, TOP_K

FAISS_INDEX.parent.mkdir(parents=True, exist_ok=True)

def build_index(embs: np.ndarray) -> None:
    idx = faiss.IndexFlatIP(EMB_DIM)   # inner-product = cosine
    idx.add(embs.astype("float32"))
    faiss.write_index(idx, str(FAISS_INDEX))

def load_index() -> faiss.IndexFlatIP:
    if not FAISS_INDEX.exists():
        raise FileNotFoundError("Index not built yet.")
    return faiss.read_index(str(FAISS_INDEX))

def search_vector(query: np.ndarray, index: faiss.IndexFlatIP, top_k: int = TOP_K):
    scores, ids = index.search(query.reshape(1, -1).astype("float32"), top_k)
    return scores[0], ids[0]   # 1-D arrays