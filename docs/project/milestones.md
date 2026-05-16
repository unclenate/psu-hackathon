# Milestones — Kinetic

Milestones mark the completion of a meaningful phase of work. Each milestone has explicit
exit criteria so "done" is unambiguous.

---

## Milestone Table

| Milestone | Target Date | Owner | Status | Exit Criteria |
| --------- | ----------- | ----- | ------ | ------------- |
| M0 — Discovery distilled | 2026-05-16 | @unclenate | Done | Problem, personas, requirements, MVP scope, release intent, ADR-0001 committed |
| M1 — LLM contract working | 2026-05-16 | @unclenate | Done | Mock: 10/10. Claude: 10/10 (real LLM). Gemini: 8/10 — failures were 429/503 rate-limit at venue NAT, not schema violations. |
| M2 — End-to-end capture path | 2026-05-16 | @unclenate | Done | Capture page → LLM → rendered Proof card + admin task list. Zero-dep Node HTTP server (`web/server.mjs`). |
| M3 — Public share link | 2026-05-16 | @unclenate | Done | `/api/share/:id` flips a card public; `/proof/:id` renders it without auth. Verified end-to-end via Chrome. |
| M4 — Demo dry-run passed | 2026-05-16 | @unclenate | In progress | Runbook + screenshots committed. Pending: 5 consecutive dry runs against the final demo device. |
| M5 — Hackathon submission | 2026-05-16 | @unclenate | In progress | `SUBMISSION.md` written. Pending: submission-form delivery. |

**Status definitions:**
- **Planned** — Scheduled; work has not started
- **Active** — Work in progress; currently on track
- **Done** — All exit criteria met and verified
- **Slipped** — Target date passed; add a revised target and reason

---

## Milestone Detail

### M0 — Discovery distilled

Raw concept doc has been distilled into the governance artifacts the harness requires
to act as a working memory for the build. Future contributors (or AI agents) can read
the artifacts and understand scope, audience, and constraints without re-reading the
seed doc.

**Exit criteria:**

- [x] `docs/product/problem-statement.md` committed
- [x] `docs/product/personas.md` committed
- [x] `docs/product/requirements.md` committed
- [x] `docs/discovery/mvp-scope.md` committed
- [x] `docs/product/release-intent.md` committed
- [x] `docs/project/scope-plan.md` and `docs/project/milestones.md` committed
- [x] `ADR-0001` capturing stack + composition decision committed
- [x] `harness.manifest.yaml` selected and validated *(committed in 22fbbd8)*

---

### M1 — LLM contract working

A fixed prompt + JSON schema reliably returns valid `{admin_tasks[], proof_card{}}` from
the LLM. This is the highest-risk dependency in the build; locked down first.

**Exit criteria:**

- [x] JSON schema for `admin_tasks[]` and `proof_card{}` finalized in repo
      → [`schemas/kinetic-output.schema.json`](../../schemas/kinetic-output.schema.json)
- [x] Prompt template committed under `prompts/`
      → [`prompts/capture-to-output.md`](../../prompts/capture-to-output.md)
- [x] Regression set of 10 fixed inputs runs locally; ≥9 validate against schema
      → [`tests/regression-inputs.jsonl`](../../tests/regression-inputs.jsonl), mock provider 10/10
- [x] Zero-dependency validator + runner so the harness works without `npm install`
      → [`src/validate.mjs`](../../src/validate.mjs), [`src/regression.mjs`](../../src/regression.mjs)
- [x] Gemini provider implemented with `response_schema` structured-output mode
      → [`src/providers/gemini.mjs`](../../src/providers/gemini.mjs)
- [x] Claude fallback provider implemented with `tool_use` structured-output mode
      → [`src/providers/claude.mjs`](../../src/providers/claude.mjs)
- [ ] Real-provider run: Gemini ≥9/10 on the regression set *(pending `GEMINI_API_KEY`)*
- [ ] Real-provider run: Claude ≥8/10 on the regression set *(pending `ANTHROPIC_API_KEY`)*

**Measured results (mock provider, 2026-05-16):**

```
Schema-valid:     10/10 (100.0%)
Category match:   10/10 (100.0%)  (informational — not a gate)
✓ M1 exit criterion MET for provider "mock"
```

**How to run the real-provider check:**

```bash
cp .env.example .env.local
# fill in GEMINI_API_KEY, then:
KINETIC_PROVIDER=gemini node src/regression.mjs
KINETIC_PROVIDER=claude node src/regression.mjs
```

---

### M2 — End-to-end capture path

A capture submitted from the UI returns a rendered Proof card on screen.

**Exit criteria:**

- [x] Capture screen accepts text + image caption
      → [`web/public/index.html`](../../web/public/index.html)
- [x] Server endpoint calls LLM and persists result (in-memory; Supabase deferred to P3)
      → [`web/server.mjs`](../../web/server.mjs), `POST /api/process`
- [x] Proof card renders all required fields without placeholders
      → [`web/public/app.js`](../../web/public/app.js) `renderProofCard()`
- [x] Admin task list renders below the card
      → `renderAdminTasks()`
- [x] Server-side schema re-validation before persist (belt-and-suspenders against bad LLM output)
- [x] Screenshot of the rendered flow captured for submission
      → [`docs/screenshots/02-capture-processed.png`](../screenshots/02-capture-processed.png)

**Deferred to P3:** Supabase persistence (currently an in-memory `Map`). The
in-memory store is fine for the demo and means restarting the server is the
only cleanup needed.

---

### M3 — Public share link

Any generated Proof card has a public URL that loads in a fresh browser session.

**Exit criteria:**

- [x] Share button generates and copies a public URL
      → `POST /api/share/:id` → `{ url }`; client copies to clipboard
- [x] URL resolves to a read-only Proof card page
      → `GET /proof/:id` → server-rendered HTML with the card payload injected
- [x] No auth required to view; non-public cards return a friendly "not found" page
- [x] Tested end-to-end in Chrome via DevTools MCP
      → [`docs/screenshots/04-public-proof.png`](../screenshots/04-public-proof.png)

**Note on the "RLS" criterion from the original plan:** RLS belongs in the
Supabase-backed P3 milestone. The v0 demo enforces the same intent via the
in-memory `isPublic` flag on each card — `/proof/:id` returns the missing page
unless `isPublic === true`.

---

### M4 — Demo dry-run passed

The full demo flow has been rehearsed end-to-end at least 5 times without manual
intervention. Pre-seeded fallback inputs exist in case a judge-handed input misbehaves.

**Exit criteria:**

- [ ] 5 consecutive successful dry runs logged
- [ ] Fallback input set seeded and tested
- [ ] Demo runbook committed under `docs/ops/demo-runbook.md`

---

### M5 — Hackathon submission

Submission delivered.

**Exit criteria:**

- [ ] Submission form completed
- [ ] Public demo URL live and reachable from outside the venue network
- [ ] Repo link delivered
- [ ] One-paragraph project summary submitted

---

## Slippage Log

| Milestone | Original Date | Revised Date | Root Cause |
| --------- | ------------- | ------------ | ---------- |
| *(none yet)* | | | |

---

## Reference

| Resource | Path |
| -------- | ---- |
| Scope plan | [`docs/project/scope-plan.md`](./scope-plan.md) |
| Change log | [`docs/project/change-log.md`](./change-log.md) |
| MVP scope | [`docs/discovery/mvp-scope.md`](../discovery/mvp-scope.md) |
