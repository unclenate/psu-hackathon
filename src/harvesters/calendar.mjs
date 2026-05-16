// src/harvesters/calendar.mjs
// Harvest captures from calendar-shaped text input.
//
// v0 contract: a single textarea where each line is one event. Optional
// inline metadata is supported in either of these forms:
//   "Meeting title — 30m with Vellum team"
//   "[2026-05-16T15:00] 1:1 with Priya — async patterns review"
//
// This is deliberately permissive. Production will plug Google Calendar /
// Outlook Graph harvesters into the same `{ harvest }` contract; the OAuth
// dance is out of scope for the hackathon window (see ADR-0001 follow-up).

/**
 * @param {{ text: string, max?: number }} opts
 * @returns {Promise<Array<{ source_id: string, text: string, image_caption: string, occurred_at: string|null }>>}
 */
export async function harvest({ text, max = 10 }) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("calendar harvester: `text` is required");
  }
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  const items = [];
  for (let i = 0; i < lines.length && items.length < max; i++) {
    const raw = lines[i];
    const { isoAt, body } = extractTimestamp(raw);
    items.push({
      source_id: `cal-line-${i}`,
      text: `Calendar entry: ${body}`,
      image_caption: "",
      occurred_at: isoAt,
    });
  }
  return items;
}

function extractTimestamp(raw) {
  // [2026-05-16T15:00] body
  const bracketed = raw.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (bracketed) {
    const ts = Date.parse(bracketed[1]);
    return {
      isoAt: Number.isNaN(ts) ? null : new Date(ts).toISOString(),
      body: bracketed[2].trim() || raw,
    };
  }
  return { isoAt: null, body: raw };
}
