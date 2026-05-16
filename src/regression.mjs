// src/regression.mjs
// Run the M1 regression set against the selected provider and measure schema
// validity. The M1 milestone exits when ≥9 of 10 inputs produce a schema-valid
// output for the chosen provider.
//
// Usage:
//   node src/regression.mjs                         # mock provider (default)
//   KINETIC_PROVIDER=gemini node src/regression.mjs
//   KINETIC_PROVIDER=claude node src/regression.mjs

import { readFile } from "node:fs/promises";
import { validate, loadKineticSchema } from "./validate.mjs";

const providerName = process.env.KINETIC_PROVIDER || "mock";

async function loadProvider(name) {
  switch (name) {
    case "mock":   return import("./providers/mock.mjs");
    case "gemini": return import("./providers/gemini.mjs");
    case "claude": return import("./providers/claude.mjs");
    default:
      throw new Error(`Unknown provider: ${name}. Use mock | gemini | claude.`);
  }
}

async function loadRegressionInputs() {
  const url = new URL("../tests/regression-inputs.jsonl", import.meta.url);
  const text = await readFile(url, "utf8");
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function fmtPct(n, d) {
  return `${n}/${d} (${((n / d) * 100).toFixed(1)}%)`;
}

async function main() {
  const provider = await loadProvider(providerName);
  const schema = await loadKineticSchema();
  const inputs = await loadRegressionInputs();

  console.log(`\nKinetic — M1 regression`);
  console.log(`Provider: ${providerName}`);
  console.log(`Inputs:   ${inputs.length}`);
  console.log(`Schema:   schemas/kinetic-output.schema.json`);
  console.log("");

  const results = [];
  for (const input of inputs) {
    const t0 = Date.now();
    let output, err;
    try {
      output = await provider.process(input);
    } catch (e) {
      err = e;
    }
    const elapsed = Date.now() - t0;
    const v = output ? validate(output, schema) : { valid: false, errors: [String(err?.message || err)] };
    const categoryActual = output?.proof_card?.category;
    const categoryExpected = input.expected_category;
    const categoryHit = categoryActual === categoryExpected;
    results.push({ id: input.id, valid: v.valid, errors: v.errors, elapsed, categoryActual, categoryExpected, categoryHit });

    const status = v.valid ? "✓ valid  " : "✗ INVALID";
    const catHint = categoryActual
      ? ` cat=${categoryActual}${categoryHit ? "" : ` (expected ${categoryExpected})`}`
      : "";
    console.log(`${status}  ${input.id.padEnd(22)} ${String(elapsed).padStart(5)}ms${catHint}`);
    if (!v.valid) {
      for (const e of v.errors.slice(0, 5)) console.log(`           - ${e}`);
    }
  }

  const validCount = results.filter((r) => r.valid).length;
  const catHitCount = results.filter((r) => r.categoryHit).length;

  console.log("");
  console.log(`Schema-valid:     ${fmtPct(validCount, results.length)}`);
  console.log(`Category match:   ${fmtPct(catHitCount, results.length)}  (informational — not a gate)`);
  console.log(`M1 exit target:   ≥9 of 10 schema-valid`);
  console.log("");

  if (validCount >= 9) {
    console.log(`✓ M1 exit criterion MET for provider "${providerName}"`);
    process.exit(0);
  } else {
    console.log(`✗ M1 exit criterion NOT met for provider "${providerName}"`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("regression failed:", e);
  process.exit(2);
});
