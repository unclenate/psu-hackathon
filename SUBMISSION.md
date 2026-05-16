# Kinetic — PSU Hackathon Submission

**Tagline:** Drop the chaos. Keep the proof.

**One-liner:** An AI capture app that turns messy daily work artifacts (a
screenshot, a frustrated voice memo, a one-line note about what just shipped)
into both an organized admin task *and* a polished, shareable Proof-of-Skill
card — without the user ever writing a resume.

---

## The 30-second demo

1. Open `http://localhost:5173/`
2. Tap **"Use sample input"** (or paste your own chaotic capture)
3. Tap **"Process →"** — Kinetic splits it into a Proof card + admin task
4. Tap **"Generate share link"** — a public, no-login URL is created
5. Open the URL anywhere — the Proof card renders on a clean landing page

Live screenshots: [`docs/screenshots/`](docs/screenshots/)

---

## What's in the repo

| Layer | Where |
|-------|-------|
| **Concept & governance** | [`docs/`](docs/) — problem, personas, requirements, MVP scope, milestones, change log, ADRs, shared observations |
| **LLM contract** | [`schemas/kinetic-output.schema.json`](schemas/kinetic-output.schema.json) + [`prompts/capture-to-output.md`](prompts/capture-to-output.md) |
| **Regression harness** | [`src/`](src/) + [`tests/`](tests/) — zero-dependency Node ESM |
| **Demo web app** | [`web/`](web/) — single Node HTTP server, no npm install required |
| **Governance platform** | [`.harness/`](.harness/) — submodule of [auto-harness](https://github.com/unclenate/auto-harness) |

---

## Run it locally

Requires Node 18+. **No `npm install`. No API keys required.**

```bash
node src/validate.mjs --selftest    # validator green
node src/regression.mjs             # mock LLM regression: 10/10 schema-valid

node web/server.mjs                 # demo server on :5173
# open http://localhost:5173/
```

Run with a real LLM (Claude is the venue-safe pick — the venue's shared-IP NAT
makes Gemini's free tier rate-limit):

```bash
cp .env.example .env.local          # paste GEMINI_API_KEY and/or ANTHROPIC_API_KEY
set -a; . ./.env.local; set +a
KINETIC_PROVIDER=claude node web/server.mjs
```

---

## Measured M1 results (the LLM contract)

| Provider | Schema-valid | Category match |
|----------|--------------|----------------|
| `mock`   | 10/10        | 10/10          |
| `claude` (`claude-sonnet-4-5`) | **10/10** | **10/10** |
| `gemini` (`gemini-2.5-flash`)  | 8/10 (rate-limited at venue) | 8/10 |

Full context: [`docs/knowledge/shared-observations.md`](docs/knowledge/shared-observations.md).

---

## Why this is the killer angle

1. **Solves documentation fatigue.** Moves the friction from "sit down and
   write an essay" to "drop a screenshot and a one-liner."
2. **Two outputs per input.** Admin task (utility) + Proof card (career
   collateral) — every capture gives both immediate productivity and durable
   career evidence.
3. **Viral by construction.** Every shared Proof card is a public,
   high-trust landing page. The share itself is the marketing surface.
4. **Anti-fabrication discipline.** Schema + prompt rules force the LLM to
   return `null` for time-to-resolution or impact when the input doesn't
   support them. Demoed via the `reg-10-low-signal` canary: "stuff today
   was hard" → an honest, non-padded Proof card.

---

## Milestone ladder

| ID | Milestone | Status |
|----|-----------|--------|
| M0 | Discovery distilled | ✅ |
| M1 | LLM contract working | ✅ (mock 10/10, Claude 10/10) |
| M2 | End-to-end capture path | ✅ |
| M3 | Public share link | ✅ |
| M4 | Demo dry-run passed | In progress |
| M5 | Hackathon submission | This file |

Full detail: [`docs/project/milestones.md`](docs/project/milestones.md).

---

## Signal harvesters (no typing required)

Kinetic isn't only typed captures. The same LLM contract runs against any
source that emits a `{ text, image_caption }` shape. v0 ships two:

- **GitHub** (live, no auth) — `POST /api/harvest/github`
  → pulls a user's public events (pushes, PRs, reviews, issues, branch
  creates) and ghostwrites a Proof card for each. Tested live against
  `torvalds` from the venue.
  See [`docs/screenshots/05-harvest-github.png`](docs/screenshots/05-harvest-github.png).
- **Calendar** (text seam, OAuth-free) — `POST /api/harvest/calendar`
  → paste one event per line (with optional `[ISO]` timestamp prefix).
  See [`docs/screenshots/06-harvest-calendar.png`](docs/screenshots/06-harvest-calendar.png).

Google Calendar and Microsoft Outlook (Graph) are the next harvesters to plug
into this interface — the OAuth flow is the only missing piece. Rationale in
[`docs/knowledge/shared-observations.md`](docs/knowledge/shared-observations.md).

---

## What's next (post-hackathon)

- **Google Calendar harvester** (OAuth) into the existing `src/harvesters/` contract.
- **Microsoft Graph (Outlook) harvester** (OAuth) — same contract.
- **Slack export harvester** (read activity from `slack_export.json`).
- Migrate from `new-product-discovery` composition to
  `node-web-saas-postgres` + a Supabase domain module (ADR-0001's P3 plan).
- Wire Supabase Auth + Postgres for real persistence (currently in-memory).
- Voice memo capture + transcription (Should-tier from
  [`requirements.md`](docs/product/requirements.md)).
- Real image upload + caption auto-generation from screenshots.
- TypeScript migration of `src/` + `web/` (captured in
  [`docs/knowledge/shared-observations.md`](docs/knowledge/shared-observations.md)).
