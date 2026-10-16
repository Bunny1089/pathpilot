# PathPilot Daily Development Log

This document records daily progress, verified test and build results, environment audits, known limitations, and next steps for each day of the 30-day build plan.

---

## Day 1 — Repository Audit and Baseline
- **Date:** 2026-10-17
- **Milestone:** Day 1 — Repository audit and baseline
- **Goal:** Know exactly what works before changing anything. Inspect structure, dependencies, configuration, existing features, test baseline, and isolation. Establish roadmap and daily log.

### 1. Commands Run & Actual Results

| Command | Working Directory | Exit Code | Result Summary |
|---|---|---|---|
| `git status` | `pathpilot` | 1 | Failed initially: `fatal: not a git repository`. Repository was uninitialized. |
| `git init -b main` | `pathpilot` | 0 | Initialized empty Git repository on `main` branch. |
| `git status` | `pathpilot` | 0 | Clean untracked list verified. `.gitignore` successfully excludes `.venv/`, `node_modules/`, `*.db`, `chroma_db/`, `.pytest_cache/`, `dist/`. |
| `backend\.venv\Scripts\python.exe -m pytest backend/tests/ -v` | `pathpilot` | 0 | **27 of 27 passed** in 1.34s. 8 warnings (5 Pydantic V2 class-based config deprecations, 1 Starlette testclient httpx deprecation, 2 ChromaDB/Python 3.14 deprecation). |
| `npm run lint` (`oxlint`) | `pathpilot/frontend` | 0 | 0 errors, 3 warnings (2 unused catch variables `err`, 1 missing React hook dependency `handleStep` in `CareerAgentView`). |
| `npm run build` (`tsc -b && vite build`) | `pathpilot/frontend` | 0 | Build succeeded in 912ms. Output generated in `dist/` (ignored by `.gitignore`). |

---

### 2. Feature Status Breakdown

#### A. Implemented Features
- **FastAPI Core (`backend/app/main.py`)**:
  - Application factory with CORS middleware supporting Vite dev ports (`5173`, `3000`).
  - Async lifespan hook initializing database tables via `Base.metadata.create_all` and seeding default user, profile, goal, and tasks.
- **Relational Models & Database (`backend/app/models/`, `backend/app/database/`)**:
  - SQLAlchemy 2.0 declarative models: `User`, `Profile`, `Goal`, `Task`, `Resume`, `CareerState`.
  - SQLite database file `pathpilot.db` in project root.
  - Test isolation: In-memory SQLite with `StaticPool` in `backend/tests/conftest.py`.
- **API Endpoints (`backend/app/api/endpoints/`)**:
  - `GET /api/health`: Database connectivity validation via `SELECT 1`.
  - `GET /api/dashboard`: Aggregated user profile, goals, and tasks for command center.
  - `PATCH /api/tasks/{task_id}`: Task completion state updates with database synchronization.
  - `POST /api/resume/upload`: PyMuPDF text extraction, whitespace normalization, section detection, semantic chunking, and ChromaDB indexing.
  - `GET /api/resume/active`: Returns active uploaded resume details and section counts.
  - `GET /api/resume/search`: Semantic query over indexed resume chunks.
  - `POST /api/jd/analyze/text` & `POST /api/jd/analyze/file`: Deterministic parsing of job descriptions into title, company, skills, responsibilities, experience, education.
  - `POST /api/matching/match`: Skill normalization, semantic vector retrieval, category scoring, and strength/gap report generation.
  - `POST /api/agent/session`, `GET /api/agent/session/active`, `POST /api/agent/session/step`, `POST /api/agent/session/approve`, `DELETE /api/agent/session`: State machine for orchestrating career search and creating approved roadmap tasks.
- **Frontend Command Center (`frontend/src/`)**:
  - React 19 + TypeScript + Vite + Tailwind CSS v4.
  - Views: `Dashboard` (metrics, goal progress, interactive task checklist), `ResumeView` (upload, section preview, semantic search tester), `JobDescriptionView` (text/PDF input, structured preview, one-click matching), `CareerAgentView` (interactive goal orchestrator with step loop and human approval modal).

#### B. Partial Features
- **Single Active Local User**: Resolved via `settings.DEFAULT_USER_EMAIL` (`pilot@pathpilot.ai`). No multi-tenant authentication (deliberately local-first, but must remain documented).
- **AI Providers (`backend/app/providers/`)**: `LocalProvider` and `GeminiProvider` inherit from `AIProvider` but return static placeholder text; neither is hooked up to the analysis pipeline yet.
- **Agent Job Discovery**: Uses static mock job templates (`MOCK_JOBS_TEMPLATES` for `ai/ml` and `software`) rather than real external searches.
- **Preparation Plan Generation**: Career agent creates generic application tasks ("Apply to...") rather than an explainable preparation plan addressing identified skill gaps (scheduled for Day 12).
- **Docker Compose (`docker-compose.yml`)**: Blueprint exists but is unverified in this local environment.

#### C. Mocked Features
- **Embedding Generation in Tests**: `EmbeddingService.is_testing` returns fixed 384-dimensional vectors `[0.1] * 384` to prevent downloading/running `BAAI/bge-small-en-v1.5` during test runs.
- **AI Providers**: Return canned placeholder strings.
- **Job Listings in Agent Loop**: Generated from internal dictionary templates.

#### D. Missing Features (Planned for Days 2–30)
- Real/optional LLM integration with JSON validation (Day 14).
- Evidence-grounded AI analysis and plan refinement (Day 15).
- Dedicated preparation plan generator tied directly to missing/partial skills (Day 12).
- Repeatable evaluation dataset with precision/recall metrics (Day 19).
- Hardened error handling for corrupted/malformed/encrypted PDFs and edge cases (Days 4, 5, 20).
- Detailed career application tracking (interview stages, status transitions) beyond basic task checkboxes (Day 22).
- Full end-to-end integration test suite and documented manual runbook (Days 24, 30).

#### E. Broken Features / Warnings / Identified Risks
- **Pydantic V2 Deprecation Warnings**: 5 warnings due to `class Config:` instead of `ConfigDict` or `model_config = ConfigDict(...)` in `Settings`, `TaskOut`, `GoalOut`, `ProfileOut`, `UserOut`, `CareerStateOut`.
- **Starlette TestClient Warning**: `StarletteDeprecationWarning: Using httpx with starlette.testclient is deprecated`.
- **ChromaDB / Python 3.14 Warning**: `asyncio.iscoroutinefunction` deprecation in OpenTelemetry telemetry submodule.
- **Frontend Lint Warnings**: 2 unused error variables and 1 missing `useEffect` dependency in `CareerAgentView.tsx`.
- **Windows File Locking Risk**: ChromaDB SQLite handles can lock directory trees on Windows; tests require explicit garbage collection before temporary directory deletion.
- **Git Remote**: Repository was uninitialized and currently has no upstream remote configured.

---

### 3. Risks & Priorities for Days 2–7

1. **Priority (Day 2 - Setup & Config):** Clean up Pydantic V2 deprecation warnings in settings/schemas, verify `.env` loading, confirm Python 3.14 / Node compatibility, and document reproducible setup.
2. **Priority (Day 3 - Backend Quality):** Verify status codes, error response schemas, and ensure test isolation never touches local SQLite database or ChromaDB files.
3. **Priority (Day 4 - Resume Contract & Safety):** Harden resume ingestion API: enforce strict file size limits (e.g. 5MB), MIME/magic-byte checks, in-memory processing without orphaned disk artifacts, and zero credential/content leakage in logs.
4. **Priority (Day 5 - PDF Extraction):** Ensure PyMuPDF handles empty, malformed, image-only (scanned), and encrypted PDFs with clean HTTP 400 errors instead of unhandled 500 exceptions.
5. **Priority (Day 6 - Structure & Evidence):** Validate structured section parsing with synthetic resume fixtures; mark unknown/missing sections cleanly rather than inventing content.
6. **Priority (Day 7 - Workflow Integration):** Ensure upload state, extraction errors, and preview render gracefully in frontend with no private text dumped to console or terminal.

---

### 4. Git Status & Changes
- **Files Created:**
  - `docs/ANTIGRAVITY_30_DAY_PLAN.md` (canonical 30-day plan)
  - `docs/30_DAY_PLAN.md` (roadmap index)
  - `docs/DAILY_LOG.md` (this audit log)
- **Git Commit:** `87258ed` (`docs: add PathPilot development roadmap and baseline audit`)
- **Remote / Push Status:** No upstream remote configured yet (local repository initialized). Push ready once remote is added.
- **Application Code Rewritten:** None (Strict audit mode; verified existing code without rewrites).
- **Next Day's Goal (Day 2):** Stabilize setup and configuration — address configuration deprecations, verify environment variables, test startup without credentials, and validate configuration integrity.
