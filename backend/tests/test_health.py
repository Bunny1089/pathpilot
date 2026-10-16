def test_health_check(client):
    """
    Test that GET /api/health returns HTTP 200 and matches the expected payload schema.
    """
    response = client.get("/api/health")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "PathPilot Backend"
    assert data["database"] == "connected"
