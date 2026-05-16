# Project Change Log

This log records material changes to project scope, plan, timeline, or technical
direction. It is not a git commit log — it captures *decisions and their rationale*.

---

## Log

| Date | Type | Change | Reason | Owner | ADR |
| ---- | ---- | ------ | ------ | ----- | --- |
| 2026-05-16 | Scope | Initial scope captured: hackathon v0 = single-user demo, image+text capture, public share link | Distillation of `docs/discovery/inbox/` concept doc | @unclenate | — |
| 2026-05-16 | Technical | Stack selected: Node/TS + Supabase + Gemini (Claude fallback); composition starts as `new-product-discovery`, will migrate after hackathon | Hackathon timebox; need rapid iteration without tripping required-artifact validations | @unclenate | ADR-0001 |
| 2026-05-16 | Scope | Voice memo capture moved from Must to Should tier for v0 | Demo can land without it; image+text covers the magic moment | @unclenate | — |
| 2026-05-16 | Scope | Auth deferred for v0; single hardcoded demo user | Demo-time risk; auth flow is the wrong place to spend hackathon hours | @unclenate | — |
| 2026-05-16 | Technical | M1 landed: JSON schema + prompt template + zero-dependency Node ESM regression harness + Gemini and Claude providers. Mock provider passes 10/10 schema-valid. Real-provider runs deferred until API keys are configured. | Lock the highest-risk dependency before building UI. Zero-dep `.mjs` avoids `npm install` time-cost during the 72-min build window; TypeScript migration captured as a follow-up. | @unclenate | ADR-0001 |
| 2026-05-16 | Technical | Real-LLM regression measured: Claude 10/10, Gemini 8/10 (failures = 429/503 rate-limit at venue shared-IP NAT, not schema violations). Demo at venue will default to Claude. | M1 quality gate measured against real LLMs, not just the mock | @unclenate | — |
| 2026-05-16 | Scope | Supabase persistence deferred from M2 to P3; v0 uses in-memory `Map` instead. RLS criterion for M3 likewise deferred — replaced for v0 with an `isPublic` flag on each card. | Hackathon time budget; in-memory is sufficient for the demo and removes a vendor wiring step that wasn't on the critical path. | @unclenate | — |
| 2026-05-16 | Technical | M2 + M3 landed: zero-dependency Node HTTP server (`web/server.mjs`), single-page capture UI, public share-link page. End-to-end loop verified in Chrome with screenshots committed under `docs/screenshots/`. | Demoable artifact for the submission. | @unclenate | — |
| 2026-05-16 | Scope | Added signal-harvester contract and two implementations: GitHub (public events, no auth) and Calendar (pasted-text v0 seam). Three new endpoints: `POST /api/harvest/github`, `POST /api/harvest/calendar`. UI gains a tabbed "Harvest from a signal source" panel that displays generated Proof cards inline. | Demonstrates that Kinetic is source-agnostic — every capture goes through the same M1 LLM contract. Google / Outlook OAuth harvesters can slot into the same `harvest()` interface later. | @unclenate | — |

---

## What Belongs Here

Add an entry when:
- A requirement is added, removed, or significantly changed
- A milestone is moved or dropped
- An architectural decision changes direction
- A feature is explicitly deferred to a future release
- A third-party dependency changes (vendor, API, integration)

Do NOT add entries for routine code changes, minor doc fixes, or bug fixes that
don't change scope or direction.

---

## Reference

| Resource | Path |
| -------- | ---- |
| Requirements | [`docs/product/requirements.md`](../product/requirements.md) |
| MVP scope | [`docs/discovery/mvp-scope.md`](../discovery/mvp-scope.md) |
| ADR directory | [`docs/adr/`](../adr/) |
| Milestones | [`docs/project/milestones.md`](./milestones.md) |
