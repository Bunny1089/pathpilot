import pytest
import os
from backend.app.services import pdf_parser, section_detector, resume_chunker
from backend.app.services.embedding_service import embedding_service

def test_text_cleaning_sanitization():
    """
    Verify text cleaning normalizes spacing, removes odd characters,
    resolves ligatures and cleans formatting.
    """
    raw_pdf_text = "Experienced ﬁntech developer, using python and SQL.\r\nNext line with  double   spaces."
    cleaned = pdf_parser.clean_extracted_text(raw_pdf_text)
    
    # Assert ligature conversion
    assert "fintech" in cleaned
    # Assert double spacing normalization
    assert "double spaces." in cleaned
    # Assert carriage return normalization
    assert "\r" not in cleaned

def test_section_detector():
    """
    Verify that standard resume headings are parsed into correct sections.
    """
    mock_resume = """Alex Pilot
Email: pilot@pathpilot.ai

SUMMARY
Focused AI/ML Engineering student looking for internships.

TECHNICAL SKILLS
Python, FastAPI, SQLite
React, TypeScript, Tailwind CSS

EXPERIENCE
Software Engineer Intern | TechCorp
June 2024 - Present
- Designed local SQL schemas and REST API endpoints.

ML Developer | Student Club
September 2023 - May 2024
- Trained convolutional neural networks.

EDUCATION
BS in Computer Science | Stanford University
Graduation: June 2025
"""
    sections = section_detector.detect_sections(mock_resume)
    
    assert "Header" in sections
    assert "Summary" in sections
    assert "Skills" in sections
    assert "Experience" in sections
    assert "Education" in sections
    assert "Certifications" not in sections # Check omitted section is absent
    
    # Verify exact parsed contents
    assert "Alex Pilot" in sections["Header"]
    assert "FastAPI" in sections["Skills"]
    assert "ML Developer" in sections["Experience"]
    assert "Stanford" in sections["Education"]

def test_resume_chunker_logic():
    """
    Verify that chunking strategy aligns content correctly based on section type.
    """
    mock_sections = {
        "Summary": "Passionate developer.\nWorking on agentic RAG structures.",
        "Skills": "FastAPI\nReact + TS\nPyTorch",
        "Experience": "Role 1 | Company A\n- Built REST APIs.\n\nRole 2 | Company B\n- Fine-tuned transformer models."
    }
    
    chunks = resume_chunker.chunk_resume(mock_sections)
    
    # Summary paragraph chunk, 3 skills chunks, 2 experience chunks = 6 total chunks
    assert len(chunks) == 6
    
    # Verify metadata tagging
    skills_chunks = [c for c in chunks if c["section"] == "Skills"]
    assert len(skills_chunks) == 3
    assert skills_chunks[0]["content"] == "FastAPI"
    assert skills_chunks[0]["text_to_embed"] == "Section: Skills\n\nFastAPI"
    
    exp_chunks = [c for c in chunks if c["section"] == "Experience"]
    assert len(exp_chunks) == 2
    assert "Role 1" in exp_chunks[0]["content"]
    assert "Role 2" in exp_chunks[1]["content"]

def test_mock_embedding_service():
    """
    Verify that mock embeddings are activated under testing environment variables.
    """
    # Force testing flag is active
    assert embedding_service.is_testing is True
    
    texts = ["Test segment 1", "Second text segment"]
    embeddings = embedding_service.get_embeddings(texts)
    
    assert len(embeddings) == 2
    assert len(embeddings[0]) == 384  # Validate standard BGE dimensions
    assert embeddings[0][0] == 0.1     # Validate mock float value
    
    query_emb = embedding_service.get_query_embedding("Search term")
    assert len(query_emb) == 384
    assert query_emb[0] == 0.1
