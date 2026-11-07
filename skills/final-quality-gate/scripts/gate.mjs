#!/usr/bin/env node
// Release gate structural check. No dependencies. Node.js >= 18.
//
// Run from the repository root:
//   node skills/final-quality-gate/scripts/gate.mjs --docs ./docs --out docs/quality-gate.json
//
// Verifies that every required stage output exists, is non-trivial, and has no
// unresolved markers. It does not judge quality: it produces the structure for
// the human/agent review. Exit 1 if any required output fails.

import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";

const args = process.argv.slice(2);
const get = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node skills/final-quality-gate/scripts/gate.mjs --docs ./docs [--out docs/quality-gate.json]

Checks that every required stage output exists, is non-trivial, and has no
unresolved markers. Honours optional outputs for static project types when
progress.md records the project type. Writes JSON with structuralVerdict and
releaseVerdict (null until the manual checklist is walked). Exit 1 if the
structure fails, 2 if the report cannot be written.
Requires Node.js >= 18. Run from the repository root.`);
  process.exit(0);
}

const docsArg = get("--docs", "./docs");
const outArg = get("--out", join(docsArg, "quality-gate.json"));
const docsDir = resolve(docsArg);
// optionalFor: project-type keywords that allow the file to be skipped.
const required = [
  ["brief.md", "Stage 0 intake"],
  ["plan.md", "Stage 1 planning"],
  ["progress.md", "orchestrator"],
  ["ia.md", "Stage 2 information architecture"],
  ["design.md", "Stage 3 UI/UX"],
  ["data-model.md", "Stage 5 backend", ["static", "portfolio", "blog", "brochure"]],
  ["seo-report.md", "Stage 6 SEO"],
  ["performance-report.md", "Stage 7 performance"],
  ["security-report.md", "Stage 8 security"],
  ["legal-review.md", "Stage 9 legal"],
  ["test-report.md", "Stage 10 testing"],
  ["deployment.md", "Stage 11 deployment"],
  ["monitoring.md", "Stage 12 monitoring"],
];

const unresolvedMarkers = [
  { re: /(?<![A-Za-z0-9])TBD(?![A-Za-z0-9])/i, label: "TBD" },
  { re: /TODO:/, label: "TODO:" },
  { re: /PLACEHOLDER/i, label: "PLACEHOLDER" },
  { re: /lorem ipsum/i, label: "lorem ipsum" },
  { re: /FIXME/, label: "FIXME" },
  { re: /XXX:/, label: "XXX:" },
];

let projectType = "";
try {
  const progress = await readFile(join(docsDir, "progress.md"), "utf8");
  const m = progress.match(/project type\s*[:|]\s*([^\n|]+)/i);
  if (m) projectType = m[1].trim().toLowerCase();
} catch { /* handled by the required loop */ }

const report = {
  generatedAt: new Date().toISOString(),
  docs: docsDir,
  projectType: projectType || null,
  required: [],
  skipped: [],
  missing: [],
  unresolved: [],
  structuralVerdict: "PASS",
  releaseVerdict: null,
};

for (const [file, stage, optionalFor] of required) {
  const entry = { file, stage, optionalFor: optionalFor || null, exists: false, bytes: 0, lines: 0, proseChars: 0, findings: [] };
  const path = join(docsDir, file);
  try {
    const s = await stat(path);
    entry.exists = s.isFile();
    if (entry.exists) {
      const text = await readFile(path, "utf8");
      entry.bytes = Buffer.byteLength(text);
      entry.lines = text.split("\n").length;
      const prose = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !/^#{1,6}\s/.test(l) && !/^[-*+]\s*$/.test(l) && !/^\|?[-:\s|]+\|?$/.test(l))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      entry.proseChars = prose.length;
      if (prose.length < 40) {
        entry.findings.push(`no substantive content (${prose.length} chars outside headings; a short complete report is fine at 40+)`);
      }
      for (const { re, label } of unresolvedMarkers) {
        const line = text.split("\n").findIndex((l) => re.test(l)) + 1;
        if (line > 0) entry.findings.push(`unresolved marker "${label}" at line ${line}`);
      }
    } else {
      entry.findings.push("path is not a file");
    }
  } catch {
    entry.findings.push("missing");
  }

  report.required.push(entry);
  if (entry.exists) {
    for (const f of entry.findings) report.unresolved.push({ file, detail: f });
    continue;
  }

  if (optionalFor && projectType && optionalFor.some((k) => projectType.includes(k))) {
    entry.findings = [];
    report.skipped.push({ file, reason: `optional for project type "${projectType}"` });
    continue;
  }
  report.missing.push(file);
  for (const f of entry.findings) report.unresolved.push({ file, detail: f });
}

// The gate must not report PASS for a missing manifest.
try {
  const progress = await readFile(join(docsDir, "progress.md"), "utf8");
  const blocks = progress.match(/status:\s*(blocked|blocked-manual|fail)/gi) || [];
  if (blocks.length) report.unresolved.push({ file: "progress.md", detail: `${blocks.length} blocked/failed stage markers` });
  const notDone = progress.match(/-\s*\[ \]/g) || [];
  if (notDone.length) report.unresolved.push({ file: "progress.md", detail: `${notDone.length} unchecked items` });
} catch { /* already reported as missing */ }

if (report.missing.length || report.unresolved.length) report.structuralVerdict = "FAIL";

const json = JSON.stringify(report, null, 2);
try {
  await mkdir(dirname(resolve(outArg)), { recursive: true });
  await writeFile(outArg, json, "utf8");
} catch (e) {
  console.error(`Cannot write ${outArg}: ${e.message}`);
  process.exit(2);
}

console.log(`Required: ${report.required.length} | missing: ${report.missing.length} | skipped: ${report.skipped.length} | findings: ${report.unresolved.length}`);
console.log(`Structural verdict: ${report.structuralVerdict} (releaseVerdict stays null until the manual checklist is walked)`);
console.log(`Report: ${outArg}`);
if (report.structuralVerdict === "FAIL") {
  for (const m of report.missing) console.log(`  missing: ${m}`);
  for (const u of report.unresolved.slice(0, 20)) console.log(`  ${u.file}: ${u.detail}`);
  console.log("Structural FAIL. Fix the files above, then run the manual checklist in checklist.md.");
  process.exit(1);
}
console.log("Structure complete. Now run checklist.md item by item; structure alone is not a release PASS.");
