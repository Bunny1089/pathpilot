from fastapi import APIRouter, HTTPException, UploadFile, File
from backend.app.schemas.schemas import JobDescriptionTextPayload, JobDescriptionStructured
from backend.app.services.pdf_parser import extract_text_from_pdf_bytes
from backend.app.services.jd_parser import parse_job_description

router = APIRouter()

@router.post("/analyze/text", response_model=JobDescriptionStructured)
def analyze_jd_text(payload: JobDescriptionTextPayload):
    """
    Accepts job description as plain text, extracts, categorizes,
    and returns structured job details.
    """
    if not payload.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description text cannot be empty."
        )
        
    try:
        structured_jd = parse_job_description(payload.text)
        return structured_jd
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while parsing the job description text: {str(e)}"
        )

@router.post("/analyze/file", response_model=JobDescriptionStructured)
async def analyze_jd_file(file: UploadFile = File(...)):
    """
    Accepts a job description PDF file, extracts the text using PyMuPDF,
    structures the requirements, and returns structured job details.
    """
    # 1. Enforce PDF files only
    if not file.filename.lower().endswith(".pdf") and file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a PDF job description."
        )
        
    try:
        # Read raw PDF file bytes
        file_bytes = await file.read()
        
        # Extract and clean text using PyMuPDF helper
        raw_text = extract_text_from_pdf_bytes(file_bytes)
        if not raw_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract readable text from the PDF. Ensure it is not a scanned image."
            )
            
        # Parse and structure details
        structured_jd = parse_job_description(raw_text)
        return structured_jd
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while parsing the job description file: {str(e)}"
        )
