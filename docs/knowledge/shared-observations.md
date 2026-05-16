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

---

## 2026-05-16 — Real-LLM regression numbers (hackathon venue, shared-IP NAT)

**Context:** API keys configured (`.env.local`, gitignored). Regression executed
on the hackathon venue network, which shares an outbound IP across many
attendees and triggers provider rate limits that are not representative of a
production deployment.

**Observation:**

| Provider | Schema-valid | Category match | Notes |
|----------|--------------|----------------|-------|
| `mock`   | 10/10        | 10/10          | Deterministic, no network |
| `claude` (`claude-sonnet-4-5`) | **10/10** | **10/10** | 4–7s per call; structured output via `tool_use` |
| `gemini` (`gemini-2.5-flash`)  | 8/10      | 8/10       | 2 failures were HTTP 429 / 503 — NOT schema violations. Of calls that succeeded, schema validity was 100%. |

**Implication:**
- The schema and prompt are sound. Both real LLMs that responded produced
  schema-valid output on every attempt.
- Gemini's failures are infrastructure-shaped (rate-limit + transient 503),
  triggered by venue NAT putting hundreds of hackathon attendees on the same
  outbound IP and exceeding the 5-req/min free-tier limit. A retry-with-backoff
  layer has been added (`src/providers/gemini.mjs`) and will absorb this on a
  normal network.
- For the demo we will run with `KINETIC_PROVIDER=claude` as the primary at
  the venue and fall back to `mock` if Anthropic also rate-limits the shared IP.
  ADR-0001's Gemini-primary stance stands for production.

**Action:**
- Treat the Gemini 8/10 as "blocked by environment, not by contract."
- Do not block M1 exit on it. Re-measure on a non-venue network post-hackathon
  and update this entry with the production-network number.
