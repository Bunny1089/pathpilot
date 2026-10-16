import re
from typing import Dict

# Regex mappings for common resume section headers
SECTION_PATTERNS = {
    "Summary": re.compile(
        r'^(summary|professional summary|summary of qualifications|career goal|objective|about me|profile)$', 
        re.IGNORECASE
    ),
    "Skills": re.compile(
        r'^(skills|technical skills|core competencies|expertise|technologies|skills & technologies|tools|core skills)$', 
        re.IGNORECASE
    ),
    "Experience": re.compile(
        r'^(experience|work experience|professional experience|employment history|work history|professional history|career history)$', 
        re.IGNORECASE
    ),
    "Projects": re.compile(
        r'^(projects|personal projects|academic projects|key projects|selected projects|technical projects|academic work)$', 
        re.IGNORECASE
    ),
    "Education": re.compile(
        r'^(education|academic background|degrees|academic history|academic credentials)$', 
        re.IGNORECASE
    ),
    "Certifications": re.compile(
        r'^(certifications|licenses|certificates|licenses & certifications|awards|professional certifications)$', 
        re.IGNORECASE
    )
}

def detect_sections(text: str) -> Dict[str, str]:
    """
    Parses cleaned resume text and divides it into a dictionary of categorized sections.
    """
    sections = {}
    lines = text.split('\n')
    
    current_section = "Header"  # Initial catch-all for contact information, name, links at top
    current_content = []
    
    for line in lines:
        stripped_line = line.strip()
        if not stripped_line:
            if current_content:
                current_content.append("")
            continue
            
        # Match headings: Line length check protects against matching full sentences
        matched_section = None
        if len(stripped_line) < 32 and len(stripped_line.split()) <= 4:
            for section_name, pattern in SECTION_PATTERNS.items():
                if pattern.match(stripped_line):
                    matched_section = section_name
                    break
                    
        if matched_section:
            # Save accumulated lines from the previous section
            if current_content:
                sections[current_section] = "\n".join(current_content).strip()
                
            current_section = matched_section
            current_content = []
        else:
            current_content.append(stripped_line)
            
    # Save final section content
    if current_content:
        sections[current_section] = "\n".join(current_content).strip()
        
    return sections
