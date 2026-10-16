import chromadb
from typing import List, Dict, Any

class VectorStore:
    def __init__(self, persist_directory: str = "./chroma_db"):
        """
        Initialize the persistent local ChromaDB client.
        """
        self.client = chromadb.PersistentClient(path=persist_directory)
        # Create or fetch our resume chunks collection using Cosine similarity
        self.collection = self.client.get_or_create_collection(
            name="resume_chunks",
            metadata={"hnsw:space": "cosine"}
        )

    def index_resume_chunks(self, user_email: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
        """
        Safely clears any previous resume vector indexes for the user and adds new chunks.
        """
        # 1. Clear old indexes to make chunk indexing idempotent
        self.delete_user_chunks(user_email)
        
        if not chunks or not embeddings:
            return
            
        ids = []
        documents = []
        metadatas = []
        
        for i, chunk in enumerate(chunks):
            chunk_id = f"{user_email}_chunk_{chunk['chunk_index']}"
            ids.append(chunk_id)
            documents.append(chunk["content"])
            metadatas.append({
                "user_email": user_email,
                "section": chunk["section"],
                "chunk_index": chunk["chunk_index"]
            })
            
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

    def query_resume_chunks(self, user_email: str, query_embedding: List[float], limit: int = 5) -> List[Dict[str, Any]]:
        """
        Queries ChromaDB for nearest matching resume segments using cosine similarity,
        filtered by the active user's email.
        """
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=limit,
            where={"user_email": user_email}
        )
        
        formatted_results = []
        
        # Verify that we received valid search records
        if results and "documents" in results and results["documents"] and results["documents"][0]:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            ids = results["ids"][0]
            distances = results.get("distances", [[1.0] * len(docs)])[0]
            
            for doc, meta, cid, dist in zip(docs, metas, ids, distances):
                # Cosine distance to similarity conversion: similarity = 1.0 - distance
                similarity = round(1.0 - dist, 4)
                formatted_results.append({
                    "id": cid,
                    "content": doc,
                    "section": meta.get("section", "Unknown"),
                    "chunk_index": meta.get("chunk_index", -1),
                    "similarity": similarity
                })
                
        return formatted_results

    def delete_user_chunks(self, user_email: str):
        """
        Deletes all vector indexes registered for the specified user.
        """
        self.collection.delete(
            where={"user_email": user_email}
        )

# Instantiates a default global store client relative to the backend project root
vector_store = VectorStore()
