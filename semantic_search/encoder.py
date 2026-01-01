import spacy, numpy as np
from sentence_transformers import SentenceTransformer
from config import MODEL_DIR, EMB_DIM

def _load_model() -> SentenceTransformer:
    if MODEL_DIR.exists():
        return SentenceTransformer(str(MODEL_DIR))
    return SentenceTransformer("all-MiniLM-L6-v2")

MODEL = _load_model()
nlp   = spacy.load("en_core_web_sm", disable=["ner", "lemmatizer"])
nlp.enable_pipe("senter")

# ---------- public ----------
def embed(text: str) -> np.ndarray:
    return MODEL.encode(text, normalize_embeddings=True, convert_to_numpy=True)

def extract_triples(text: str) -> list[list[str]]:
    triples = []
    for sent in nlp(text).sents:
        root = next((t for t in sent if t.dep_ == "ROOT" and t.pos_ == "VERB"), None)
        if not root:
            continue
        subj = " ".join(w.text for w in root.lefts  if w.dep_ in {"nsubj", "nsubjpass"})
        obj  = " ".join(w.text for w in root.rights if w.dep_ in {"dobj", "pobj", "attr"})
        if subj and obj:
            triples.append([subj, root.lemma_, obj])
    return triples