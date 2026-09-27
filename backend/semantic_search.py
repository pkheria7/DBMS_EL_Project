"""
Semantic Search Service — uses HuggingFace Inference API for embeddings.
Replaces the local sentence-transformers model to eliminate the ~500MB RAM cost.
Vectors are stored in a local Qdrant instance (migrated to Qdrant Cloud in Priority 8).
"""
import os
import requests
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
HF_API_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"
VECTOR_SIZE = 384


class SemanticSearch:
    def __init__(self):
        storage_path = os.path.join(os.path.dirname(__file__), "qdrant_data")
        self.client = QdrantClient(path=storage_path)
        self.collection_name = "archives"
        self._ensure_collection()

    def _ensure_collection(self):
        try:
            self.client.get_collection(self.collection_name)
        except Exception:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )

    def _generate_embedding(self, text: str) -> list[float]:
        if not HF_TOKEN:
            raise RuntimeError("HF_TOKEN is not set in .env — cannot generate embeddings.")

        response = requests.post(
            HF_API_URL,
            headers={"Authorization": f"Bearer {HF_TOKEN}"},
            json={"inputs": text},
            timeout=30,
        )
        response.raise_for_status()

        data = response.json()
        # HF feature-extraction returns [[float, ...]] — unwrap the outer list
        if isinstance(data[0], list):
            return data[0]
        return data

    def add_archive(self, archive_id: int, title: str, abstract: str):
        combined_text = f"{title} {abstract}"
        vector = self._generate_embedding(combined_text)

        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                PointStruct(
                    id=archive_id,
                    vector=vector,
                    payload={"archive_id": archive_id, "title": title, "abstract": abstract},
                )
            ],
        )

    def search_similar(self, query_text: str, limit: int = 5, score_threshold: float = 0.3):
        query_vector = self._generate_embedding(query_text)

        results = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=limit,
            score_threshold=score_threshold,
        ).points

        return [
            {
                "archive_id": result.payload["archive_id"],
                "similarity_score": result.score,
            }
            for result in results
            if result.payload is not None
        ]

    def delete_archive(self, archive_id: int):
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=[archive_id],
        )


# Singleton instance
semantic_search = SemanticSearch()
