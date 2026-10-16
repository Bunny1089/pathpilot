import os
from typing import List

class EmbeddingService:
    def __init__(self):
        self.model = None

    @property
    def is_testing(self) -> bool:
        """
        Determine if we are running in unit test mode dynamically.
        """
        return os.getenv("TESTING", "False").lower() in ["true", "1", "yes"]

    def _load_model(self):
        """
        Lazily loads the SentenceTransformer model to prevent startup latency 
        unless embeddings are actually requested.
        """
        if self.model is None and not self.is_testing:
            from sentence_transformers import SentenceTransformer
            print("Loading BAAI/bge-small-en-v1.5 embedding model onto memory...")
            self.model = SentenceTransformer("BAAI/bge-small-en-v1.5")
            print("Model loaded successfully.")

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generates 384-dimensional normalized vector embeddings for a list of document texts.
        """
        if self.is_testing:
            # Mock BGE embedding (384 dimensions)
            return [[0.1] * 384 for _ in texts]
            
        self._load_model()
        # Normalize embeddings to enable direct cosine similarity comparisons
        embeddings = self.model.encode(texts, normalize_embeddings=True)
        return embeddings.tolist()

    def get_query_embedding(self, query: str) -> List[float]:
        """
        Generates an embedding for a user query. Prepend search instructions 
        as recommended by BGE v1.5 guidelines for asymmetric search tasks.
        """
        if self.is_testing:
            return [0.1] * 384
            
        self._load_model()
        # Inject asymmetric search instruction prefix
        instructional_query = f"Represent this sentence for searching relevant passages: {query}"
        embedding = self.model.encode(instructional_query, normalize_embeddings=True)
        return embedding.tolist()

# Export a single global instance
embedding_service = EmbeddingService()
