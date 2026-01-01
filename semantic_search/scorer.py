import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def tfidf_sim(a: str, b: str) -> float:
    vect = TfidfVectorizer(stop_words="english", ngram_range=(1, 3))
    m    = vect.fit_transform([a, b])
    return float(cosine_similarity(m[0], m[1])[0, 0])

def graph_sim(g1: list, g2: list) -> float:
    s1, s2 = map(set, (map(tuple, g1), map(tuple, g2)))
    if not s1 and not s2:
        return 1.0
    return len(s1 & s2) / len(s1 | s2)

def score_pair(title1: str, abs1: str, emb1: np.ndarray, graph1: list,
               title2: str, abs2: str, emb2: np.ndarray, graph2: list) -> float:
    sem = float(emb1 @ emb2)      # cosine (normed)
    lex = tfidf_sim(abs1, abs2)
    gr  = graph_sim(graph1, graph2)
    return 0.6 * sem + 0.2 * lex + 0.2 * gr