# Shared Observations — Kinetic

Append-only log of notable observations from the build. Per
`platform/profiles/management/knowledge-capture`, this is the raw input that
later gets distilled into `distilled-learnings.md`.

Format: one entry per observation. Date, context, observation, implication.

---

## 2026-05-16 — Mock provider is enough for M1 mechanics; not enough for M1 quality gate

**Context:** M1 build, ~72-minute window. No LLM API keys configured.

**Observation:** A deterministic mock LLM provider (keyword + regex heuristics)
produces 10/10 schema-valid outputs on the regression set, and 10/10 category-
match after one regex-ordering fix. This proves the harness mechanics — schema,
prompt template, validator, runner — work end-to-end without any external
dependency.

**Implication:** The M1 exit criterion ("≥9/10 schema-valid") is now demonstrably
met for the *mock* provider. The real-LLM measurement is gated only on API
keys. When keys land, run `KINETIC_PROVIDER=gemini node src/regression.mjs` and
`KINETIC_PROVIDER=claude node src/regression.mjs`. If either provider scores
<9/10, capture failure modes here and iterate on the prompt before touching the
schema.

---

## 2026-05-16 — Initial regex ordering bug surfaced via category-match telemetry

**Context:** First regression run.

**Observation:** reg-04 ("customer call ... they have the exact failure mode
we built for") classified as `fix` instead of `collab`. The `fix` regex matched
the substring "fail" before the `collab` regex matched "customer". One regex
re-order fixed it.

**Implication:** Even though category-match is informational (not a gate), it
surfaced a real classification bug that would have been embarrassing in the
demo. Keep category-match as a soft signal in the regression output forever —
it's free defect-detection.

---

## 2026-05-16 — Zero-dep `.mjs` was the right call for the 72-min window

**Context:** ADR-0001 commits the project to TypeScript across the stack.

**Observation:** Shipping the M1 harness as plain Node ESM (`.mjs`) with zero
dependencies meant `node src/regression.mjs` worked on first run with no
`npm install` step. An `npm install` cycle (network + tsc + tooling) would
plausibly have eaten 5–10 minutes that the build window did not have.

**Implication:** Mark a follow-up to migrate `src/` to TypeScript in P3 once
the hackathon submission is locked. The `.mjs` files are small (~600 lines
total) and the types are easy to recover. Logged as a follow-up in
`docs/project/change-log.md` 2026-05-16 entry.
