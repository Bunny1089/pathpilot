# PathPilot 30-Day Development Roadmap

This document indexes and links the active 30-day build plan for PathPilot 2.0.

The canonical day-by-day plan with operating rules, acceptance criteria, and interview topics is maintained in:
👉 [ANTIGRAVITY_30_DAY_PLAN.md](file:///c:/Users/Meet/Desktop/pathpilot/docs/ANTIGRAVITY_30_DAY_PLAN.md)

The ongoing execution log tracking every daily milestone, commands run, test results, and blockers is maintained in:
👉 [DAILY_LOG.md](file:///c:/Users/Meet/Desktop/pathpilot/docs/DAILY_LOG.md)

---

## 30-Day High-Level Phase Overview

| Phase | Days | Focus | Key Deliverables |
|---|---|---|---|
| **Phase 1: Stabilization & Quality** | Days 1–3 | Baseline audit, configuration, backend test isolation | Clean baseline, stable configs, isolated DB fixtures |
| **Phase 2: Ingestion & Extraction** | Days 4–7 | PDF resume ingestion, text extraction, section structuring, UI | Safe upload endpoint, PyMuPDF extraction, section parser, UI feedback |
| **Phase 3: Requirements & Matching** | Days 8–11 | Job description parsing, skill normalization, resume-to-job matching | Deterministic JD parser, canonical skill taxonomies, evidence-backed matching, gap reporting |
| **Phase 4: Planning & Intelligence** | Days 12–15 | Deterministic plan generator, AI provider abstraction, optional model integration | Gap-to-plan generator, provider interface, local/free-tier LLM adapter, evidence grounding |
| **Phase 5: Agent Workflow & UI** | Days 16–18 | Bounded orchestrator, human approval & persistence, integrated UI | State machine workflow, human-in-the-loop review, dashboard workflow integration |
| **Phase 6: Quality, Security & Tracking** | Days 19–23 | Evaluation dataset, edge cases & reliability, security audit, task tracking | Precision/recall evaluation, sanitized error handling, privacy pass, persistent progress feedback |
| **Phase 7: Production Readiness** | Days 24–30 | End-to-end acceptance, Docker/reproducibility, architecture docs, README, release | E2E checklist, verified Docker setup, architecture diagrams, interview-ready portfolio demo |

---

*See [ANTIGRAVITY_30_DAY_PLAN.md](file:///c:/Users/Meet/Desktop/pathpilot/docs/ANTIGRAVITY_30_DAY_PLAN.md) for detailed tasks, acceptance checks, and daily prompts.*
