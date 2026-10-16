import pytest
from backend.app.services.matching_service import (
    normalize_skill, check_keyword_in_text,
    evaluate_requirement, match_resume_to_jd
)
from backend.app.schemas.schemas import MatchRequest, MatchWeights
from backend.app.models.user import User
from backend.app.models.resume import Resume
from backend.app.core.config import settings
import backend.app.services.matching_service as ms_module

def test_skill_normalization():
    """
    Verify that skill aliases and casing variants are mapped correctly.
    """
    assert normalize_skill("React.js") == "react"
    assert normalize_skill("ReactJS") == "react"
    assert normalize_skill("k8s") == "kubernetes"
    assert normalize_skill("Kubernetes") == "kubernetes"
    assert normalize_skill("PostgreSQL") == "postgresql"
    assert normalize_skill("postgres") == "postgresql"
    assert normalize_skill("Fast-API") == "fastapi"
    assert normalize_skill("fastapi") == "fastapi"
    assert normalize_skill("Python") == "python"
    assert normalize_skill("py") == "python"

def test_keyword_matching_heuristics():
    """
    Verify that direct mentions of skills or their aliases are detected in resume text.
    """
    text = "Experienced React developer with k8s experience. Worked with Postgres."
    
    assert check_keyword_in_text("react", text) is True
    assert check_keyword_in_text("kubernetes", text) is True
    assert check_keyword_in_text("postgresql", text) is True
    assert check_keyword_in_text("docker", text) is False

def test_evaluate_requirement_classification(monkeypatch):
    """
    Verify classification correctness (Strong, Partial, Related, Missing) under mock query returns.
    """
    # Mock vector store queries returning similarity matches
    mock_results = [{"chunk_index": 0, "section": "Skills", "content": "React, Python", "similarity": 0.85}]
    
    import backend.app.services.matching_service as ms
    monkeypatch.setattr(ms.vector_store, "query_resume_chunks", lambda email, query_emb, limit: mock_results)
    
    # 1. Skill requirement with direct keyword match and similarity 0.85 -> Strong Match
    res = evaluate_requirement("React", "test@pathpilot.ai", "React, Python", is_skill=True)
    assert res.status == "Strong Match"
    assert res.similarity == 0.85
    
    # 2. Skill requirement with no keyword match but high similarity 0.85 -> Strong Match
    res = evaluate_requirement("Vue", "test@pathpilot.ai", "React, Python", is_skill=True)
    assert res.status == "Strong Match" # Since similarity 0.85 >= 0.82
    
    # 3. Non-skill requirement with similarity 0.85 -> Strong Match
    res = evaluate_requirement("Build scalable APIs", "test@pathpilot.ai", "React, Python", is_skill=False)
    assert res.status == "Strong Match"
    
    # 4. Low similarity (0.50) without keyword match -> Missing
    mock_results[0]["similarity"] = 0.50
    res = evaluate_requirement("Kubernetes", "test@pathpilot.ai", "React, Python", is_skill=True)
    assert res.status == "Missing"
    
    # 5. Low similarity (0.50) but keyword match -> Related/Weak Evidence
    res = evaluate_requirement("React", "test@pathpilot.ai", "React, Python", is_skill=True)
    assert res.status == "Related/Weak Evidence"

def test_matching_weighted_scoring_math(monkeypatch, db_session):
    """
    Verify overall weighted score math and category score breakdowns.
    """
    # Seed user and resume records
    user = User(id=10, email="scoring@pathpilot.ai", name="Score Tester")
    db_session.add(user)
    db_session.commit()
    
    resume = Resume(
        user_id=user.id,
        filename="resume.pdf",
        raw_text="React developer. BS in Computer Science. 3 years experience. Docker.",
        sections={"Skills": "React\nDocker", "Education": "BS CS", "Experience": "3 years"}
    )
    db_session.add(resume)
    db_session.commit()
    
    # Mock evaluate_requirement to return deterministic states
    def mock_eval(req, email, raw_text, is_skill=False):
        from backend.app.schemas.schemas import RequirementMatch
        # Determine status mockingly based on requirement name
        if req == "React":
            return RequirementMatch(requirement=req, status="Strong Match", similarity=0.9, evidence=None)
        elif req == "Kubernetes":
            # Missing skill, should find Docker as related
            from backend.app.schemas.schemas import MatchEvidence
            rel_ev = MatchEvidence(content="Docker", section="Skills", similarity=0.8, chunk_index=0)
            return RequirementMatch(requirement=req, status="Missing", similarity=0.4, evidence=None, related_evidence=rel_ev)
        elif req == "Build microservices":
            return RequirementMatch(requirement=req, status="Partial Match", similarity=0.75, evidence=None)
        elif req == "BS in Computer Science":
            return RequirementMatch(requirement=req, status="Strong Match", similarity=0.95, evidence=None)
        return RequirementMatch(requirement=req, status="Missing", similarity=0.2, evidence=None)

    monkeypatch.setattr(ms_module, "evaluate_requirement", mock_eval)
    
    jd = MatchRequest(
        job_title="Software Intern",
        company="TechCorp",
        required_skills=["React"], # 1 Strong (1.0) -> Category score = 100%
        preferred_skills=["Kubernetes"], # 1 Missing (0.0) -> Category score = 0%
        experience=["Build microservices"], # 1 Partial (0.5) -> Category score = 50%
        education=["BS in Computer Science"], # 1 Strong (1.0) -> Category score = 100%
        weights=MatchWeights(
            required_skills=0.60,
            preferred_skills=0.20,
            experience=0.15,
            education=0.05
        )
    )
    
    report = match_resume_to_jd(db_session, "scoring@pathpilot.ai", jd)
    
    # Expected weighted score:
    # Required: 100 * 0.60 = 60
    # Preferred: 0 * 0.20 = 0
    # Experience: 50 * 0.15 = 7.5
    # Education: 100 * 0.05 = 5.0
    # Total = 60 + 0 + 7.5 + 5.0 = 72.5
    assert report.overall_score == 72.5
    assert report.category_scores["required_skills"].score == 100.0
    assert report.category_scores["preferred_skills"].score == 0.0
    assert report.category_scores["experience"].score == 50.0
    assert report.category_scores["education"].score == 100.0
    
    # Check strengths/gaps collection
    assert "React" in report.strengths
    assert "BS in Computer Science" in report.strengths
    assert "Kubernetes (Related: Docker)" in report.gaps

def test_api_matching_endpoint_integration(client, db_session, monkeypatch):
    """
    Verify POST /api/matching/match endpoint integration.
    """
    user = User(id=1, email=settings.DEFAULT_USER_EMAIL, name="API Tester")
    db_session.add(user)
    db_session.commit()
    
    resume = Resume(
        user_id=user.id,
        filename="tester.pdf",
        raw_text="Fullstack developer. python, sql.",
        sections={"Skills": "python\nsql"}
    )
    db_session.add(resume)
    db_session.commit()
    
    # Mock matching service to return a simple report
    from backend.app.schemas.schemas import MatchReportOut, CategoryScore, RequirementMatch
    dummy_report = MatchReportOut(
        job_title="Intern",
        company="Acme",
        overall_score=85.0,
        recommendation="Strong Match",
        weights=MatchWeights(),
        category_scores={
            "required_skills": CategoryScore(score=100.0, weight=0.6, matched_count=1, total_count=1),
            "preferred_skills": CategoryScore(score=100.0, weight=0.2, matched_count=0, total_count=0),
            "experience": CategoryScore(score=100.0, weight=0.15, matched_count=0, total_count=0),
            "education": CategoryScore(score=100.0, weight=0.05, matched_count=0, total_count=0)
        },
        required_skills=[RequirementMatch(requirement="python", status="Strong Match", similarity=0.9, evidence=None)],
        preferred_skills=[],
        experience=[],
        education=[]
    )
    
    # Monkeypatch the service function in endpoint namespace
    import backend.app.api.endpoints.matching as match_endpoint
    monkeypatch.setattr(match_endpoint, "match_resume_to_jd", lambda db, email, payload: dummy_report)
    
    payload = {
        "job_title": "Intern",
        "company": "Acme",
        "required_skills": ["python"]
    }
    
    response = client.post("/api/matching/match", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["overall_score"] == 85.0
    assert data["recommendation"] == "Strong Match"
    assert len(data["required_skills"]) == 1
    assert data["required_skills"][0]["requirement"] == "python"
