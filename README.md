# psu-hackathon — Kinetic (AutoPortfolio)

> An AI "black box" for your professional life: drop messy work artifacts in,
> get organized admin tasks **and** a shareable Proof-of-Skill card out.

**Stage:** Discovery → Build (PSU Hackathon v0)
**Owner:** @unclenate
**Hackathon submission target:** 2026-05-19

---

## Quickstart — run the M1 regression

Zero npm install. Zero API keys required. Pure Node ESM.

```bash
node --version                     # need v18+
node src/validate.mjs --selftest   # validator self-test
node src/regression.mjs            # mock-provider regression run (M1 gate)
```

Expected output:

```
Schema-valid:     10/10 (100.0%)
Category match:   10/10 (100.0%)
✓ M1 exit criterion MET for provider "mock"
```

Run against real LLMs once keys are configured:

```bash
cp .env.example .env.local         # add GEMINI_API_KEY and/or ANTHROPIC_API_KEY
export $(grep -v '^#' .env.local | xargs)
KINETIC_PROVIDER=gemini node src/regression.mjs
KINETIC_PROVIDER=claude node src/regression.mjs
```

---

## Where the project lives

### Governance & product docs

| Artifact | Path |
|---|---|
| Concept (raw) | [`docs/discovery/inbox/`](docs/discovery/inbox/) |
| Intake questionnaire | [`docs/discovery/intake-questionnaire.md`](docs/discovery/intake-questionnaire.md) |
| Problem statement | [`docs/product/problem-statement.md`](docs/product/problem-statement.md) |
| Personas | [`docs/product/personas.md`](docs/product/personas.md) |
| Requirements | [`docs/product/requirements.md`](docs/product/requirements.md) |
| MVP scope | [`docs/discovery/mvp-scope.md`](docs/discovery/mvp-scope.md) |
| Release intent (v0) | [`docs/product/release-intent.md`](docs/product/release-intent.md) |
| Scope plan | [`docs/project/scope-plan.md`](docs/project/scope-plan.md) |
| Milestones | [`docs/project/milestones.md`](docs/project/milestones.md) |
| Change log | [`docs/project/change-log.md`](docs/project/change-log.md) |
| Shared observations | [`docs/knowledge/shared-observations.md`](docs/knowledge/shared-observations.md) |
| ADR-0001 (stack + composition) | [`docs/adr/ADR-0001-stack-and-composition.md`](docs/adr/ADR-0001-stack-and-composition.md) |
| Harness manifest | [`harness.manifest.yaml`](harness.manifest.yaml) |
| Governance platform (submodule) | [`.harness/`](.harness/) |

### Code (M1 build)

| Artifact | Path |
|---|---|
| JSON Schema (LLM output contract) | [`schemas/kinetic-output.schema.json`](schemas/kinetic-output.schema.json) |
| Prompt template | [`prompts/capture-to-output.md`](prompts/capture-to-output.md) |
| Regression inputs (10 fixed) | [`tests/regression-inputs.jsonl`](tests/regression-inputs.jsonl) |
| Regression methodology | [`tests/README.md`](tests/README.md) |
| Validator (zero-dep) | [`src/validate.mjs`](src/validate.mjs) |
| Regression runner | [`src/regression.mjs`](src/regression.mjs) |
| Mock LLM provider | [`src/providers/mock.mjs`](src/providers/mock.mjs) |
| Gemini provider | [`src/providers/gemini.mjs`](src/providers/gemini.mjs) |
| Claude fallback provider | [`src/providers/claude.mjs`](src/providers/claude.mjs) |

---

## Stack (v0)

- **Frontend:** Next.js (App Router) + TypeScript, deployed as a PWA on Vercel *(M2)*
- **Backend:** Supabase (Postgres + Auth + Storage) + thin orchestration layer *(M2)*
- **LLM:** Gemini (structured outputs) primary, Claude fallback ✅ *(M1)*

Rationale: [ADR-0001](docs/adr/ADR-0001-stack-and-composition.md).

The M1 harness ships as zero-dependency Node ESM (`.mjs`) so it can run without
`npm install`. TypeScript migration is captured as a follow-up in
[`docs/knowledge/shared-observations.md`](docs/knowledge/shared-observations.md).

---

## Milestone status

| ID | Milestone | Status |
|----|-----------|--------|
| M0 | Discovery distilled | ✅ Done |
| M1 | LLM contract working | ✅ Done (mock 10/10). Real-provider runs pending API keys. |
| M2 | End-to-end capture path | ⏭ Next |
| M3 | Public share link | Planned |
| M4 | Demo dry-run passed | Planned |
| M5 | Hackathon submission | Planned |

Full detail: [`docs/project/milestones.md`](docs/project/milestones.md).
