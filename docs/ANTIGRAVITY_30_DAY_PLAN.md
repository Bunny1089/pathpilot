# PathPilot 2.0 — 30-Day Build Plan for Antigravity

**Goal:** Turn the existing PathPilot foundation into a credible, locally runnable AI Career Operations Agent, with tested features, meaningful GitHub history, and a portfolio-ready demo.

**Daily time budget:** Approximately 2–2.5 hours for the PathPilot project. Keep DSA and AI-learning practice as separate activities if you are following the wider 30-day routine.

**How to use this file:** Save this file as `docs/ANTIGRAVITY_30_DAY_PLAN.md` in the PathPilot repository. Open the repository in Antigravity. Each day, send exactly `START DAY N` (replace `N` with the day number). Antigravity must read this plan and the daily log, complete only that day's scope, verify the result, and commit/push when the safety conditions below are met.

---

## 1. Project reality and guiding principles

The current README describes Phase 1: Foundation: FastAPI, SQLAlchemy/SQLite, a React + TypeScript frontend, placeholder AI providers, and pytest tests. Treat that as a starting hypothesis, not proof that every feature works. The first day must inspect the actual repository and verify its state.

The target is a bounded, explainable career assistant, not an uncontrolled autonomous agent. Build one reliable end-to-end workflow before considering multi-agent orchestration.

### Target end-to-end workflow
1. User provides a resume file and a job description.
2. PathPilot extracts resume text and structures relevant evidence.
3. PathPilot extracts job requirements.
4. PathPilot compares evidence against requirements and identifies strengths, gaps, and unknowns.
5. PathPilot creates a practical preparation plan.
6. User reviews and approves the plan before it is saved or used for any consequential action.
7. User can track progress from the dashboard.

### Engineering principles
- Prefer free, local-first development and free-tier resources. Do not require paid APIs or cloud deployment.
- Keep provider integration modular. Never hard-code API keys or secrets.
- Do not upload private resumes to external services without explicit user consent.
- Use real, explainable evidence. Do not fabricate experience, qualifications, citations, job listings, or test results.
- Treat model-generated match scores as heuristic unless validated with an evaluation dataset.
- Validate file type and size; handle malformed PDFs, empty input, timeouts, and unavailable model providers.
- Keep existing working features unless a change is justified and tested.
- Avoid adding frameworks or dependencies without a clear need.
- Use small, reviewable changes and meaningful tests.
- Do not make the application automatically apply to jobs, send emails, or contact employers. Keep such actions out of scope.
- If a day's scope is too large, implement the smallest working slice, record what remains, and do not fake completion.

---

## 2. Required operating instructions for Antigravity

On every `START DAY N` command:
1. Read this file, `docs/DAILY_LOG.md` if it exists, repository instructions, and current Git status.
2. Confirm the requested day and inspect the relevant code before editing.
3. Check for uncommitted user changes. Never overwrite, discard, stash, reset, or clean them automatically. If unrelated or pre-existing changes could be affected, stop and ask.
4. Implement only the day's milestone. Avoid unrelated refactors.
5. Add or update tests for changed behaviour.
6. Run relevant backend tests, frontend build/lint/type checks, and any available security/config checks. Use the actual project commands; don't invent successful results.
7. Inspect the diff for bugs, accidental data, credentials, personal information, generated junk, and unintended file deletions.
8. Update `docs/DAILY_LOG.md` with the date, day number, changes, commands run, actual results, known issues, commit hash if available, and next day's goal.
9. Report a concise summary: files changed, feature completed, test/build results, known limitations, commit/push result, and one concept the user should understand.
10. Prepare a meaningful commit message. Do not create empty, artificial, or misleading commits.

### Git commit/push policy
The user wants a daily finish-and-push workflow. Treat `START DAY N` as permission to implement and, if all checks and safety conditions pass, create one meaningful commit and push the current working branch to its already configured upstream.

Before committing/pushing:
- Verify the branch and remote/upstream; never push to an unfamiliar remote or protected/default branch if the repository's conventions prohibit it.
- Never force-push, amend shared history, rewrite history, or run destructive Git commands.
- Never stage unrelated user changes. Stage only the files relevant to today's task.
- Never commit `.env`, credentials, tokens, private resumes, databases containing personal data, or other sensitive material.
- Run `git diff --check` and inspect the staged diff.
- If tests fail, secrets are detected, the working tree contains unrelated changes, the upstream is missing/ambiguous, or a destructive/unexpected operation is required, do not commit or push. Explain the blocker and provide the next safe step.
- Do not claim that a push succeeded unless the Git command confirms it. If network access or authentication prevents pushing, keep the local commit if safe, explain the failure, and provide the exact manual push command.
- Never create a fake commit simply to maintain a daily streak.

The user remains responsible for reviewing the resulting code and understanding it. Antigravity should explain important changes in plain language.

---

## 3. Definition of done by Day 30
- A user can run PathPilot locally from documented steps.
- Resume text can be extracted safely from supported PDF files.
- Job descriptions can be analysed into structured requirements.
- Resume/job comparison provides evidence, gaps, and uncertainty rather than an unexplained score alone.
- A real AI provider can be configured optionally, with a mock/deterministic fallback for tests and offline development.
- The preparation plan is structured, validated, editable, and saved only after user approval.
- Core backend paths have automated tests; frontend builds and its primary flow works.
- Evaluation examples and honest metrics document known limitations.
- No secrets or private test data are committed.
- README, architecture diagram, demo instructions, and troubleshooting are accurate.
- Git history contains meaningful changes, not empty daily commits.

---

## 4. Daily plan

### Day 1 — Repository audit and baseline
- **Outcome:** Know exactly what works before changing anything.
- **Tasks:**
  - Inspect repository structure, README, Git status, recent commits, dependencies, settings, and existing docs.
  - Review backend entry point, routes, SQLAlchemy models, Pydantic schemas, provider placeholders, frontend components, and tests.
  - Run existing backend tests and frontend build/type checks where available.
  - Verify `.gitignore`, `.env.example`, database initialization/seeding, and test database isolation.
  - Create `docs/30_DAY_PLAN.md` or link this plan from it, and create `docs/DAILY_LOG.md`.
  - Record implemented, partial, mocked, missing, and broken features separately.
- **Acceptance checks:**
  - Baseline commands and results are recorded accurately.
  - No application functionality is rewritten during the audit.
  - Risks and priorities for Days 2–7 are listed.
- **Suggested commit:** `docs: add PathPilot development roadmap and baseline audit`

### Day 2 — Stabilize setup and configuration
- **Outcome:** Reproducible local setup with clear configuration.
- **Tasks:**
  - Check dependency files and supported Python/Node versions against the actual project.
  - Verify environment-variable loading and safe defaults.
  - Ensure secrets are excluded and `.env.example` contains placeholders only.
  - Improve setup instructions only where the audit found inaccuracies.
  - Add a safe configuration validation test if appropriate.
- **Acceptance checks:**
  - Fresh setup steps are accurate for the tested environment.
  - Missing optional AI credentials do not prevent the foundation app from starting.
  - No secrets are present in tracked files.
- **Suggested commit:** `chore: stabilize local configuration and setup`

### Day 3 — Backend quality baseline
- **Outcome:** Consistent API errors and dependable tests.
- **Tasks:**
  - Inspect current API response/error conventions and test fixtures.
  - Improve the smallest necessary gaps in validation, status codes, and test isolation.
  - Add tests for health checks, dashboard metrics, and core CRUD paths that are actually implemented.
  - Ensure tests do not modify the developer's real SQLite database.
- **Acceptance checks:**
  - Relevant backend tests pass.
  - Error responses are predictable and invalid input is rejected cleanly.
  - Test database setup and cleanup are documented.
- **Suggested commit:** `test: strengthen backend API and database coverage`

### Day 4 — Resume upload contract and safety
- **Outcome:** A safe API contract for resume ingestion.
- **Tasks:**
  - Design a request/response schema for resume ingestion and a documented file-size limit.
  - Accept only supported PDF files; validate extension and content as reasonably as the existing stack allows.
  - Define safe temporary-file handling and cleanup, or use in-memory processing if appropriate.
  - Do not store raw resumes permanently unless there is a clear, documented reason and user consent.
  - Add tests for unsupported files, oversized files, empty files, and malformed PDFs.
- **Acceptance checks:**
  - Upload validation works and failure cases return useful errors.
  - Files are not left behind unintentionally.
  - Private resume content is not written to logs.
- **Suggested commit:** `feat: define safe resume ingestion endpoint`

### Day 5 — PDF text extraction
- **Outcome:** Extract readable text from supported PDFs.
- **Tasks:**
  - Select a lightweight free PDF text extraction library, preferring an existing dependency if suitable.
  - Implement a small, testable extraction service.
  - Handle empty, malformed, encrypted, and image-only/scanned PDFs gracefully; clearly state that OCR is not included unless deliberately added.
  - Add small synthetic test PDFs or fixtures that contain no private data.
  - Return extracted text and basic metadata without leaking file contents to logs.
- **Acceptance checks:**
  - Valid text-based PDFs extract correctly.
  - Failure cases are covered by tests.
  - Resource use and upload limits are documented.
- **Suggested commit:** `feat: extract text from PDF resumes`

### Day 6 — Resume structure and evidence
- **Outcome:** Convert raw text into a useful, validated resume profile.
- **Tasks:**
  - Implement conservative section detection for contact, summary, education, experience, projects, and skills where present.
  - Preserve raw text separately from extracted structured fields when appropriate; do not guess missing values.
  - Mark unknown or uncertain fields instead of inventing them.
  - Add Pydantic schemas and tests for varied formatting and missing sections.
  - Avoid saving unnecessary personal details.
- **Acceptance checks:**
  - Extraction produces a stable structured response.
  - Missing sections are allowed.
  - Tests cover at least three synthetic resume layouts.
- **Suggested commit:** `feat: structure resume sections with evidence`

### Day 7 — Resume workflow integration
- **Outcome:** Connect upload, extraction, validation, and UI feedback.
- **Tasks:**
  - Connect the ingestion endpoint to the frontend only after reviewing the existing component architecture.
  - Show upload state, processing errors, and a preview of extracted sections.
  - Avoid displaying private resume text in server logs or terminal output.
  - Add an end-to-end manual test checklist and automated tests where practical.
- **Acceptance checks:**
  - A sample resume can be processed through the documented flow.
  - Invalid files show useful errors.
  - Frontend build and relevant backend tests pass.
- **Suggested commit:** `feat: connect resume ingestion to the dashboard`

### Day 8 — Job description input and parsing
- **Outcome:** Accept a job description and turn it into structured requirements.
- **Tasks:**
  - Create an input form and backend schema for a pasted job description.
  - Extract likely role title, responsibilities, required skills, preferred skills, and qualifications using deterministic rules first.
  - Keep original evidence snippets or source text references so extracted requirements can be checked.
  - Treat absent or ambiguous requirements as unknown.
  - Add tests for empty, very long, and poorly formatted descriptions.
- **Acceptance checks:**
  - Input is validated and safely represented.
  - Extracted requirements are inspectable and not silently invented.
  - Error cases are tested.
- **Suggested commit:** `feat: parse job descriptions into requirements`

### Day 9 — Skill normalization
- **Outcome:** Compare equivalent skill names consistently.
- **Tasks:**
  - Build a small transparent skill-normalization map (for example, common aliases and spelling variants).
  - Keep the original phrase as well as its normalized form.
  - Avoid treating unrelated skills as equivalent.
  - Add unit tests for aliases, capitalization, punctuation, and unknown terms.
  - Document that this is a deliberately limited initial taxonomy.
- **Acceptance checks:**
  - Normalization is deterministic and explainable.
  - Unknown terms are retained rather than discarded.
  - Tests cover both matches and non-matches.
- **Suggested commit:** `feat: normalize skills for career analysis`

### Day 10 — Resume-to-job comparison
- **Outcome:** Explain which requirements have resume evidence.
- **Tasks:**
  - Compare normalized job requirements against structured resume evidence.
  - Classify requirements into evidence found, possible/partial evidence, and no evidence found.
  - Include resume snippets/section references and job requirement text for traceability.
  - Do not invent experience or infer protected characteristics.
  - Avoid presenting a percentage as an objective probability of getting hired.
- **Acceptance checks:**
  - Each finding has a traceable reason.
  - Unknowns are distinguished from definite gaps.
  - Unit tests cover clear matches, missing skills, and ambiguous evidence.
- **Suggested commit:** `feat: add evidence-backed resume job matching`

### Day 11 — Skill-gap report
- **Outcome:** Turn comparison results into prioritized gaps.
- **Tasks:**
  - Build a service that converts missing/partial requirements into a gap report.
  - Prioritize using transparent factors such as explicit job requirement level and resume evidence, not arbitrary hidden logic.
  - Explain why each gap was flagged and what evidence would change the result.
  - Add tests for empty requirement lists and mixed priorities.
- **Acceptance checks:**
  - The report explains each gap.
  - No unsupported claim is presented as fact.
  - Output is stable and schema-validated.
- **Suggested commit:** `feat: generate explainable skill gap reports`

### Day 12 — Preparation plan generator (deterministic baseline)
- **Outcome:** Create useful preparation tasks even without an external model.
- **Tasks:**
  - Generate a simple plan from identified gaps using reusable templates.
  - Include task title, reason, suggested activity, estimated effort, priority, and completion state.
  - Link each task to the requirement/gap that motivated it.
  - Keep task generation deterministic for predictable tests.
- **Acceptance checks:**
  - The app can create a useful plan without AI credentials.
  - Each task has a clear rationale.
  - Plan data validates and can be persisted safely.
- **Suggested commit:** `feat: generate structured career preparation plans`

### Day 13 — AI provider interface
- **Outcome:** A clean boundary between app logic and model providers.
- **Tasks:**
  - Audit the existing provider abstraction and placeholder implementations.
  - Define a narrow interface for the operations actually needed, such as structured analysis or plan refinement.
  - Keep deterministic/mock provider available for tests and offline use.
  - Configure optional credentials through environment variables only.
  - Avoid provider-specific code leaking into API routes or business logic.
- **Acceptance checks:**
  - Tests run without network calls or secrets.
  - Provider selection is explicit and documented.
  - Unsupported configuration fails clearly.
- **Suggested commit:** `refactor: define a testable AI provider interface`

### Day 14 — Optional real model integration
- **Outcome:** One real provider can be used without making the app depend on it.
- **Tasks:**
  - Choose one free/local or free-tier provider compatible with the current setup; check its current availability and terms before relying on it.
  - Add a thin adapter behind the provider interface.
  - Request schema-constrained or JSON output where supported, then validate it with Pydantic.
  - Add timeouts, bounded retries where appropriate, and safe fallback/error messages.
  - Never put credentials in source code or tests.
- **Acceptance checks:**
  - Mock tests remain deterministic.
  - Invalid model output is handled safely.
  - The app clearly reports missing configuration or provider failures.
  - Do not claim the provider works unless it has been tested with valid configuration.
- **Suggested commit:** `feat: add optional AI provider adapter`

### Day 15 — Model-assisted analysis with evidence
- **Outcome:** Use a model for language understanding without losing traceability.
- **Tasks:**
  - Use the model only for a defined task, such as improving extraction or drafting a plan.
  - Pass the minimum necessary resume/job information.
  - Ask it to return structured findings tied to supplied evidence.
  - Validate output, reject malformed fields, and preserve deterministic matching as the baseline.
  - Make it clear to users when external processing is enabled.
- **Acceptance checks:**
  - The app does not treat model output as automatically true.
  - Evidence links/snippets are retained or checked against source text.
  - Provider failure does not corrupt saved data.
- **Suggested commit:** `feat: add evidence-grounded AI career analysis`

### Day 16 — First bounded agent workflow
- **Outcome:** A single workflow coordinates defined tools.
- **Tasks:**
  - Implement a simple, inspectable orchestration service for the existing tools: parse resume, parse job, compare requirements, generate plan.
  - Define input/output schemas for each step.
  - Keep tool permissions narrow; do not allow arbitrary shell commands, unrestricted filesystem access, or autonomous external actions.
  - Add explicit workflow states and clear errors.
  - Prefer a straightforward Python workflow over adding an agent framework unless the audit shows a strong need.
- **Acceptance checks:**
  - The workflow can be traced step by step.
  - Invalid inputs stop safely.
  - Unit tests cover successful execution and step failures.
- **Suggested commit:** `feat: orchestrate the career analysis workflow`

### Day 17 — User approval and persistence
- **Outcome:** The user controls what becomes an active career plan.
- **Tasks:**
  - Present the generated plan for review.
  - Support approve, edit, or reject before creating active tasks.
  - Persist only validated, approved plan data.
  - Keep a simple audit trail of approval status and timestamps without storing unnecessary personal information.
  - Add API and UI tests for each decision path.
- **Acceptance checks:**
  - A generated plan is not treated as approved automatically.
  - Rejecting a plan does not create active tasks.
  - Approval and persistence behavior are tested.
- **Suggested commit:** `feat: add human approval for career plans`

### Day 18 — Dashboard workflow
- **Outcome:** The main career workflow is usable from the frontend.
- **Tasks:**
  - Connect resume upload, job description input, analysis results, gap report, and plan review.
  - Show loading, empty, success, and failure states.
  - Make the evidence behind findings easy to inspect.
  - Keep accessibility and responsive layout in mind.
  - Avoid unrelated visual redesigns.
- **Acceptance checks:**
  - A user can complete the core workflow through the UI.
  - Errors are understandable.
  - Frontend build/type checks and relevant API tests pass.
- **Suggested commit:** `feat: integrate career analysis workflow in UI`

### Day 19 — Evaluation dataset
- **Outcome:** Measure quality using repeatable examples.
- **Tasks:**
  - Create a small synthetic evaluation dataset with no real personal resumes.
  - Include varied resumes and job descriptions with expected skill evidence and gap labels.
  - Define simple metrics, such as precision/recall for requirement detection where appropriate, and schema-validity rate.
  - Keep a clear distinction between evaluation examples and training data.
  - Record limitations and avoid inflated claims.
- **Acceptance checks:**
  - Evaluation can be rerun.
  - Expected labels are documented.
  - Results are reproducible and honestly reported.
- **Suggested commit:** `test: add career analysis evaluation dataset`

### Day 20 — Reliability and edge cases
- **Outcome:** Failures are handled without corrupting workflows.
- **Tasks:**
  - Test malformed PDFs, empty descriptions, very long input, invalid model output, provider timeout, and database errors.
  - Add appropriate timeouts and bounded retries only where safe.
  - Ensure failed workflows leave no misleading partial approved plan.
  - Add structured logs that exclude secrets and raw resume contents.
  - Improve error messages where needed.
- **Acceptance checks:**
  - Edge cases have tests.
  - Failures are visible and actionable.
  - Sensitive content is not logged.
- **Suggested commit:** `fix: harden career workflow error handling`

### Day 21 — Security and privacy pass
- **Outcome:** Reduce obvious risks before polishing.
- **Tasks:**
  - Review upload validation, file-size limits, temporary-file cleanup, input validation, CORS, secret handling, and database boundaries.
  - Check whether any API route assumes a single default user; document local-only limitations and avoid implying authentication exists.
  - Add tests for invalid input and any security controls that can be tested locally.
  - Review dependencies and remove unused ones only when safe.
  - Do not introduce authentication complexity unless it is necessary for the app's current local use; document it as a limitation.
- **Acceptance checks:**
  - No secrets or real personal data are tracked.
  - Security assumptions and local-only limitations are documented.
  - Fixes are covered by tests where practical.
- **Suggested commit:** `security: harden local data handling and configuration`

### Day 22 — Application tracking
- **Outcome:** Approved preparation tasks can be tracked over time.
- **Tasks:**
  - Inspect existing Task and Goal models before extending them.
  - Add only the minimal fields or relationships needed for task status, due date (optional), and completion timestamps.
  - Keep migrations/schema initialization compatible with the current local database strategy.
  - Add API and persistence tests.
  - Ensure sample seed data remains clearly identifiable as demo data.
- **Acceptance checks:**
  - Task status survives a restart.
  - Existing foundation data is handled safely.
  - Tests cover valid and invalid status transitions.
- **Suggested commit:** `feat: improve career task tracking`

### Day 23 — Progress and activity feedback
- **Outcome:** The dashboard reflects real persisted state.
- **Tasks:**
  - Verify dashboard metrics derive from database state rather than hard-coded values.
  - Display plan status, completed tasks, and remaining tasks with clear empty states.
  - Ensure metrics remain correct after refresh and restart.
  - Add tests for zero tasks, all complete, and partially complete states.
- **Acceptance checks:**
  - Displayed progress matches stored records.
  - UI handles empty data and API failures.
  - Backend tests and frontend build pass.
- **Suggested commit:** `feat: show persisted career plan progress`

### Day 24 — End-to-end acceptance pass
- **Outcome:** Verify the whole workflow, not just isolated functions.
- **Tasks:**
  - Write a repeatable manual acceptance checklist from fresh start to approved plan and completed task.
  - Add automated integration tests for key backend paths.
  - Run backend tests, frontend build/type checks, and any configured lint commands.
  - Fix high-impact defects only; log lower-priority polish separately.
  - Capture screenshots locally for documentation if useful, making sure no private data is visible.
- **Acceptance checks:**
  - The core workflow is demonstrably functional.
  - Setup and acceptance steps can be followed by another developer.
  - Any known failures are recorded honestly.
- **Suggested commit:** `test: verify end-to-end PathPilot workflow`

### Day 25 — Docker and reproducibility
- **Outcome:** Make the development environment easier to reproduce.
- **Tasks:**
  - Inspect the existing docker-compose.yml blueprint and current dependencies.
  - Fix it only if the app can be reliably run with Docker in the available environment.
  - Keep secrets external and volumes/data persistence explicit.
  - If Docker cannot be tested, document the unverified status and prioritize accurate local setup instructions.
  - Avoid adding production deployment complexity.
- **Acceptance checks:**
  - Either the documented Docker flow works in a tested environment, or its limitations are clearly recorded.
  - Local non-Docker setup still works.
  - No secrets are embedded in images or config.
- **Suggested commit:** `chore: improve reproducible development setup`

### Day 26 — Architecture and developer documentation
- **Outcome:** A reviewer can understand how the app works.
- **Tasks:**
  - Create an architecture diagram showing frontend, API, services, database, PDF extraction, provider interface, and workflow.
  - Document key request/response paths and important design decisions.
  - Document where deterministic logic ends and model-generated output begins.
  - Add a short troubleshooting section.
  - Ensure every diagram and claim matches the actual code.
- **Acceptance checks:**
  - Architecture documentation is accurate.
  - A new developer can trace the core workflow.
  - No feature is described as complete if it remains a placeholder.
- **Suggested commit:** `docs: document PathPilot architecture and workflow`

### Day 27 — README and demo experience
- **Outcome:** A recruiter can understand and run PathPilot quickly.
- **Tasks:**
  - Rewrite README sections as needed: project overview, current implemented features, architecture, tech stack, setup, tests, demo flow, privacy, limitations, and roadmap.
  - Add screenshots only if they reflect the actual working application.
  - Add a clear disclaimer that the tool supports preparation and does not guarantee hiring outcomes.
  - Remove broken Markdown escaping and verify links/code blocks render correctly.
  - Clearly separate implemented features from future work.
- **Acceptance checks:**
  - README is truthful, clear, and runnable.
  - Setup commands match tested commands.
  - Screenshots contain no personal or secret information.
- **Suggested commit:** `docs: polish README for portfolio presentation`

### Day 28 — Code quality and performance pass
- **Outcome:** Remove avoidable rough edges without risky rewrites.
- **Tasks:**
  - Identify duplicate logic, overly large modules, unused code, and slow paths.
  - Refactor only high-value, low-risk issues.
  - Add or improve type annotations and clear function boundaries.
  - Check input size and avoid unnecessary repeated model calls.
  - Re-run the evaluation dataset and test suite after each meaningful change.
- **Acceptance checks:**
  - No behavior changes without tests.
  - Evaluation results are recorded.
  - The app remains runnable from documented steps.
- **Suggested commit:** `refactor: improve maintainability of career services`

### Day 29 — Release candidate and GitHub review
- **Outcome:** A clean, reviewable candidate release.
- **Tasks:**
  - Inspect Git status, commit history, tracked files, ignored files, and staged diff.
  - Check for secrets and personal data using available local tools.
  - Run the complete backend test suite, frontend build/type checks, evaluation, and git diff --check.
  - Test documented setup in a fresh environment if feasible.
  - Fix release-blocking issues; record non-blocking limitations.
  - Do not claim coverage or quality metrics unless they were measured.
- **Acceptance checks:**
  - All required checks have recorded results.
  - No known secrets or personal test data are committed.
  - Remaining limitations are listed.
- **Suggested commit:** `chore: prepare PathPilot portfolio release`

### Day 30 — Final demo and release
- **Outcome:** A project you can confidently demonstrate and explain in an interview.
- **Tasks:**
  - Run the full acceptance flow from the README.
  - Prepare a 2–3 minute demo script: problem, workflow, architecture, evidence-backed results, tests/evaluation, limitations, and next steps.
  - Confirm the GitHub repository description, topics, README, docs, and screenshots are consistent with the actual app.
  - Tag a version only if the repository's release process is understood and the working tree is clean.
  - Create a final report summarizing features, architecture, tests, evaluation results, known limitations, and what was learned.
  - Do not invent metrics, user numbers, model accuracy, or deployment claims.
- **Acceptance checks:**
  - Demo works in the tested environment.
  - The project can be explained clearly without relying on AI-generated claims.
  - Final report and repository state are accurate.
- **Suggested commit:** `docs: finalize PathPilot demo and project report`

---

## 5. Daily session template
Use this timebox as a guide; extend a day only if needed and record the change.
- **10 minutes:** Review yesterday's log and today's acceptance checks.
- **70–90 minutes:** Implement the smallest complete feature.
- **20–30 minutes:** Add tests, run checks, inspect the diff.
- **10 minutes:** Update docs/log, commit, push if all safety conditions pass, and read the summary.

Do not rush a broken implementation merely to finish a numbered day. A safely documented blocker is better than a fake completion.

---

## 6. What to do when a day fails
If tests fail or a dependency blocks progress:
1. Capture the exact command and error.
2. Determine whether the failure was pre-existing or introduced today.
3. Fix only the relevant cause if safe and within scope.
4. Re-run the relevant checks.
5. If still blocked, update the daily log, do not claim success, and do not push an unsafe change.
6. Resume the same day next session rather than skipping ahead.

---

## 7. Interview preparation alongside implementation
At the end of each session, Antigravity should teach one concept from that day's work and ask you to explain it back in your own words. Across the month, be prepared to explain:
- FastAPI request flow, validation, and error handling.
- SQLAlchemy models, transactions, and test database isolation.
- PDF extraction limits and privacy.
- Embeddings/RAG only if actually implemented; do not claim RAG if the project does not use retrieval.
- Provider abstraction, structured outputs, timeouts, and fallback behavior.
- Agent tools, bounded permissions, state, and human approval.
- Evaluation dataset design and what metrics do or do not prove.
- Git diffs, commits, branches, tests, and reproducible setup.

**Final rule:** Build a smaller system you understand, can test, and can demonstrate over a larger system you cannot explain.
