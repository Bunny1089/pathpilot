import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.resume import Resume
from backend.app.schemas.schemas import (
    MatchRequest, MatchReportOut, RequirementMatch, 
    MatchEvidence, CategoryScore, MatchWeights
)
from backend.app.services.embedding_service import embedding_service
from backend.app.services.vector_store import vector_store

def clean_skill_string(s: str) -> str:
    """
    Cleans a skill string to lower case, stripping common separators.
    """
    cleaned = s.lower().strip()
    # Strip common trailing punctuation like dots or commas
    cleaned = re.sub(r'[\.,\-\/]', ' ', cleaned).strip()
    # Replace multiple spaces with a single space
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned

# Skill canonical mappings and aliases
SKILL_ALIASES = {
    "kubernetes": ["k8s", "kube", "kubernetes"],
    "react": ["reactjs", "react.js", "react js", "react"],
    "javascript": ["js", "javascript"],
    "typescript": ["ts", "typescript"],
    "postgresql": ["postgres", "postgresql", "postgre"],
    "mongodb": ["mongo", "mongodb"],
    "aws": ["amazon web services", "aws"],
    "gcp": ["google cloud platform", "google cloud", "gcp"],
    "python": ["py", "python"],
    "fastapi": ["fast-api", "fastapi"],
    "docker": ["containerization", "containers", "docker"],
    "pytorch": ["torch", "pytorch"],
    "tensorflow": ["tf", "tensorflow"],
    "scikit-learn": ["sklearn", "scikit-learn", "scikit learn"],
    "artificial intelligence": ["ai", "artificial intelligence"],
    "machine learning": ["ml", "machine learning"],
    "natural language processing": ["nlp", "natural language processing"],
    "llm": ["large language model", "large language models", "llm"],
    "sql": ["sqlite", "mysql", "sql", "rdbms"]
}

# Reverse mapping for alias normalization
NORMALIZE_MAP = {}
for canonical, aliases in SKILL_ALIASES.items():
    for alias in aliases:
        NORMALIZE_MAP[clean_skill_string(alias)] = canonical

# Map of related skills for fallback evidence when a skill is missing
RELATED_SKILLS = {
    "kubernetes": ["docker", "aws", "gcp", "devops"],
    "docker": ["kubernetes", "devops", "aws", "gcp"],
    "pytorch": ["tensorflow", "keras", "scikit-learn", "machine learning", "deep learning"],
    "tensorflow": ["pytorch", "keras", "scikit-learn", "machine learning", "deep learning"],
    "react": ["vue", "angular", "next.js", "javascript", "typescript"],
    "fastapi": ["flask", "django", "python"],
    "postgresql": ["mysql", "sqlite", "mongodb", "sql"],
    "mongodb": ["postgresql", "mysql", "sqlite", "sql", "nosql"],
    "aws": ["gcp", "azure", "kubernetes", "docker"],
    "gcp": ["aws", "azure", "kubernetes", "docker"],
    "azure": ["aws", "gcp", "kubernetes", "docker"],
    "typescript": ["javascript", "react"],
    "javascript": ["typescript", "react"],
    "python": ["pytorch", "tensorflow", "fastapi", "django", "flask"]
}

def normalize_skill(skill_str: str) -> str:
    """
    Normalizes a skill string to its canonical form if it exists in aliases,
    otherwise returns clean lowercase string.
    """
    cleaned = clean_skill_string(skill_str)
    if cleaned in NORMALIZE_MAP:
        return NORMALIZE_MAP[cleaned]
    # Check if any alias is a substring or word
    for alias, canonical in NORMALIZE_MAP.items():
        if len(alias) > 2 and (alias in cleaned or cleaned in alias):
            return canonical
    return cleaned

def check_keyword_in_text(keyword: str, text: str) -> bool:
    """
    Checks if a normalized keyword or its aliases exists in raw text using word boundaries.
    """
    keyword_clean = clean_skill_string(keyword)
    
    # 1. Check exact word boundary match for target
    pattern = r'\b' + re.escape(keyword_clean) + r'\b'
    if re.search(pattern, text, re.IGNORECASE):
        return True
        
    # 2. Check aliases if mapped
    canonical = NORMALIZE_MAP.get(keyword_clean, keyword_clean)
    aliases = SKILL_ALIASES.get(canonical, [])
    for alias in aliases:
        pattern = r'\b' + re.escape(alias) + r'\b'
        if re.search(pattern, text, re.IGNORECASE):
            return True
            
    return False

def find_related_evidence_in_db(skill_normalized: str, user_email: str, resume_raw_text: str) -> Optional[MatchEvidence]:
    """
    Checks if any related skills exist in the user's resume and queries the vector store
    for the best matching evidence.
    """
    related = RELATED_SKILLS.get(skill_normalized, [])
    for rel_skill in related:
        # Check if the related skill keyword is in the resume first
        if check_keyword_in_text(rel_skill, resume_raw_text):
            # Query ChromaDB for evidence of this related skill
            rel_query = f"Experience with {rel_skill}"
            rel_emb = embedding_service.get_query_embedding(rel_query)
            results = vector_store.query_resume_chunks(user_email, rel_emb, limit=1)
            if results:
                match = results[0]
                return MatchEvidence(
                    content=match["content"],
                    section=match["section"],
                    similarity=match["similarity"],
                    chunk_index=match["chunk_index"]
                )
    return None

def evaluate_requirement(
    requirement: str,
    user_email: str,
    resume_raw_text: str,
    is_skill: bool = False
) -> RequirementMatch:
    """
    Evaluates a single requirement (skill or sentence) against the indexed resume chunks in ChromaDB.
    """
    # 1. Embed query
    query_vector = embedding_service.get_query_embedding(requirement)
    
    # 2. Retrieve closest chunks
    matches = vector_store.query_resume_chunks(user_email, query_vector, limit=3)
    
    best_match = None
    if matches:
        best_match = matches[0]
        
    similarity = best_match["similarity"] if best_match else 0.0
    evidence = None
    if best_match:
        evidence = MatchEvidence(
            content=best_match["content"],
            section=best_match["section"],
            similarity=best_match["similarity"],
            chunk_index=best_match["chunk_index"]
        )
        
    status = "Missing"
    related_evidence = None
    
    if is_skill:
        # Normalize skill name
        norm_skill = normalize_skill(requirement)
        # Check direct keyword mention in raw resume text
        keyword_matched = check_keyword_in_text(norm_skill, resume_raw_text)
        
        # Classification thresholds for skills
        if keyword_matched:
            if similarity >= 0.70:
                status = "Strong Match"
            elif similarity >= 0.60:
                status = "Partial Match"
            else:
                status = "Related/Weak Evidence"
        else:
            if similarity >= 0.82:
                status = "Strong Match"
            elif similarity >= 0.72:
                status = "Partial Match"
            else:
                status = "Missing"
                # Search for related skill evidence
                related_evidence = find_related_evidence_in_db(norm_skill, user_email, resume_raw_text)
    else:
        # Non-skill classification thresholds (experience/responsibilities/education)
        if similarity >= 0.80:
            status = "Strong Match"
        elif similarity >= 0.70:
            status = "Partial Match"
        elif similarity >= 0.60:
            status = "Related/Weak Evidence"
        else:
            status = "Missing"
            
    return RequirementMatch(
        requirement=requirement,
        status=status,
        similarity=similarity,
        evidence=evidence,
        related_evidence=related_evidence
    )

def match_resume_to_jd(db: Session, user_email: str, jd: MatchRequest) -> MatchReportOut:
    """
    Executes the Resume-JD matching engine pipeline.
    """
    # 1. Retrieve resume
    from backend.app.models.user import User
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise ValueError(f"User with email {user_email} not found.")
        
    resume = db.query(Resume).filter(Resume.user_id == user.id).first()
    if not resume:
        raise ValueError("No active resume uploaded. Please upload a resume first.")
        
    resume_raw_text = resume.raw_text or ""
    
    # 2. Extract weights
    weights = jd.weights or MatchWeights()
    
    # 3. Categorized lists of requirements
    req_skills_input = jd.required_skills or []
    pref_skills_input = jd.preferred_skills or []
    # Responsibilities/Experience
    exp_resp_input = (jd.experience or []) + (jd.responsibilities or [])
    # Education/Qualifications
    edu_qual_input = (jd.education or []) + (jd.qualifications or [])
    # Other requirements (informational, not scored)
    other_input = jd.other_requirements or []
    
    # 4. Evaluate each item
    req_skills_matches = [evaluate_requirement(s, user_email, resume_raw_text, is_skill=True) for s in req_skills_input]
    pref_skills_matches = [evaluate_requirement(s, user_email, resume_raw_text, is_skill=True) for s in pref_skills_input]
    exp_resp_matches = [evaluate_requirement(r, user_email, resume_raw_text, is_skill=False) for r in exp_resp_input]
    edu_qual_matches = [evaluate_requirement(q, user_email, resume_raw_text, is_skill=False) for q in edu_qual_input]
    other_matches = [evaluate_requirement(o, user_email, resume_raw_text, is_skill=False) for o in other_input]
    
    # 5. Math Scoring Helper
    def compute_category_score(matches: List[RequirementMatch]) -> float:
        if not matches:
            return 100.0  # Treat as perfect if no requirements listed
        total_score = 0.0
        for m in matches:
            if m.status == "Strong Match":
                total_score += 1.0
            elif m.status == "Partial Match":
                total_score += 0.5
            elif m.status == "Related/Weak Evidence":
                total_score += 0.25
            else:
                total_score += 0.0
        return (total_score / len(matches)) * 100.0
        
    def count_matched(matches: List[RequirementMatch]) -> int:
        return sum(1 for m in matches if m.status in ["Strong Match", "Partial Match"])

    req_score = compute_category_score(req_skills_matches)
    pref_score = compute_category_score(pref_skills_matches)
    exp_score = compute_category_score(exp_resp_matches)
    edu_score = compute_category_score(edu_qual_matches)
    
    # 6. Normalize weights for active categories (in case some categories are completely empty)
    # But wait, weights are fixed. To respect user weights:
    active_weights = {}
    if req_skills_input:
        active_weights["required_skills"] = weights.required_skills
    if pref_skills_input:
        active_weights["preferred_skills"] = weights.preferred_skills
    if exp_resp_input:
        active_weights["experience"] = weights.experience
    if edu_qual_input:
        active_weights["education"] = weights.education
        
    total_active_weight = sum(active_weights.values())
    
    if total_active_weight > 0:
        # Redistribute weights proportionally to active sections
        norm_weights = {k: v / total_active_weight for k, v in active_weights.items()}
    else:
        # Default fallback
        norm_weights = {
            "required_skills": 0.60,
            "preferred_skills": 0.20,
            "experience": 0.15,
            "education": 0.05
        }
        
    # Calculate overall score
    overall_score = 0.0
    if "required_skills" in active_weights:
        overall_score += req_score * norm_weights["required_skills"]
    if "preferred_skills" in active_weights:
        overall_score += pref_score * norm_weights["preferred_skills"]
    if "experience" in active_weights:
        overall_score += exp_score * norm_weights["experience"]
    if "education" in active_weights:
        overall_score += edu_score * norm_weights["education"]
        
    overall_score = round(overall_score, 1)
    
    # Category Breakdowns
    category_scores = {
        "required_skills": CategoryScore(
            score=round(req_score, 1),
            weight=weights.required_skills,
            matched_count=count_matched(req_skills_matches),
            total_count=len(req_skills_matches)
        ),
        "preferred_skills": CategoryScore(
            score=round(pref_score, 1),
            weight=weights.preferred_skills,
            matched_count=count_matched(pref_skills_matches),
            total_count=len(pref_skills_matches)
        ),
        "experience": CategoryScore(
            score=round(exp_score, 1),
            weight=weights.experience,
            matched_count=count_matched(exp_resp_matches),
            total_count=len(exp_resp_matches)
        ),
        "education": CategoryScore(
            score=round(edu_score, 1),
            weight=weights.education,
            matched_count=count_matched(edu_qual_matches),
            total_count=len(edu_qual_matches)
        )
    }
    
    # 7. Collect Strengths & Gaps
    strengths = []
    gaps = []
    
    for m in req_skills_matches + pref_skills_matches:
        if m.status == "Strong Match":
            strengths.append(m.requirement)
        elif m.status == "Missing":
            if m.related_evidence:
                gaps.append(f"{m.requirement} (Related: {m.related_evidence.content})")
            else:
                gaps.append(m.requirement)
                
    for m in exp_resp_matches + edu_qual_matches:
        if m.status == "Strong Match":
            strengths.append(m.requirement)
        elif m.status == "Missing":
            gaps.append(m.requirement)
            
    # Deduplicate strengths & gaps
    strengths = list(dict.fromkeys(strengths))
    gaps = list(dict.fromkeys(gaps))
    
    # 8. Set recommendation
    if overall_score >= 85.0:
        recommendation = "Strong Match - Highly Recommended to Apply"
    elif overall_score >= 70.0:
        recommendation = "Good Match - Recommended to Apply"
    elif overall_score >= 50.0:
        recommendation = "Partial Match - Recommended with Caution (Address Skills Gaps)"
    else:
        recommendation = "Weak Match - Not Recommended (Significant Gaps Detected)"
        
    return MatchReportOut(
        job_title=jd.job_title,
        company=jd.company,
        overall_score=overall_score,
        recommendation=recommendation,
        weights=weights,
        category_scores=category_scores,
        required_skills=req_skills_matches,
        preferred_skills=pref_skills_matches,
        experience=exp_resp_matches,
        education=edu_qual_matches,
        other_requirements=other_matches,
        strengths=strengths,
        gaps=gaps
    )
