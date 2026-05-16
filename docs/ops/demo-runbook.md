# Demo Runbook — Kinetic v0

**Owner:** @unclenate
**Last updated:** 2026-05-16
**Audience:** Hackathon presenter (single operator)

The demo's job is to show one capture → one Proof card + admin task → one
public share link, ideally in under 30 seconds. This runbook is the
fall-everything-else-back-on-it script.

---

## Preflight (do these once before the first demo)

```bash
cd /Users/unclenate/psu-hackathon
git log -1 --oneline                      # confirm you're on the right commit
node src/validate.mjs --selftest          # validator green
node src/regression.mjs                   # mock regression 10/10
```

Then start the server. Two ways:

```bash
# Path A — venue-safe (no LLM dependency on shared NAT)
PORT=5173 node web/server.mjs

# Path B — real LLM via Claude (recommended if venue Wi-Fi cooperates)
set -a; . ./.env.local; set +a
KINETIC_PROVIDER=claude PORT=5173 node web/server.mjs
```

Confirm:
- `curl http://localhost:5173/health` returns `{"ok":true,...}`
- Browser at `http://localhost:5173/` shows the capture screen
- The header pill in the top right shows the active provider

---

## The 30-second demo script

1. Open `http://localhost:5173/` on the demo device.
2. Tap **"Use sample input"** (or paste a chaotic note + an image caption a
   judge has handed you).
3. Tap **"Process →"**.
4. Within ~1s (mock) or ~5s (Claude), the Proof card and admin task render.
5. Tap **"Generate share link"** → the public URL is copied to clipboard.
6. Open that URL in a fresh browser window (or hand the link to the judge's
   phone). The public Proof card renders without any login.

That's the whole loop.

---

## What to say (talking-track skeleton)

- **Setup (5s):** "Maya is a senior engineer. She just spent three hours
  fixing a webhook. The work happened. The proof is about to get lost."
- **Capture (5s):** Drop the messy input. "This is what you'd actually type
  on your phone in the moment."
- **Magic (5s):** Hit Process. "Kinetic splits this into two outputs: an
  admin task on the left, a polished Proof-of-Skill card on the right. AI
  ghostwrites the card in her voice; it doesn't invent technologies that
  weren't there."
- **Share (10s):** Generate share link. Open it on a second device. "Every
  shared Proof card is a public, no-login landing page — that's the growth
  flywheel: every link Maya sends a manager or recruiter is a high-trust
  introduction to Kinetic for the recipient."
- **Close (5s):** "M1 was the LLM contract. M2/M3 is the demo you just saw.
  Claude scored 10/10 on our regression set. Repo's open; full governance
  artifacts under `docs/`."

---

## Fallbacks (in order of severity)

| Failure | Fall back to |
|---------|--------------|
| Real LLM rate-limited at venue (shared IP) | Restart with `KINETIC_PROVIDER=mock` — deterministic, instant |
| LLM returns schema-invalid output | Server returns 502 with errors; refresh and use the sample input |
| Server hangs | `pkill -f "web/server.mjs"`, restart |
| Clipboard API blocked by browser | URL is still rendered in the share box; copy manually |
| Conference Wi-Fi dies entirely | Everything is local; `http://localhost:5173` keeps working |

---

## Known limitations (v0, by design)

- Single-user (no auth) — every capture lands in the same in-memory store.
- In-memory store — restarting the server loses all cards. This is fine for
  demo; Supabase wiring is a P3 item.
- No real image upload — image is described via the caption field. Camera /
  voice are Should-tier per [`requirements.md`](../product/requirements.md).
- No edit-after-generate — regenerate is the only correction path, and it's
  Should-tier for v1, not present in v0.

---

## Screenshots (for submission)

Pre-captured artifacts of the live demo for the submission package:

| Screenshot | What it shows |
|------------|---------------|
| [`01-capture-empty.png`](../screenshots/01-capture-empty.png) | The capture screen, empty |
| [`02-capture-processed.png`](../screenshots/02-capture-processed.png) | After processing the webhook sample input — Proof card + admin task rendered |
| [`03-shared.png`](../screenshots/03-shared.png) | After generating the public share link |
| [`04-public-proof.png`](../screenshots/04-public-proof.png) | The public Proof page loaded on a fresh tab (no auth) |
