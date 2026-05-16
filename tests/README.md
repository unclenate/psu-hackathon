# Tests — Kinetic M1 Regression

The regression set is the M1 quality gate. Its job is to measure how often the
selected LLM provider produces schema-valid `{admin_tasks[], proof_card{}}`
output for a fixed, hand-curated set of capture inputs.

---

## What's here

| File | Purpose |
|------|---------|
| `regression-inputs.jsonl` | Ten fixed capture inputs spanning the categories Kinetic must handle |
| `fixtures/` | Reserved for static expected-shape fixtures (currently empty; mock provider self-validates) |

---

## Coverage of the 10 inputs

| ID | Scenario | Expected category |
|----|----------|-------------------|
| reg-01 | Bug fix (the canonical demo: webhook 401) | `fix` |
| reg-02 | Feature ship (revenue dashboard to prod) | `build` |
| reg-03 | Design review (billing flow auto-renew) | `design` |
| reg-04 | Customer discovery call | `collab` |
| reg-05 | Learning capture (paper on PQ / FAISS) | `learning` |
| reg-06 | Refactor (auth middleware extraction) | `build` |
| reg-07 | Debugging dead-end (flaky test, gave up) | `research` |
| reg-08 | Infrastructure migration (Postgres 13 → 16) | `infra` |
| reg-09 | Mentoring / pairing session | `collab` |
| reg-10 | **Low-signal canary** ("stuff today was hard") | `other` |

**reg-10 is the canary.** If a provider produces a confident, technology-tagged
Proof card from "stuff today was hard," it is hallucinating and we should
tighten the anti-fabrication rules in `prompts/capture-to-output.md`.

---

## How to run

```bash
# Mock provider (default; no API keys, deterministic)
node src/regression.mjs

# Validator self-test (proves the validator catches bad output)
node src/validate.mjs --selftest

# Real providers (require API keys in .env.local or shell env)
KINETIC_PROVIDER=gemini node src/regression.mjs
KINETIC_PROVIDER=claude node src/regression.mjs
```

---

## Exit criteria

- **M1 gate:** ≥9 of 10 outputs schema-valid against
  `schemas/kinetic-output.schema.json` for the chosen provider.
- **Soft signal (not a gate):** category match rate. Useful for catching
  prompt-tuning regressions.

---

## When a regression run fails

1. Look at the first failing input — failures often cluster on one prompt weakness.
2. Try a prompt tweak first; do **not** weaken the schema to make a failing run pass.
3. If a regression input itself is broken (typo, unrealistic), fix the input and
   note it in `docs/knowledge/shared-observations.md`.
4. If a provider is consistently below 9/10 after two iterations, switch the
   default provider per ADR-0001 (Gemini ↔ Claude) and capture the swap as a
   change-log entry.
