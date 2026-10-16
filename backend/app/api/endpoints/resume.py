from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from backend.app.database.session import get_db
from backend.app.services.user_service import get_local_user
from backend.app.services.pdf_parser import extract_text_from_pdf_bytes
from backend.app.services.section_detector import detect_sections
from backend.app.services.resume_chunker import chunk_resume
from backend.app.services.embedding_service import embedding_service
from backend.app.services.vector_store import vector_store
from backend.app.models.resume import Resume
from backend.app.schemas.schemas import TaskOut  # Import if needed, otherwise rely on local schemas

router = APIRouter()

@router.post("/upload", response_model=Dict[str, Any])
async def upload_resume(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    """
    Accepts a resume PDF, extracts text, identifies structural sections,
    chunks content, generates local vector embeddings, and indexes them in ChromaDB.
    """
    # 1. Enforce PDF files only
    if not file.filename.lower().endswith(".pdf") and file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400, 
            detail="Unsupported file format. Please upload a PDF resume."
        )
        
    try:
        # Read raw PDF file bytes
        file_bytes = await file.read()
        
        # 2. Extract and clean text using PyMuPDF
        raw_text = extract_text_from_pdf_bytes(file_bytes)
        if not raw_text.strip():
            raise HTTPException(
                status_code=400, 
                detail="Could not extract readable text from PDF. Ensure it is not a scanned image."
            )
            
        # 3. Structure text into sections
        sections = detect_sections(raw_text)
        
        # 4. Partition sections into semantic chunks
        chunks = chunk_resume(sections)
        
        # 5. Retrieve default user
        user = get_local_user(db)
        
        # 6. Generate embeddings for the chunks using local BGE model
        texts_to_embed = [chunk["text_to_embed"] for chunk in chunks]
        embeddings = embedding_service.get_embeddings(texts_to_embed)
        
        # 7. Write chunk vectors to local ChromaDB index
        vector_store.index_resume_chunks(user.email, chunks, embeddings)
        
        # 8. Update database record: Delete old resume (triggers cascade)
        existing_resume = db.query(Resume).filter(Resume.user_id == user.id).first()
        if existing_resume:
            db.delete(existing_resume)
            db.commit()
            
        # Create and write new resume record
        new_resume = Resume(
            user_id=user.id,
            filename=file.filename,
            raw_text=raw_text,
            sections=sections
        )
        db.add(new_resume)
        db.commit()
        db.refresh(new_resume)
        
        # Extract section preview length
        section_summary = {sec: len(content) for sec, content in sections.items()}
        
        return {
            "status": "success",
            "filename": file.filename,
            "sections_detected": list(sections.keys()),
            "section_summary": section_summary,
            "chunks_indexed": len(chunks)
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"An error occurred while processing the resume: {str(e)}"
        )

@router.get("/active", response_model=Dict[str, Any])
def get_active_resume(db: Session = Depends(get_db)):
    """
    Retrieve active resume records for the resolved local user.
    """
    user = get_local_user(db)
    resume = db.query(Resume).filter(Resume.user_id == user.id).first()
    
    if not resume:
        return {"has_resume": False}
        
    # Get parsed sections details
    sections = resume.sections or {}
    
    # Run a mock chunking locally to calculate total count
    chunks = chunk_resume(sections)
    
    return {
        "has_resume": True,
        "filename": resume.filename,
        "uploaded_at": resume.created_at.isoformat(),
        "sections": sections,
        "chunks_count": len(chunks),
        "chunks": chunks
    }

@router.get("/search", response_model=Dict[str, Any])
def search_resume(q: str, db: Session = Depends(get_db)):
    """
    Semantic search query against indexed resume chunks.
    """
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Query parameter 'q' cannot be empty.")
        
    user = get_local_user(db)
    
    # 1. Generate query embedding vector using local model
    query_vector = embedding_service.get_query_embedding(q)
    
    # 2. Match nearest chunks in ChromaDB
    matches = vector_store.query_resume_chunks(user.email, query_vector, limit=5)
    
    return {
        "query": q,
        "results": matches
    }
