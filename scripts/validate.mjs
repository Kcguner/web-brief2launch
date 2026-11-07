#!/usr/bin/env node
// Repository validator. No dependencies. Node.js >= 18.
//
// Usage (from the repository root):
//   node scripts/validate.mjs
//   node scripts/validate.mjs --help
//   node scripts/validate.mjs --verbose
//
// Checks skill structure, frontmatter, sections, relative links, product-name
// leakage, dependency skill names, script health, script risk surface, and the
// license. Exit 0 when every check passes.

import { readFile, readdir, stat, mkdir, writeFile, mkdtemp, rm } from "node:fs/promises";
import { join, resolve, dirname, relative, extname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";

const run = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const verbose = process.argv.includes("--verbose");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`Usage: node scripts/validate.mjs [--verbose]

Checks:
  1 line count (<= 200) for every skills/*/SKILL.md
  2 frontmatter: name = folder, description starts with "Use when"
  3 required sections: Purpose, Inputs, Steps, Checklist,
    Completion criteria, Output, On failure
  4 relative links in SKILL.md files and README resolve to real files
  5 product-specific terms in skills/ (README and AGENTS.md reported apart)
  6 external dependency skill names match the verified upstream list
  7 every .mjs script passes --check and --help, and the audit + gate
    scripts run against a generated mini site
  8 network, file-deletion, and secret access surface of the scripts
  9 LICENSE present

Exit code 0 = all checks pass, 1 = at least one failure.
Requires Node.js >= 18. Run from the repository root.`);
  process.exit(0);
}

const LOCAL_SKILLS = ["website-master", "website-intake", "seo", "legal-compliance", "monitoring-maintenance", "final-quality-gate"];

// Names read from the upstream repositories' file trees on 2026-11-07.
const VERIFIED = {
  "obra/superpowers": [
    "brainstorming", "diagnosing-superpowers", "dispatching-parallel-agents", "executing-plans",
    "finishing-a-development-branch", "receiving-code-review", "requesting-code-review",
    "subagent-driven-development", "systematic-debugging", "test-driven-development",
    "using-git-worktrees", "using-superpowers", "verification-before-completion",
    "writing-plans", "writing-skills",
  ],
  "addyosmani/agent-skills": [
    "api-and-interface-design", "browser-testing-with-devtools", "ci-cd-and-automation",
    "code-review-and-quality", "code-simplification", "constraint-driven-development",
    "context-engineering", "debugging-and-error-recovery", "deprecation-and-migration",
    "documentation-and-adrs", "doubt-driven-development", "frontend-ui-engineering",
    "git-workflow-and-versioning", "idea-refine", "incremental-implementation", "interview-me",
    "observability-and-instrumentation", "performance-optimization", "planning-and-task-breakdown",
    "security-and-hardening", "shipping-and-launch", "source-driven-development",
    "spec-driven-development", "test-driven-development", "using-agent-skills",
  ],
  // Folder name read from the upstream tree on 2026-11-08.
  "pbakaus/impeccable": ["impeccable"],
};
const VERIFIED_ALL = new Set(Object.values(VERIFIED).flat());

// Backticked kebab tokens in skill text that are not skill names.
const NON_SKILL_TERMS = new Set([
  "accepted-risk", "blocked-manual", "manual-required", "noindex",
  "font-display", "prefers-reduced-motion", "x-default", "hreflang",
  "noindex", "summary_large_image", "server-side",
]);

const PRODUCT_TERMS = [
  /\bclaude\b/i, /\bcursor\b/i, /\bcopilot\b/i, /\bcodex\b/i, /\bwindsurf\b/i,
  /\bgemini\b/i, /\bmcp\b/i, /slash command/i, /skill:run/i, /\bcomposer\b/i,
];

const results = [];
const details = [];
function record(id, title, ok, detail, level = null) {
  const status = ok ? "PASS" : (level || "FAIL");
  results.push({ id, title, status, detail });
  if (!ok && detail) details.push(`${id}. ${title}: ${detail}`);
}

async function walk(dir, filter) {
  const out = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p, filter));
    else if (!filter || filter(p)) out.push(p);
  }
  return out;
}

const read = async (p) => readFile(p, "utf8").catch(() => null);

// ---------------------------------------------------------------- 1, 2, 3
const skillDirs = (await readdir(join(root, "skills"), { withFileTypes: true }))
  .filter((e) => e.isDirectory()).map((e) => e.name).sort();

const longFiles = [];
const fmProblems = [];
const sectionProblems = [];
const firstRunProblems = [];
const REQUIRED_SECTIONS = ["Purpose", "Inputs", "Steps", "Checklist", "Completion criteria", "Output", "On failure"];

for (const dir of skillDirs) {
  const file = join(root, "skills", dir, "SKILL.md");
  const text = await read(file);
  if (!text) { fmProblems.push(`${dir}: SKILL.md missing`); continue; }
  const lines = text.split("\n").length;
  if (lines > 200) longFiles.push(`${dir} (${lines})`);

  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!fm) { fmProblems.push(`${dir}: no frontmatter block`); continue; }
  const body = fm[1];
  const keys = [...body.matchAll(/^([A-Za-z0-9_-]+):/gm)].map((m) => m[1]);
  const extra = keys.filter((k) => k !== "name" && k !== "description");
  const name = (body.match(/^name:\s*(.+)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");
  const desc = (body.match(/^description:\s*(.+)$/m) || [])[1]?.trim();
  if (extra.length) fmProblems.push(`${dir}: extra frontmatter keys ${extra.join(", ")}`);
  if (name !== dir) fmProblems.push(`${dir}: name "${name}" != folder`);
  if (!desc) fmProblems.push(`${dir}: description missing`);
  else if (!/^use when\b/i.test(desc)) fmProblems.push(`${dir}: description does not start with "Use when"`);
  else if (desc.length > 1024) fmProblems.push(`${dir}: description too long (${desc.length} > 1024)`);

  const missing = REQUIRED_SECTIONS.filter((s) => !new RegExp(`^##\\s+${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "mi").test(text));
  if (missing.length) sectionProblems.push(`${dir}: missing ${missing.join(", ")}`);
}

const wmText = await read(join(root, "skills", "website-master", "SKILL.md"));
if (!wmText || !/^##\s+First run\s*$/mi.test(wmText)) firstRunProblems.push("website-master: missing 'First run' section");

record(1, "SKILL.md <= 200 lines", longFiles.length === 0, longFiles.join("; ") || `${skillDirs.length} files checked`, "FAIL");
record(2, "frontmatter valid, name = folder, description starts with \"Use when\"", fmProblems.length === 0, fmProblems.join("; ") || `${skillDirs.length} files checked`);
record(3, "required sections present", sectionProblems.length === 0, sectionProblems.join("; ") || `${REQUIRED_SECTIONS.length} sections x ${skillDirs.length} files`);
record(10, "website-master has a 'First run' section", firstRunProblems.length === 0, firstRunProblems.join("; ") || "present");

// ---------------------------------------------------------------- 4 links
const linkProblems = [];
const skippedOutputs = [];
const mdFiles = (await walk(join(root, "skills"), (p) => p.endsWith(".md"))).concat([join(root, "README.md"), join(root, "AGENTS.md")]);
const exists = async (p) => { try { const s = await stat(p); return s.isFile() || s.isDirectory(); } catch { return false; } };

for (const file of mdFiles) {
  const text = await read(file);
  if (!text) continue;
  const base = dirname(file);
  const relFile = relative(root, file);
  const candidates = new Set();
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) candidates.add(m[1]);
  for (const m of text.matchAll(/`([^`\n]+)`/g)) {
    const t = m[1].trim();
    if (/^(\.\.?\/|skills\/|scripts\/|AGENTS\.md$|README\.md$)/.test(t)) candidates.add(t);
  }
  for (const rawTarget of candidates) {
    let target = rawTarget.split("#")[0].trim();
    if (!target || /^(https?:|mailto:|#)/.test(target)) continue;
    if (/[<>*{}]/.test(target)) continue;
    target = target.replace(/[.,;:)]+$/, "");
    if (/^docs\//.test(target) || /(^|\/)docs\//.test(target)) { skippedOutputs.push(`${relFile} -> ${target}`); continue; }
    const full = resolve(base, target);
    if (!(await exists(full))) linkProblems.push(`${relFile}: ${rawTarget}`);
  }
}
record(4, "relative links resolve", linkProblems.length === 0,
  linkProblems.length ? linkProblems.join("; ") : `${mdFiles.length} files, ${skippedOutputs.length} docs/ outputs skipped`);

// ---------------------------------------------------------------- 5 product terms
async function scanTerms(dir, filter) {
  const hits = [];
  for (const file of await walk(dir, filter)) {
    const text = await read(file);
    if (!text) continue;
    text.split("\n").forEach((line, i) => {
      for (const re of PRODUCT_TERMS) if (re.test(line)) hits.push(`${relative(root, file)}:${i + 1}: ${line.trim().slice(0, 90)}`);
    });
  }
  return hits;
}
const skillHits = await scanTerms(join(root, "skills"), (p) => p.endsWith(".md"));
const scriptHits = await scanTerms(join(root, "skills"), (p) => p.endsWith(".mjs"));
const docHits = (await scanTerms(root, (p) => p.endsWith(".md") && !p.includes(`${join("skills")}`)))
  .filter((h) => !h.startsWith("README.md") && !h.startsWith("AGENTS.md"));
record(5, "no product-specific terms under skills/", skillHits.length === 0,
  skillHits.join(" | ") || (scriptHits.length
    ? `clean; ${scriptHits.length} agent-directory mention(s) in skill scripts, expected for the bootstrap`
    : "clean"));
if (skillHits.length) details.push(...skillHits.slice(0, 10).map((h) => `5. term: ${h}`));

// README / AGENTS.md mentions are expected (compatibility table), reported apart.
const readmeText = (await read(join(root, "README.md"))) || "";
const agentsText = (await read(join(root, "AGENTS.md"))) || "";
const allowedMentions = PRODUCT_TERMS.reduce((n, re) => n + ((readmeText.match(new RegExp(re.source, "gi")) || []).length), 0);

// ---------------------------------------------------------------- 6 dependency names
const depProblems = [];
const readmeRows = [...readmeText.matchAll(/^\|\s*`([a-z0-9-]+)`\s*\|\s*([a-z0-9-]+\/[a-z0-9-]+)\s*\|/gm)]
  .map((m) => ({ skill: m[1], repo: m[2] }));

const referenced = new Set();
for (const file of await walk(join(root, "skills"), (p) => p.endsWith(".md"))) {
  const text = await read(file);
  if (!text) continue;
  for (const line of text.split("\n")) {
    for (const m of line.matchAll(/`([a-z][a-z0-9]*(?:-[a-z0-9]+)+)`/g)) {
      const t = m[1];
      if (LOCAL_SKILLS.includes(t) || NON_SKILL_TERMS.has(t)) continue;
      if (VERIFIED_ALL.has(t)) referenced.add(t);
      else if (/^[a-z]+(-[a-z]+){1,4}$/.test(t) && !/\./.test(t)) referenced.add(t);
    }
  }
}
for (const r of referenced) if (!VERIFIED_ALL.has(r)) depProblems.push(`unknown skill name "${r}"`);
for (const row of readmeRows) {
  const list = VERIFIED[row.repo];
  if (!list) depProblems.push(`README: unknown repo ${row.repo}`);
  else if (!list.includes(row.skill)) depProblems.push(`README: ${row.skill} not in ${row.repo}`);
}
for (const name of VERIFIED_ALL) {
  if (!referenced.has(name) && !readmeRows.some((r) => r.skill === name)) { /* unused upstream skill: fine */ }
}
record(6, "dependency skill names match verified upstream lists", depProblems.length === 0,
  depProblems.join("; ") || `${referenced.size} referenced, ${readmeRows.length} table rows`);

// ---------------------------------------------------------------- 7 scripts
const scriptProblems = [];
const scriptFiles = [];
for (const dir of [join(root, "scripts"), ...skillDirs.map((d) => join(root, "skills", d, "scripts"))]) {
  for (const f of await walk(dir, (p) => p.endsWith(".mjs"))) scriptFiles.push(f);
}
for (const f of scriptFiles) {
  const rel = relative(root, f);
  try { await run(process.execPath, ["--check", f]); }
  catch (e) { scriptProblems.push(`${rel}: --check failed: ${(e.stderr || e.message).split("\n")[0]}`); continue; }
  try {
    await run(process.execPath, [f, "--help"], { timeout: 15000 });
  } catch (e) {
    if (e.code === 0 || /Usage:/.test(e.stdout || "")) { /* help printed with non-zero exit */ }
    else scriptProblems.push(`${rel}: --help failed: ${(e.stderr || e.message).split("\n")[0]}`);
  }
}

// Mini site fixture. mkdtemp creates a unique directory we own, so a fixed
// name can never be removed by a concurrent run or by a user's real folder.
const sandboxPrefix = join(tmpdir(), "wmskill-validate-");
let sandbox = null;
let fixtureNote = "";
try {
  sandbox = await mkdtemp(sandboxPrefix);
  await mkdir(join(sandbox, "site"), { recursive: true });
  await mkdir(join(sandbox, "docs"), { recursive: true });
  const page = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fixture page for validation</title>
<meta name="description" content="A fixture page used to validate the audit script end to end.">
<link rel="canonical" href="https://example.com/">
<meta property="og:type" content="website"><meta property="og:title" content="Fixture page">
<meta property="og:description" content="Fixture description.">
<meta property="og:image" content="https://example.com/og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:url" content="https://example.com/">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Fixture page">
<meta name="twitter:description" content="Fixture description."><meta name="twitter:image" content="https://example.com/og.png">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Fixture","url":"https://example.com"}</script>
</head><body>
<h1>Fixture page</h1>
<p>This paragraph exists so the rendered text clears the thin content rule used by the audit script. It repeats a few words to reach the threshold safely and does not need to be meaningful for a structural test.</p>
</body></html>`;
  await writeFile(join(sandbox, "site", "index.html"), page, "utf8");
  await writeFile(join(sandbox, "site", "about.html"),
    page.replace("Fixture page for validation", "About the fixture site").replace('<link rel="canonical" href="https://example.com/">', '<link rel="canonical" href="https://example.com/about">'), "utf8");

  const docs = ["brief", "plan", "ia", "design", "data-model", "seo-report", "performance-report", "security-report", "legal-review", "test-report", "deployment", "monitoring"];
  for (const d of docs) {
    await writeFile(join(sandbox, "docs", `${d}.md`), `# ${d}\n\nMeasured result for this stage, recorded with the command output that produced it.\nThe evidence below was captured on this run and is reproducible from a clean checkout.\n\n- Command: (recorded)\n- Result: pass\n- Evidence: command output stored with the stage\n`, "utf8");
  }
  await writeFile(join(sandbox, "docs", "progress.md"), "# Progress\n\nAll stages complete for the validation fixture.\n\n- [x] Stage 0 intake\n- [x] Stage 1 planning\n\nProject type: corporate\n\nEvidence notes for this fixture progress file, long enough to clear the stub check.\n", "utf8");

  const audit = join(root, "skills", "seo", "scripts", "audit.mjs");
  const gate = join(root, "skills", "final-quality-gate", "scripts", "gate.mjs");
  const auditOut = join(sandbox, "seo.json");
  const gateOut = join(sandbox, "gate.json");
  let auditCode = 0, gateCode = 0, auditSummary = "", gateSummary = "";
  try { const r = await run(process.execPath, [audit, "--dir", join(sandbox, "site"), "--out", auditOut], { timeout: 30000 }); auditSummary = r.stdout.trim().split("\n")[0]; }
  catch (e) { auditCode = e.code ?? 1; auditSummary = (e.stdout || "").trim().split("\n")[0] || (e.stderr || "").split("\n")[0]; }
  try { const r = await run(process.execPath, [gate, "--docs", join(sandbox, "docs"), "--out", gateOut], { timeout: 30000 }); gateSummary = r.stdout.trim().split("\n")[0]; }
  catch (e) { gateCode = e.code ?? 1; gateSummary = (e.stdout || "").trim().split("\n")[0] || (e.stderr || "").split("\n")[0]; }

  if (auditCode !== 0) scriptProblems.push(`audit.mjs on fixture exited ${auditCode}: ${auditSummary}`);
  if (gateCode !== 0) scriptProblems.push(`gate.mjs on fixture exited ${gateCode}: ${gateSummary}`);
  fixtureNote = `audit: ${auditSummary || "no output"} | gate: ${gateSummary || "no output"}`;
} catch (e) {
  scriptProblems.push(`fixture run failed: ${e.message}`);
}
record(7, "scripts pass --check, --help, and run on a fixture", scriptProblems.length === 0,
  scriptProblems.join("; ") || `${scriptFiles.length} scripts; ${fixtureNote}`);

// ---------------------------------------------------------------- 8 risk surface
const risk = [];
const envHits = [];
const secretHits = [];
for (const f of scriptFiles) {
  const rel = relative(root, f);
  if (rel === join("scripts", "validate.mjs")) continue; // self-scan
  const text = await read(f);
  if (!text) continue;
  text.split("\n").forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return;
    if (/\bfetch\s*\(|node:https?:|require\(["']https?["']\)/.test(line)) risk.push(`${rel}:${i + 1}: network — ${t.slice(0, 80)}`);
    if (/\b(rm|rmSync|unlink|unlinkSync|rmdir|fs\.rm)\b/.test(line)) risk.push(`${rel}:${i + 1}: delete — ${t.slice(0, 80)}`);
    if (/process\.env\.[A-Z0-9_]/.test(line)) envHits.push(`${rel}:${i + 1}: env — ${t.slice(0, 80)}`);
    if (/(\.ssh|id_rsa|\.aws\/credentials|\.npmrc)/.test(line)) secretHits.push(`${rel}:${i + 1}: secret-path — ${t.slice(0, 80)}`);
  });
}
record(8, "script risk surface enumerated", secretHits.length === 0,
  `network ${risk.filter((r) => r.includes("network")).length}, delete ${risk.filter((r) => r.includes("delete")).length}, env ${envHits.length}, secret-path ${secretHits.length}`);
if (secretHits.length) details.push(...secretHits.map((h) => `8. secret access: ${h}`));

// ---------------------------------------------------------------- 9 license
const licensePath = join(root, "LICENSE");
let licenseOk = false;
try { licenseOk = (await stat(licensePath)).isFile(); } catch { licenseOk = false; }
record(9, "LICENSE present", licenseOk, licenseOk ? "LICENSE found" : "LICENSE missing (MIT, Kaan Can Güner expected)");

// ---------------------------------------------------------------- 11 bootstrap
const bootstrapProblems = [];
const bootstrapPath = join(root, "skills", "website-master", "scripts", "bootstrap.mjs");
let bootstrapText = "";
try { bootstrapText = await read(bootstrapPath); } catch { bootstrapText = ""; }
if (!bootstrapText) bootstrapProblems.push("skills/website-master/scripts/bootstrap.mjs missing");
else {
  // No option may carry a package source, and the install path needs --yes.
  for (const banned of ["--source", "--url", "--repo", "--from"]) {
    if (bootstrapText.includes(`"${banned}"`)) bootstrapProblems.push(`accepts ${banned}, which could retarget a package`);
  }
  if (!/flags\.has\("--yes"\)/.test(bootstrapText)) bootstrapProblems.push("no --yes approval gate");
  if (!/if \(!flags\.has\("--yes"\)\) return 1;/.test(bootstrapText)) bootstrapProblems.push("missing required packages do not stop without --yes");

  // Scope: project is the default, -g only behind --global.
  if (!/flags\.has\("--global"\) \? "global" : "project"/.test(bootstrapText)) bootstrapProblems.push("scope default is not project with an opt-in --global");
  if (!/if \(scope === "global"\) args\.push\("-g"\);/.test(bootstrapText)) bootstrapProblems.push("-g is not gated behind the --global opt-in");

  // Agent: never guessed.
  if (!/--agent/.test(bootstrapText)) bootstrapProblems.push("no --agent option");
  if (!/state\.detected\.length === 1 \? state\.detected\[0\] : null/.test(bootstrapText)) bootstrapProblems.push("agent is chosen without requiring a single detection");
  if (!/if \(blocked\) return 2;/.test(bootstrapText)) bootstrapProblems.push("ambiguous or missing agent does not stop the install");

  // Skills: explicit names only.
  if (/--skill["'],\s*["']\*/.test(bootstrapText)) bootstrapProblems.push("installs with a --skill wildcard");
  if (!/for \(const skill of pkg\.skills\) args\.push\("--skill", skill\);/.test(bootstrapText)) bootstrapProblems.push("skill names are not passed one by one");

  // The skill text must describe the script relatively, with no harness path.
  const wmSkillText = (await read(join(root, "skills", "website-master", "SKILL.md"))) || "";
  if (/<[a-z-]*skill-dir>/.test(wmSkillText)) bootstrapProblems.push("website-master SKILL.md contains a placeholder absolute skill path");
  if (!/skill folder's `scripts\/` directory/.test(wmSkillText)) bootstrapProblems.push("website-master SKILL.md does not describe the script path relative to the skill folder");

  try {
    const mod = await import(pathToFileURL(bootstrapPath).href);
    const list = mod.PACKAGES;
    if (!Array.isArray(list) || list.length === 0) bootstrapProblems.push("PACKAGES list missing or empty");
    else {
      const seen = new Set();
      for (const pkg of list) {
        const label = pkg.id ?? "(no id)";
        if (!["required", "optional"].includes(pkg.kind)) bootstrapProblems.push(`${label}: kind must be required or optional`);
        if (!VERIFIED[pkg.repo]) bootstrapProblems.push(`${label}: repo ${pkg.repo} is not a verified upstream repo`);
        if (!/^[0-9a-f]{40}$/.test(String(pkg.pin))) bootstrapProblems.push(`${label}: pin "${pkg.pin}" is not a full 40-character commit SHA`);
        if (!pkg.ref) bootstrapProblems.push(`${label}: no tag in ref`);
        if (!readmeText.includes(pkg.pin)) bootstrapProblems.push(`${label}: pin not documented in README`);
        if (!readmeText.includes(pkg.ref)) bootstrapProblems.push(`${label}: tag ${pkg.ref} not documented in README`);
        if (typeof pkg.source !== "function") bootstrapProblems.push(`${label}: no source()`);
        else if (pkg.source() !== `${pkg.repo}@${pkg.pin}`) bootstrapProblems.push(`${label}: source() must be repo@pin`);
        for (const skill of pkg.skills ?? []) {
          const known = (VERIFIED[pkg.repo] ?? []).includes(skill);
          if (!known && !LOCAL_SKILLS.includes(skill)) bootstrapProblems.push(`${label}: skill "${skill}" not in ${pkg.repo}`);
        }
        if (seen.has(pkg.id)) bootstrapProblems.push(`duplicate package id ${label}`);
        seen.add(pkg.id);
      }
    }
  } catch (e) {
    bootstrapProblems.push(`import failed: ${e.message}`);
  }
}
record(11, "bootstrap installs only a fixed, pinned, approved list", bootstrapProblems.length === 0,
  bootstrapProblems.join("; ") || "commit pins, --yes gate, project scope default, explicit agent, explicit skill names, relative path");

// ---------------------------------------------------------------- output
// Remove only the directory mkdtemp created for this run, and only after
// confirming it still sits under the expected temp prefix.
async function removeSandbox(dir) {
  if (!dir) return false;
  const resolvedDir = resolve(dir);
  const resolvedPrefix = resolve(sandboxPrefix);
  // mkdtemp appends its random suffix directly to the prefix, so the parent
  // must be exactly tmpdir() and the basename must start with the prefix.
  if (dirname(resolvedDir) !== resolve(tmpdir())) return false;
  const base = basename(resolvedDir);
  if (!base.startsWith(basename(resolvedPrefix)) || base.length <= basename(resolvedPrefix).length) return false;
  try { await rm(resolvedDir, { recursive: true, force: true }); return true; }
  catch { return false; }
}

const width = Math.max(...results.map((r) => r.title.length));
const pad = (s, n) => s + " ".repeat(Math.max(0, n - s.length));
console.log("");
console.log(`${pad("#", 3)} ${pad("Check", width)} Status`);
console.log(`${"-".repeat(3)} ${"-".repeat(width)} ------`);
for (const r of results) console.log(`${pad(r.id, 3)} ${pad(r.title, width)} ${r.status}`);
console.log("");
console.log("Details:");
for (const r of results) console.log(`  ${r.id}. ${r.detail}`);
if (allowedMentions) console.log(`  note: README/AGENTS.md contain ${allowedMentions} product mentions in the compatibility table — expected.`);
console.log(`  note: fixture used a unique temp dir under ${sandboxPrefix} and was removed after the run.`);
if (risk.length || envHits.length) {
  console.log("");
  console.log("Risk surface (informational, not a failure):");
  for (const r of risk) console.log(`  - ${r}`);
  for (const r of envHits) console.log(`  - ${r}`);
}
if (details.length) {
  console.log("");
  console.log("Errors to fix:");
  for (const d of details) console.log(`  - ${d}`);
} else {
  console.log("");
  console.log("Errors to fix: none.");
}
const failed = results.filter((r) => r.status === "FAIL").length;
const passed = results.length - failed;
const removed = await removeSandbox(sandbox);
console.log("");
console.log(`RESULT: ${failed === 0 ? "PASS" : "FAIL"} — ${passed}/${results.length} checks passed, ${failed} failed.`);
if (verbose) console.log(`Skipped docs/ outputs: ${skippedOutputs.length}`);
if (!removed && sandbox) console.log(`Temp fixture left in place for inspection: ${sandbox}`);
process.exit(failed === 0 ? 0 : 1);
