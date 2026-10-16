# PathPilot — Personal AI Career Operations Agent

PathPilot is a personal career-operations platform that converts career goals into actionable workflows. It acts as an agentic partner that manages the entire lifecycle of a job or internship search: goal planning, job discovery, resume tailoring, skill gap analysis, interview preparation, application tracking, and automated reminders.

> [!WARNING]
> **Project Scope**: This repository implements **Phase 1: Foundation ONLY**. No active AI agents, scrapers, vector databases, or cloud deployments are integrated yet. All operations run entirely locally on the user's PC.

---

## Current Development Phase: Phase 1 (Foundation)

Phase 1 establishes the core structural architecture of the application:
1. **FastAPI Backend**: Standardized REST endpoints including health checks and dashboard metrics queries.
2. **Local Database Schema**: SQLAlchemy models mapping relational definitions (`User`, `Profile`, `Goal`, `Task`) to a local SQLite file.
3. **Provider-Agnostic AI Layout**: Interface structures designed to support future local (Ollama) and cloud (Gemini) models without refactoring core logic.
4. **React Command Center**: React + TypeScript client styled with Tailwind CSS v4, featuring a dynamic progress monitor and interactive checklist syncing with the database.
5. **Robust Test Suite**: Pytest configuration confirming endpoint routing and database CRUD integrity.

---

## Repository Structure

```text
pathpilot/
│
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers & endpoints
│   │   ├── core/         # Settings & configs (Pydantic)
│   │   ├── database/     # DB Session & engine configuration
│   │   ├── models/       # SQLAlchemy database schemas
│   │   ├── schemas/      # Pydantic validation & response serialization
│   │   ├── providers/    # AI interface & concrete shell placeholders
│   │   └── main.py       # App initialization & lifespan controls
│   │
│   ├── tests/            # Pytest test cases
│   └── requirements.txt  # Backend dependencies
│
├── frontend/             # React + TS + Vite + Tailwind v4 project
│
├── docs/                 # Documentation files
│
├── .env.example          # Safe configuration defaults
├── .gitignore            # Excluded files list
├── README.md             # Project overview & guide
└── docker-compose.yml    # Development environment blueprint
```

---

## Tech Stack

* **Backend**: Python 3.14, FastAPI, SQLAlchemy 2.0, SQLite, Pydantic v2.
* **Frontend**: React 19, TypeScript 5, Vite 8, Tailwind CSS v4, Lucide React.
* **Testing**: Pytest, HTTPX, FastAPI TestClient.

---

## Local Setup

### Prerequisites
- **Python 3.10+** (tested on 3.14.6)
- **Node.js v18+** (tested on 26.3.0)
- **npm** (tested on 11.16.0)

### 1. Backend Startup

1. Open a terminal and navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   .venv\Scripts\activate   # Windows PowerShell
   # On macOS/Linux: source .venv/bin/activate
   ```
3. Install the required python packages:
   ```powershell
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```powershell
   uvicorn app.main:app --reload
   ```
   The backend will start on **`http://localhost:8000`**. On startup, the lifespan hook will automatically create `pathpilot.db` in the backend root and seed it with a default User (Alex Pilot), Profile, Goal, and 4 Roadmap Tasks.

### 2. Frontend Startup

1. Open a second terminal window and navigate to the frontend directory:
   ```powershell
   cd frontend
   ```
2. Install npm packages:
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   Open the browser to **`http://localhost:5173`**. The dashboard will display a **Backend: Online** check badge, showing live SQLite-synced task checklists and progress bar updates.

---

## Running Tests

To run the backend verification tests:
1. Ensure the backend virtual environment is active.
2. From the **project root directory** (parent of `backend/`), execute:
   ```powershell
   backend\.venv\Scripts\python -m pytest backend/tests/
   ```
   All test cases run against an isolated, thread-safe in-memory SQLite instance using `StaticPool` and will not touch your local development database.

---

## Future Roadmap & Limitations

### Phase 1 Limitations
- **No Model Connections**: The AI providers are placeholder classes returning mock strings.
- **No Authentication**: The application dynamically resolves the active local user based on the default email setting (defaults to `pilot@pathpilot.ai`) for a seamless local-first experience.
- **Tab Placeholders**: Navigation tabs (Jobs, Applications, Resume, Interview, Settings) display locked previews.

### Roadmap Progression
* **Phase 2 (Discovery)**: Job scrapers, resume parsers, application trackers, and email pipelines.
* **Phase 3 (RAG & Intelligence)**: Gemini/Ollama model connections, vector databases, and resume tailored match scoring.
* **Phase 4 (Agentic workflows)**: Multi-agent planning graphs, automatic reminders, and automated interview preparations.
