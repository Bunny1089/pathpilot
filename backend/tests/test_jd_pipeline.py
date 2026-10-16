import pytest
import io
from backend.app.services import jd_parser
import backend.app.api.endpoints.jd as jd_endpoint

def test_jd_title_and_company_detection():
    """
    Verify title and company detection heuristics on mock JDs.
    """
    jd_text_1 = """Python Software Engineer
TechCorp Inc.
San Francisco, CA

About the role:
We are looking for a Python Software Engineer to join our team...
"""
    result_1 = jd_parser.parse_job_description(jd_text_1)
    assert result_1["job_title"] == "Python Software Engineer"
    assert result_1["company"] == "TechCorp Inc."

    # Test company detection from matching sentences
    jd_text_2 = """Machine Learning Engineer
At HealthAI, we are transforming healthcare...
"""
    result_2 = jd_parser.parse_job_description(jd_text_2)
    assert result_2["job_title"] == "Machine Learning Engineer"
    assert result_2["company"] == "HealthAI"

def test_jd_section_and_requirements_categorization():
    """
    Verify that responsibilities, qualifications, experience, and education
    are parsed into correct structured properties.
    """
    jd_text = """Senior Developer
Fintech Solutions

Responsibilities:
- Build high-performance REST APIs.
- Lead a team of 4 engineers.

Qualifications:
- BS or MS in Computer Science or related engineering field.
- 5+ years of experience in Python or Java software development.
- Strong knowledge of SQL databases.

Preferred Skills:
- Experience with FastAPI and Docker.
- Active GitHub profile.
"""
    result = jd_parser.parse_job_description(jd_text)
    
    assert result["job_title"] == "Senior Developer"
    assert result["company"] == "Fintech Solutions"
    
    # Verify responsibilities
    assert len(result["responsibilities"]) == 2
    assert "Build high-performance REST APIs." in result["responsibilities"]
    assert "Lead a team of 4 engineers." in result["responsibilities"]
    
    # Verify experience (extracted from qualifications based on keyword/regex)
    assert len(result["experience"]) == 1
    assert "5+ years of experience in Python or Java software development." in result["experience"]
    
    # Verify education (extracted based on degree keywords)
    assert len(result["education"]) == 1
    assert "BS or MS in Computer Science or related engineering field." in result["education"]
    
    # Verify required skills
    assert "Strong knowledge of SQL databases." in result["required_skills"]
    
    # Verify preferred skills
    assert "Experience with FastAPI and Docker." in result["preferred_skills"]
    assert "Active GitHub profile." in result["preferred_skills"]

def test_analyze_jd_text_endpoint(client):
    """
    Verify POST /api/jd/analyze/text endpoint behavior.
    """
    payload = {
        "text": "Software Engineer\nAcmeCorp\nResponsibilities:\n- Code stuff\nRequirements:\n- 3 years experience"
    }
    response = client.post("/api/jd/analyze/text", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["job_title"] == "Software Engineer"
    assert data["company"] == "AcmeCorp"
    assert "Code stuff" in data["responsibilities"]
    assert len(data["experience"]) == 1

def test_analyze_jd_text_empty_error(client):
    """
    Verify endpoint returns 400 if text is empty.
    """
    payload = {"text": "   "}
    response = client.post("/api/jd/analyze/text", json=payload)
    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"]

def test_analyze_jd_file_endpoint(client, monkeypatch):
    """
    Verify POST /api/jd/analyze/file endpoint behavior by mocking PyMuPDF extraction.
    """
    mock_extracted_text = """Data Scientist
ML Research lab
What you will do:
- Train models
What you'll bring:
- PhD in Machine Learning
- 2+ years of experience with PyTorch
"""
    # Mock the extract_text_from_pdf_bytes utility in endpoint namespace
    monkeypatch.setattr(
        jd_endpoint,
        "extract_text_from_pdf_bytes",
        lambda b: mock_extracted_text
    )
    
    file_data = {"file": ("job.pdf", io.BytesIO(b"dummy pdf bytes"), "application/pdf")}
    response = client.post("/api/jd/analyze/file", files=file_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["job_title"] == "Data Scientist"
    assert data["company"] == "ML Research lab"
    assert "Train models" in data["responsibilities"]
    assert "PhD in Machine Learning" in data["education"]
    assert "2+ years of experience with PyTorch" in data["experience"]

def test_analyze_jd_file_invalid_format(client):
    """
    Verify endpoint returns 400 for unsupported file formats.
    """
    file_data = {"file": ("job.txt", io.BytesIO(b"dummy plain text"), "text/plain")}
    response = client.post("/api/jd/analyze/file", files=file_data)
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]
