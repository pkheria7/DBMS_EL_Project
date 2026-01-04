"""
Semantic Search Service for Archive Similarity Detection
Stores only archive_id and vector embeddings in Qdrant for efficiency.
"""
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
import os


class SemanticSearch:
    def __init__(self):
        # Initialize Qdrant client with local storage
        storage_path = os.path.join(os.path.dirname(__file__), "qdrant_data")
        self.client = QdrantClient(path=storage_path)
        
        # Initialize sentence transformer model
        self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        self.collection_name = "archives"
        self.vector_size = 384  # all-MiniLM-L6-v2 produces 384-dimensional vectors
        
        # Ensure collection exists
        self._ensure_collection()
    
    def _ensure_collection(self):
        """Create collection if it doesn't exist"""
        try:
            self.client.get_collection(self.collection_name)
        except:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=self.vector_size, distance=Distance.COSINE)
            )
    
    def _generate_embedding(self, text: str):
        """Convert text to vector embedding"""
        return self.model.encode(text).tolist()
    
    def add_archive(self, archive_id: int, title: str, abstract: str):
        """
        Add archive to vector database
        Stores only archive_id and vector embedding
        """
        # Combine title and abstract for embedding
        combined_text = f"{title} {abstract}"
        vector = self._generate_embedding(combined_text)
        
        # Store minimal payload - only archive_id
        point = PointStruct(
            id=archive_id,
            vector=vector,
            payload={"archive_id": archive_id}
        )
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=[point]
        )
    
    def search_similar(self, query_text: str, limit: int = 5, score_threshold: float = 0.3):
        """
        Search for similar archives by text query
        Returns list of archive_ids with similarity scores
        """
        query_vector = self._generate_embedding(query_text)
        
        results = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=limit,
            score_threshold=score_threshold
        ).points
        
        return [
            {
                "archive_id": result.payload["archive_id"],
                "similarity_score": result.score
            }
            for result in results
            if result.payload is not None
        ]
    
    def delete_archive(self, archive_id: int):
        """Remove archive from vector database"""
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=[archive_id]
        )


# Singleton instance
semantic_search = SemanticSearch()
