import re
from typing import Dict, Any, List, Optional
from backend.app.services.pdf_parser import clean_extracted_text

# Heading detection patterns
SECTION_HEADER_PATTERNS = {
    "responsibilities": re.compile(
        r'^(responsibilities|what you\'ll do|key responsibilities|duties|your role|what you will do|the role|about the role|key tasks|about the job)$', 
        re.IGNORECASE
    ),
    "required_skills": re.compile(
        r'^(requirements|qualifications|what you need|basic qualifications|required skills|requirements & skills|what you\'ll bring|minimum qualifications|key requirements|what we are looking for)$', 
        re.IGNORECASE
    ),
    "preferred_skills": re.compile(
        r'^(preferred qualifications|nice to have|preferred skills|pluses|bonus|plus|what would be a plus|desirable|desired skills)$', 
        re.IGNORECASE
    ),
    "education": re.compile(
        r'^(education|academic background|degree requirements|degrees)$',
        re.IGNORECASE
    ),
    "experience": re.compile(
        r'^(experience|work experience|background requirements)$',
        re.IGNORECASE
    )
}

# Heuristics patterns for inline items
EXPERIENCE_PATTERN = re.compile(
    r'(\b\d+\+?\s*(?:years?|yrs?)\b|\bexperience\s+(?:developing|working|building|leading|with|in)\b)',
    re.IGNORECASE
)

EDUCATION_PATTERN = re.compile(
    r'\b(bs|ms|phd|bachelor|master|doctorate|degree|computer science|engineering|mathematics|statistics)\b',
    re.IGNORECASE
)

TITLE_KEYWORDS = [
    "engineer", "developer", "analyst", "manager", "lead", "architect", 
    "designer", "specialist", "scientist", "consultant", "intern", 
    "programmer", "associate", "expert", "officer", "administrator"
]

def parse_job_description(text: str) -> Dict[str, Any]:
    """
    Cleans raw job description text, detects sections, and structures important requirements
    like job title, company, skills, responsibilities, experience, and education.
    """
    cleaned_text = clean_extracted_text(text)
    lines = [line.strip() for line in cleaned_text.split('\n') if line.strip()]
    
    # 1. Detect Job Title
    job_title = detect_title(lines)
    
    # 2. Detect Company
    company = detect_company(lines, job_title)
    
    # 3. Categorize text into sections and items
    required_skills = []
    preferred_skills = []
    responsibilities = []
    qualifications = []
    experience = []
    education = []
    other_requirements = []
    
    current_section = "intro"
    
    for line in lines:
        # Check if line is a section header (short line matching header regexes)
        matched_section = None
        if len(line) < 40 and len(line.split()) <= 5:
            # Strip trailing colon if present for comparison
            normalized_header = line.rstrip(':').strip()
            for sec_name, pattern in SECTION_HEADER_PATTERNS.items():
                if pattern.match(normalized_header):
                    matched_section = sec_name
                    break
                    
        if matched_section:
            current_section = matched_section
            continue
            
        # Clean line from bullet point prefix (e.g. -, *, •, +, 1., 2.)
        cleaned_item = re.sub(r'^(?:[-*•+•]|\d+\.)\s*', '', line).strip()
        if not cleaned_item:
            continue
            
        # Classify the cleaned item based on the active section and heuristics
        is_bullet = line.startswith(('-', '*', '•', '+')) or re.match(r'^\d+\.\s', line)
        
        # Check for inline Experience or Education indicators first
        has_experience_keyword = bool(EXPERIENCE_PATTERN.search(cleaned_item))
        has_education_keyword = bool(EDUCATION_PATTERN.search(cleaned_item))
        
        if current_section == "responsibilities":
            responsibilities.append(cleaned_item)
        elif current_section == "required_skills":
            if has_experience_keyword:
                experience.append(cleaned_item)
            elif has_education_keyword:
                education.append(cleaned_item)
            else:
                required_skills.append(cleaned_item)
                qualifications.append(cleaned_item)
        elif current_section == "preferred_skills":
            preferred_skills.append(cleaned_item)
            qualifications.append(cleaned_item)
        elif current_section == "education":
            education.append(cleaned_item)
        elif current_section == "experience":
            experience.append(cleaned_item)
        else:
            # Intro or other sections - classify if they look like requirements/bullets
            if is_bullet:
                if has_experience_keyword:
                    experience.append(cleaned_item)
                elif has_education_keyword:
                    education.append(cleaned_item)
                else:
                    other_requirements.append(cleaned_item)
            else:
                # If it's a general paragraph line, we scan for experience or education
                if has_experience_keyword:
                    experience.append(cleaned_item)
                if has_education_keyword:
                    education.append(cleaned_item)

    # Deduplicate lists while preserving order
    return {
        "job_title": job_title,
        "company": company,
        "required_skills": list(dict.fromkeys(required_skills)),
        "preferred_skills": list(dict.fromkeys(preferred_skills)),
        "responsibilities": list(dict.fromkeys(responsibilities)),
        "qualifications": list(dict.fromkeys(qualifications)),
        "experience": list(dict.fromkeys(experience)),
        "education": list(dict.fromkeys(education)),
        "other_requirements": list(dict.fromkeys(other_requirements))
    }

def detect_title(lines: List[str]) -> Optional[str]:
    """
    Scans the first few non-empty lines for common title keywords or defaults to the first line.
    """
    if not lines:
        return None
        
    # Check first 3 lines
    for line in lines[:3]:
        # Ignore obvious section headers or intro sentences
        if len(line) < 60 and any(keyword in line.lower() for keyword in TITLE_KEYWORDS):
            return line
            
    # Fallback to the first line
    return lines[0]

def detect_company(lines: List[str], job_title: Optional[str]) -> Optional[str]:
    """
    Scans early lines for patterns indicating the company name, or defaults to the second line.
    """
    if not lines:
        return None
        
    company_patterns = [
        re.compile(r'^company:\s*(.*)$', re.IGNORECASE),
        re.compile(r'^at\s+([A-Z][A-Za-z0-9\s\-\.\&]+),', re.IGNORECASE),
        re.compile(r'^join\s+(?:our team at|us at)\s+([A-Z][A-Za-z0-9\s\-\.\&]+)', re.IGNORECASE),
        re.compile(r'^([A-Z][A-Za-z0-9\s\-\.\&]+)\s+(?:is looking for|is hiring)', re.IGNORECASE)
    ]
    
    # Check first 5 lines for patterns
    for line in lines[:5]:
        for pattern in company_patterns:
            match = pattern.match(line)
            if match:
                return match.group(1).strip()
                
    # Fallback: if the first line is the job title and we have a second line, return the second line
    if len(lines) > 1:
        second_line = lines[1]
        # Ensure it's not the same as job title and is relatively short (likely a company name or location)
        if second_line != job_title and len(second_line) < 40:
            # Strip location if separated by dash or comma
            cleaned_company = re.split(r'[,\|\-\–]', second_line)[0].strip()
            if cleaned_company:
                return cleaned_company
                
    return "Unknown Company"
