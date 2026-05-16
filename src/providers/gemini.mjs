// src/providers/gemini.mjs
// Gemini provider for Kinetic. Uses the official Gemini REST API with
// structured-output mode (response_schema). Zero npm deps; uses global fetch.
//
// Requires: GEMINI_API_KEY environment variable.
// Optional: GEMINI_MODEL (defaults to gemini-2.5-flash).
//
// The schema is enforced TWICE: once by Gemini (response_schema) and once by
// our local validator after the response is received. Belt and suspenders.

import { readFile } from "node:fs/promises";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

async function loadPrompt() {
  const url = new URL("../../prompts/capture-to-output.md", import.meta.url);
  return readFile(url, "utf8");
}

async function loadSchema() {
  const url = new URL("../../schemas/kinetic-output.schema.json", import.meta.url);
  return JSON.parse(await readFile(url, "utf8"));
}

/**
 * Strip JSON-Schema-only keywords that Gemini's response_schema does not accept,
 * yielding a Gemini-compatible schema object. This is a narrow conversion that
 * preserves type, properties, required, items, enum, minimum, maximum, and
 * description.
 */
function toGeminiSchema(schema) {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (!schema || typeof schema !== "object") return schema;

  // Gemini does not accept type: ["integer", "null"] — collapse to nullable.
  let type = schema.type;
  let nullable = false;
  if (Array.isArray(type)) {
    nullable = type.includes("null");
    type = type.find((t) => t !== "null");
  }

  const out = {};
  if (type) out.type = type.toUpperCase ? type.toUpperCase() : type;
  if (nullable) out.nullable = true;

  // Allowlist of keywords Gemini supports.
  const allowed = ["properties", "required", "items", "enum", "minimum", "maximum", "description"];
  for (const k of allowed) {
    if (schema[k] !== undefined) out[k] = k === "properties" || k === "items"
      ? toGeminiSchemaRecurse(schema[k])
      : schema[k];
  }
  return out;
}

function toGeminiSchemaRecurse(node) {
  if (Array.isArray(node)) return node.map(toGeminiSchema);
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = (v && typeof v === "object") ? toGeminiSchema(v) : v;
    }
    return out;
  }
  return node;
}

/**
 * @param {{ text: string, image_caption?: string }} input
 * @returns {Promise<{ admin_tasks: any[], proof_card: any }>}
 */
export async function process(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set. Run with KINETIC_PROVIDER=mock or set the key.");
  }
  const promptTemplate = await loadPrompt();
  const schema = await loadSchema();
  const geminiSchema = toGeminiSchema(schema);

  const filled = promptTemplate
    .replace("{{SCHEMA_INLINE}}", JSON.stringify(schema, null, 2))
    .replace("{{TEXT}}", input.text || "")
    .replace("{{IMAGE_CAPTION}}", input.image_caption || "");

  const body = {
    contents: [{ role: "user", parts: [{ text: filled }] }],
    generationConfig: {
      response_mime_type: "application/json",
      response_schema: geminiSchema,
      temperature: 0.2,
    },
  };

  const url = `${API_BASE}/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 500)}`);
  }
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no text part");
  return JSON.parse(text);
}
