#!/usr/bin/env node
// Release gate structural check. No dependencies. Node.js >= 18.
//
// Run from anywhere, pointing at the skill folder and the project docs:
//   node <skill-folder>/scripts/gate.mjs --docs <project>/docs --out <project>/docs/quality-gate.json
//
// Verifies that every required stage output exists, is non-trivial, and has no
// unresolved markers. It does not judge quality: it produces the structure for
// the human/agent review. Exit 1 if any required output fails, 2 on bad
// arguments or an unwritable report, 3 when structure passes but the release
// verdict is still pending (see --help).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";

const args = process.argv.slice(2);
// get returns undefined when the flag is absent, and exits 2 when the flag has
// no value or the next argv entry is another flag.
const get = (name) => {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const value = args[i + 1];
  if (value === undefined || value.startsWith("-")) {
    console.error(`${name} needs a path`);
    process.exit(2);
  }
  return value;
};

// Arguments are validated before --help, so a flag that swallowed the next flag
// still fails loudly instead of printing usage and exiting 0.
const docsArg = get("--docs") ?? "./docs";
const outArg = get("--out") ?? join(docsArg, "quality-gate.json");

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node <skill-folder>/scripts/gate.mjs --docs <project>/docs [--out <project>/docs/quality-gate.json]

Run this from any working directory; pass the project's docs directory, not a
path relative to the skill. On a default install the skill folder is
.agents/skills/final-quality-gate.

Checks that every required stage output exists, is non-trivial, and has no
unresolved markers. Honours optional outputs for static project types when
progress.md records the project type. Writes JSON with structuralVerdict and
releaseVerdict (null until the manual checklist is walked).
Exit codes:
  0  structure passed and a release verdict is recorded
  1  structural FAIL (missing, unreadable, or unresolved output)
  2  bad arguments, or the report cannot be written
  3  structural PASS, release verdict still pending (walk checklist.md)
Requires Node.js >= 18.`);
  process.exit(0);
}

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
  { re: /TODO:/i, label: "TODO:" },
  { re: /PLACEHOLDER/i, label: "PLACEHOLDER" },
  { re: /lorem ipsum/i, label: "lorem ipsum" },
  { re: /FIXME/i, label: "FIXME" },
  { re: /XXX:/i, label: "XXX:" },
];

// Lines inside fenced code blocks are documentation, not unresolved work.
// Return [{ line, text }] for every line outside a ``` / ~~~ fence.
const linesOutsideFences = (text) => {
  const kept = [];
  let fence = null;
  text.split("\n").forEach((line, index) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) {
        fence = marker[1][0];
      } else if (marker[1][0] === fence) {
        fence = null;
      }
      return;
    }
    if (!fence) kept.push({ line: index + 1, text: line });
  });
  return kept;
};

// Exact-token match: progress.md records a project type as a value such as
// "static" or "blog". Split on separators, then compare each whole token to a
// keyword. Substring identity is not a match: "weblog" is not "blog", and
// "Next.js static export" / "static assets" are composite descriptions, not the
// plain "static" type, so they do not silently drop data-model.md.
const projectTypeTokens = (value) =>
  value
    .split(/[,;|]/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

const matchesProjectType = (value, keywords) => {
  const tokens = projectTypeTokens(value);
  return keywords.some((keyword) => tokens.includes(keyword.toLowerCase()));
};

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
  let text = null;
  let readError = null;
  try {
    text = await readFile(path, "utf8");
  } catch (e) {
    readError = e;
  }

  entry.exists = text !== null;
  if (entry.exists) {
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
      for (const { line, text: lineText } of linesOutsideFences(text)) {
        if (re.test(lineText)) entry.findings.push(`unresolved marker "${label}" at line ${line}`);
      }
    }
  } else if (readError && readError.code === "ENOENT") {
    entry.findings.push("missing");
  } else {
    entry.findings.push(`unreadable (${(readError && (readError.code || readError.message)) || "unknown error"})`);
  }

  report.required.push(entry);

  if (entry.exists) {
    for (const f of entry.findings) report.unresolved.push({ file, detail: f });
    continue;
  }

  const isMissing = entry.findings.length === 1 && entry.findings[0] === "missing";
  if (isMissing && optionalFor && projectType && matchesProjectType(projectType, optionalFor)) {
    entry.findings = [];
    report.skipped.push({ file, reason: `optional for project type "${projectType}"` });
    continue;
  }
  if (isMissing) {
    // Counted once, in missing. An unreadable file is a separate finding.
    report.missing.push(file);
    continue;
  }
  for (const f of entry.findings) report.unresolved.push({ file, detail: f });
}

// The gate must not report PASS for a missing manifest.
try {
  const progress = await readFile(join(docsDir, "progress.md"), "utf8");
  const failing = new Set(["blocked", "blocked-manual", "fail", "failed"]);
  const badStatuses = [];
  for (const line of progress.split("\n")) {
    const m = line.match(/^\s*(?:[-*+]\s*)?status\s*:\s*([^\s|#]+)/i);
    if (m && failing.has(m[1].toLowerCase())) badStatuses.push(m[1]);
  }
  if (badStatuses.length) report.unresolved.push({ file: "progress.md", detail: `${badStatuses.length} blocked/failed stage markers` });
  const notDone = progress.match(/^\s*(?:[-*+]|\d+\.)\s*\[ \]/gm) || [];
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
for (const s of report.skipped) console.log(`  skipped: ${s.file} (${s.reason})`);
console.log(`Structural verdict: ${report.structuralVerdict} (releaseVerdict stays null until the manual checklist is walked)`);
console.log(`Report: ${outArg}`);
if (report.structuralVerdict === "FAIL") {
  for (const m of report.missing) console.log(`  missing: ${m}`);
  for (const u of report.unresolved.slice(0, 20)) console.log(`  ${u.file}: ${u.detail}`);
  console.log("Structural FAIL. Fix the files above, then run the manual checklist in checklist.md.");
  process.exit(1);
}
console.log("Structure complete. Now run checklist.md item by item; structure alone is not a release PASS.");
// Structural PASS is not a release PASS. Exit 3 so CI cannot read it as one.
process.exit(3);
