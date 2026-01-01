from pathlib import Path

DB_FILE      = Path("data/projects.db")
FAISS_INDEX  = Path("data/index.faiss")
MODEL_DIR    = Path("models/energy-sbert")   # fine-tuned optional
EMB_DIM      = 384                           # all-MiniLM-L6-v2
MIN_SCORE    = 0.50                          # 50 %
TOP_K        = 100                           # max vector pre-filter

