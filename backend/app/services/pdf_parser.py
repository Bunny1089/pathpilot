import fitz  # PyMuPDF
import re

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """
    Extracts raw text from PDF document bytes using PyMuPDF (fitz)
    and cleans/normalizes the whitespace.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages_text = []
    
    for page in doc:
        pages_text.append(page.get_text())
        
    doc.close()
    
    raw_text = "\n".join(pages_text)
    return clean_extracted_text(raw_text)

def clean_extracted_text(text: str) -> str:
    """
    Normalizes whitespaces, fixes common ligatures, resolves formatting quirks
    and removes non-printable control characters.
    """
    if not text:
        return ""
        
    # Replace common PDF ligatures
    ligatures = {
        "ﬁ": "fi",
        "ﬂ": "fl",
        "ﬀ": "ff",
        "ﬃ": "ffi",
        "ﬄ": "ffl",
        "ﬅ": "st"
    }
    for k, v in ligatures.items():
        text = text.replace(k, v)
        
    # Remove non-printable control characters (ASCII 0-31 range, except tab/newline)
    text = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f-\xff]', '', text)
    
    # Normalize carriage returns
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Replace multiple horizontal spaces with a single space
    lines = []
    for line in text.split('\n'):
        cleaned_line = re.sub(r'[ \t]+', ' ', line).strip()
        lines.append(cleaned_line)
        
    # Reconstruct text with single newlines
    text = '\n'.join(lines)
    
    # Collapse 3 or more consecutive newlines down to double newlines (paragraphs separator)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()
