import pytest
import tempfile
import shutil
import io
from sqlalchemy.orm import Session
from backend.app.services.vector_store import VectorStore
from backend.app.models.user import User
from backend.app.core.config import settings

@pytest.fixture
def test_vs():
    """
    Yields an isolated, temporary ChromaDB VectorStore instance
    and cleans up its files on teardown.
    """
    tmp_dir = tempfile.mkdtemp()
    vs = VectorStore(persist_directory=tmp_dir)
    yield vs
    # Release handles and force garbage collection to unlock files on Windows
    vs.client = None
    import gc
    gc.collect()
    shutil.rmtree(tmp_dir, ignore_errors=True)

def test_indexing_and_query_retrieval(test_vs):
    """
    Verify that chunks can be indexed and queried with similarity metrics.
    """
    email = "test@pathpilot.ai"
    chunks = [
        {"chunk_index": 0, "section": "Skills", "content": "Python, SQL, FastAPI"},
        {"chunk_index": 1, "section": "Experience", "content": "ML Intern at TechCorp"}
    ]
    # Build orthogonal vectors to prevent cosine distance ties
    v0 = [0.0] * 384
    v0[0] = 1.0
    v1 = [0.0] * 384
    v1[1] = 1.0
    embeddings = [v0, v1]
    
    test_vs.index_resume_chunks(email, chunks, embeddings)
    
    # Query vector matching chunk 1
    query_vector = v1
    results = test_vs.query_resume_chunks(email, query_vector, limit=2)
    
    assert len(results) == 2
    # Chunk 1 (Experience) should be the closest match
    assert results[0]["section"] == "Experience"
    assert "ML Intern" in results[0]["content"]
    assert results[0]["similarity"] is not None

def test_idempotency_clears_old_records(test_vs):
    """
    Verify indexing deletes previous chunks for the same user email.
    """
    email = "test@pathpilot.ai"
    chunks_v1 = [{"chunk_index": 0, "section": "Skills", "content": "FastAPI"}]
    v0 = [0.0] * 384
    v0[0] = 1.0
    embeddings_v1 = [v0]
    
    test_vs.index_resume_chunks(email, chunks_v1, embeddings_v1)
    
    # Upload new version
    chunks_v2 = [
        {"chunk_index": 0, "section": "Skills", "content": "Django"},
        {"chunk_index": 1, "section": "Education", "content": "Stanford"}
    ]
    v1 = [0.0] * 384
    v1[1] = 1.0
    v2 = [0.0] * 384
    v2[2] = 1.0
    embeddings_v2 = [v1, v2]
    
    test_vs.index_resume_chunks(email, chunks_v2, embeddings_v2)
    
    # Querying should yield v2 records only
    results = test_vs.query_resume_chunks(email, v1, limit=5)
    assert len(results) == 2
    contents = [r["content"] for r in results]
    assert "Django" in contents
    assert "Stanford" in contents
    assert "FastAPI" not in contents

def test_resume_endpoints_integration(client, db_session, monkeypatch, test_vs):
    """
    Verify upload and retrieve API endpoints. We override the global
    vector_store client and mock PyMuPDF text extraction.
    """
    # 1. Reassign global vector_store in resume endpoint namespace
    import backend.app.api.endpoints.resume as resume_endpoint
    monkeypatch.setattr(resume_endpoint, "vector_store", test_vs)
    
    # 2. Seed active test user
    user = User(id=1, email=settings.DEFAULT_USER_EMAIL, name="Test Pilot")
    db_session.add(user)
    db_session.commit()
    
    # 3. Mock pdf parser extraction in resume endpoint namespace to return clean text
    monkeypatch.setattr(
        resume_endpoint, 
        "extract_text_from_pdf_bytes", 
        lambda b: "SUMMARY\nSoftware Engineer student.\n\nSKILLS\nPython\nSQL"
    )
    
    # 4. Check active resume - should return has_resume=False initially
    active_res = client.get("/api/resume/active")
    assert active_res.status_code == 200
    assert active_res.json()["has_resume"] is False
    
    # 5. Upload PDF file
    file_data = {"file": ("resume.pdf", io.BytesIO(b"dummy pdf bytes"), "application/pdf")}
    upload_res = client.post("/api/resume/upload", files=file_data)
    assert upload_res.status_code == 200
    
    data = upload_res.json()
    assert data["status"] == "success"
    assert data["filename"] == "resume.pdf"
    assert "Summary" in data["sections_detected"]
    assert "Skills" in data["sections_detected"]
    assert data["chunks_indexed"] == 3 # 1 Summary + 2 Skills lines
    
    # 6. Check active resume again - should return has_resume=True
    active_res = client.get("/api/resume/active")
    assert active_res.status_code == 200
    res_data = active_res.json()
    assert res_data["has_resume"] is True
    assert res_data["filename"] == "resume.pdf"
    assert len(res_data["chunks"]) == 3
    
    # 7. Query semantic search endpoint
    search_res = client.get("/api/resume/search?q=python")
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["query"] == "python"
    assert len(search_data["results"]) > 0
