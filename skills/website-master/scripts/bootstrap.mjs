#!/usr/bin/env node
// Dependency bootstrap for web-brief2launch.
//
// Security rules this script must keep:
//   - The install list is the fixed PACKAGES array below. No command-line
//     argument, environment variable, or file may add, replace, or retarget a
//     package source. There is no --source, --url, or --repo option.
//   - Every package is pinned to a full commit SHA, checked with
//     `git ls-remote --tags` when the list was written.
//   - Nothing installs without an explicit --yes. Without it the script only
//     reports and exits non-zero, so the agent must ask the user first.
//   - Installation is project-scoped by default. Global scope needs --global,
//     which the user must ask for.
//   - The target agent is never guessed. One detected agent is used; zero or
//     several detected agents stop the install until --agent is given.
//   - Only the skill names listed per package are installed. No wildcard.
//   - The script never edits agent configuration, never installs hooks, and
//     never installs the optional package.

import { spawn } from "node:child_process";
import { realpathSync } from "node:fs";
import { access } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Fixed list. Do not derive from input.
// Pins were resolved from `git ls-remote --tags` on 2026-11-08:
//   obra/superpowers v7.0.2       -> 22f0b463e7a5e579904dd6211a520321035526f7
//   addyosmani/agent-skills 0.6.15 -> 8bfcc1f9916f2eea55494d8c1fa7f4bde867dd9e
//   pbakaus/impeccable skill-v4.8.0 -> 414603bf14c7a344edb466bb1f85690c77ce8b7d
export const PACKAGES = [
  {
    id: "superpowers",
    kind: "required",
    repo: "obra/superpowers",
    ref: "v7.0.2",
    pin: "22f0b463e7a5e579904dd6211a520321035526f7",
    skills: [
      "brainstorming", "writing-plans", "subagent-driven-development",
      "dispatching-parallel-agents", "test-driven-development",
      "requesting-code-review",
    ],
  },
  {
    id: "addyosmani",
    kind: "required",
    repo: "addyosmani/agent-skills",
    ref: "0.6.15",
    pin: "8bfcc1f9916f2eea55494d8c1fa7f4bde867dd9e",
    skills: [
      "frontend-ui-engineering", "incremental-implementation",
      "api-and-interface-design", "performance-optimization",
      "security-and-hardening", "browser-testing-with-devtools",
      "ci-cd-and-automation", "shipping-and-launch",
      "observability-and-instrumentation", "planning-and-task-breakdown",
    ],
  },
  {
    id: "impeccable",
    kind: "optional",
    repo: "pbakaus/impeccable",
    ref: "skill-v4.8.0",
    pin: "414603bf14c7a344edb466bb1f85690c77ce8b7d",
    skills: ["impeccable"],
    // Optional: installed by its own installer, which asks interactive
    // questions and can add hooks. The script never runs it automatically.
    manual: "npx impeccable install",
    reason:
      "design direction and the stage 3 design audit; stage 3 also passes without it",
  },
];

// Install source is always repo@pin, derived in one place so a package entry
// cannot drift from its pin.
function packageSource(pkg) {
  return `${pkg.repo}@${pkg.pin}`;
}

// Agent skill directories and detection markers come from the skills CLI
// supported-agents table (checked 2026-11-10). Several agents share the
// project directory `.agents/skills`, so detection uses agent config markers
// instead of skill directories; otherwise one shared directory would look
// like several installed agents.
const AGENTS = [
  { id: "claude-code", project: ".claude/skills", global: ".claude/skills", markers: [".claude", "~/.claude"] },
  { id: "opencode", project: ".agents/skills", global: ".config/opencode/skills", markers: [".opencode", "~/.config/opencode"] },
  { id: "codex", project: ".agents/skills", global: ".agents/skills", markers: [".codex", "~/.codex"] },
  { id: "cursor", project: ".agents/skills", global: ".cursor/skills", markers: [".cursor", "~/.cursor"] },
  { id: "github-copilot", project: ".agents/skills", global: ".copilot/skills", markers: [".github/copilot-instructions.md", "~/.copilot"] },
  { id: "windsurf", project: ".windsurf/skills", global: ".codeium/windsurf/skills", markers: [".windsurf", "~/.codeium/windsurf"] },
  { id: "gemini-cli", project: ".agents/skills", global: ".gemini/skills", markers: [".gemini", "~/.gemini"] },
];
const AGENT_IDS = AGENTS.map((a) => a.id);

// A usage error exits 64 without printing a stack trace.
class UsageError extends Error {}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// The skills CLI runs from npx, so its own version is pinned too: an unpinned
// CLI could change its arguments between runs. Checked with
// `npm view skills version` on 2026-11-10.
const SKILLS_CLI_VERSION = "1.7.6";
const INSTALL_TIMEOUT_MS = 300_000;

async function hasSkill(dir, name) {
  return exists(join(dir, name, "SKILL.md"));
}

// Project scope writes into cwd, so cwd must actually be a project root.
async function hasProjectMarker() {
  return (await exists(join(process.cwd(), ".git"))) || (await exists(join(process.cwd(), "package.json")));
}

function parseArgs(argv) {
  const flags = new Set();
  let agent = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--agent") {
      agent = argv[i + 1] ?? null;
      i += 1;
      if (!agent) fail("--agent needs a value from: " + AGENT_IDS.join(", "));
      if (!AGENT_IDS.includes(agent)) fail(`Unknown agent "${agent}". Known: ${AGENT_IDS.join(", ")}`);
    } else if (arg === "--yes" || arg === "--check" || arg === "--json" || arg === "--global" || arg === "--help" || arg === "-h") {
      flags.add(arg);
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }
  return { flags, agent };
}

function fail(message) {
  console.error(message);
  console.error("Accepted options: --check, --yes, --json, --global, --agent <id>, --help. No package source is accepted.");
  throw new UsageError(message);
}

function expandPath(path) {
  return path.startsWith("~/") ? join(homedir(), path.slice(2)) : join(process.cwd(), path);
}

async function detectAgents() {
  const local = [];
  const global = [];
  for (const agent of AGENTS) {
    if (await exists(join(process.cwd(), agent.markers[0]))) local.push(agent.id);
    else if (agent.markers[1] && await exists(expandPath(agent.markers[1]))) global.push(agent.id);
  }
  // In-project markers win: a home-directory config says the agent exists on
  // this machine, not that the user works in this project with it.
  return { detected: local.length > 0 ? local : global, local, global };
}

async function findInstalled(name, scope, agentId = null) {
  const agents = agentId ? AGENTS.filter((a) => a.id === agentId) : AGENTS;
  const dirs = new Set();
  for (const agent of agents) {
    if (scope !== "global") dirs.add(join(process.cwd(), agent.project));
    if (scope !== "project") dirs.add(join(homedir(), agent.global));
  }
  const hits = [];
  for (const dir of dirs) if (await hasSkill(dir, name)) hits.push(dir);
  return hits;
}

function run(command, args, timeoutMs = INSTALL_TIMEOUT_MS) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      killSignal: "SIGTERM",
    });
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      // A child that ignores SIGTERM must not keep the session alive.
      setTimeout(() => { if (!settled) child.kill("SIGKILL"); }, 5_000).unref();
      finish({ code: 1, timedOut: true });
    }, timeoutMs);
    if (typeof timer.unref === "function") timer.unref();
    child.on("error", (error) => finish({ code: 1, error }));
    child.on("close", (code) => finish({ code: code ?? 1 }));
  });
}

export async function plan({ scope = "project", agent = null, detection = null } = {}) {
  const agents = detection ?? await detectAgents();
  const rows = [];
  for (const pkg of PACKAGES) {
    const missing = [];
    const presentDirs = new Set();
    for (const skill of pkg.skills) {
      const dirs = await findInstalled(skill, scope, agent);
      if (dirs.length === 0) missing.push(skill);
      else for (const dir of dirs) presentDirs.add(dir);
    }
    const present = missing.length === 0;
    rows.push({
      id: pkg.id,
      kind: pkg.kind,
      repo: pkg.repo,
      ref: pkg.ref,
      pin: pkg.pin,
      scope,
      present,
      partial: missing.length > 0 && presentDirs.size > 0,
      missing,
      manual: pkg.manual ?? null,
      reason: pkg.reason ?? null,
      source: packageSource(pkg),
      skills: pkg.skills,
    });
  }
  return { detected: agents.detected, detectedLocal: agents.local, detectedGlobal: agents.global, scope, rows };
}

function installArgs(pkg, agent, scope) {
  const args = ["-y", `skills@${SKILLS_CLI_VERSION}`, "add", packageSource(pkg), "-a", agent, "-y"];
  if (scope === "global") args.push("-g");
  for (const skill of pkg.skills) args.push("--skill", skill);
  return args;
}

function printHelp() {
  console.log("Usage: node scripts/bootstrap.mjs [--check] [--yes] [--global] [--agent <id>] [--json]");
  console.log("");
  console.log("  (default)  Report package status. Exits 1 when a required package is missing.");
  console.log("  --check    Same as default.");
  console.log("  --yes      Install missing required packages from the fixed list, pinned.");
  console.log("  --global   Install to the user directory. Default is project scope.");
  console.log("  --agent    Target agent id, required when none or several are detected.");
  console.log("  --json     Machine-readable output. Cannot be combined with --yes.");
  console.log("");
  console.log("This script accepts no package source argument. Its list is fixed in the file.");
}

function printPlan({ detected, scope, rows }, agent) {
  const line = (s) => console.log(s);
  line("Dependency check — web-brief2launch");
  line("");
  line(`Scope: ${scope === "global" ? "global (--global given)" : "project (default)"}`);
  line(`Agent: ${agent ?? (detected.length === 0 ? "not detected" : detected.length > 1 ? `several detected (${detected.join(", ")})` : detected[0])}`);
  line("");
  for (const row of rows) {
    const status = row.present ? "installed" : row.partial ? "partial" : "missing";
    line(`  [${status}] ${row.id} (${row.kind}) ${row.repo}@${row.ref} pinned ${row.pin.slice(0, 12)}`);
    if (row.reason) line(`            ${row.reason}`);
    if (!row.present && row.manual) line(`            manual: ${row.manual}`);
  }
  line("");
  const missingRequired = rows.filter((r) => r.kind === "required" && !r.present);
  if (!agent) {
    line("Cannot choose a target agent. Pass --agent <id> with one of:");
    line(`  ${AGENT_IDS.join(", ")}`);
    line("Nothing was installed.");
    return { missingRequired, blocked: true };
  }
  if (missingRequired.length === 0) {
    line("All required packages are installed for this scope.");
    return { missingRequired, blocked: false };
  }
  line("Missing required packages. Install with:");
  for (const row of missingRequired) {
    const pkg = PACKAGES.find((p) => p.id === row.id);
    line(`  npx ${installArgs(pkg, agent, scope).join(" ")}`);
  }
  line("");
  line("Re-run with --yes after the user approves the install.");
  return { missingRequired, blocked: false };
}

async function main() {
  const argv = process.argv.slice(2);
  // Help is checked before parsing so `--help --bogus` still prints help.
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return 0;
  }

  const { flags, agent: requestedAgent } = parseArgs(argv);
  if (flags.has("--json") && flags.has("--yes")) {
    fail("--json and --yes cannot be combined: --json only reports, --yes installs.");
  }

  const scope = flags.has("--global") ? "global" : "project";
  if (scope === "project" && !(await hasProjectMarker())) {
    const message = `No project marker (.git or package.json) in ${process.cwd()}. Project scope installs into this directory, so run from the project root. Use --global only for a user-wide install.`;
    if (flags.has("--json")) console.log(JSON.stringify({ error: message, detected: [], rows: [] }, null, 2));
    else {
      console.error("No project marker (.git or package.json) in " + process.cwd() + ".");
      console.error("Project scope installs into this directory, so run from the project root.");
      console.error("Use --global only for a user-wide install.");
    }
    return 1;
  }

  // One detection, one plan: a second pass could see a different filesystem.
  const detection = await detectAgents();
  const agent = requestedAgent ?? (detection.detected.length === 1 ? detection.detected[0] : null);
  const state = await plan({ scope, agent, detection });

  if (flags.has("--json")) {
    console.log(JSON.stringify({ ...state, agent }, null, 2));
    const missing = state.rows.filter((r) => r.kind === "required" && !r.present);
    return missing.length === 0 ? 0 : 1;
  }

  const { missingRequired, blocked } = printPlan(state, agent);
  // A blocked agent only stops an install. In report mode the list above is
  // the answer, and the user passes --agent <id> to continue.
  if (blocked) return flags.has("--yes") ? 2 : 0;
  if (missingRequired.length === 0) return 0;
  if (!flags.has("--yes")) return 1;

  for (const row of missingRequired) {
    const pkg = PACKAGES.find((p) => p.id === row.id);
    const args = installArgs(pkg, agent, scope);
    console.log(`\n> npx ${args.join(" ")}`);
    const result = await run("npx", args);
    if (result.timedOut) {
      console.error(`Install timed out after ${INSTALL_TIMEOUT_MS / 1000}s for ${pkg.id}. Run the command above manually.`);
      return 1;
    }
    if (result.code !== 0) {
      console.error(`Install failed for ${pkg.id}. Run the command above manually and re-check.`);
      return 1;
    }
  }
  const after = await plan({ scope, agent });
  const still = after.rows.filter((r) => r.kind === "required" && !r.present);
  if (still.length) {
    // The CLI may have used another folder name, so this is a warning, not a
    // failed install. List what to check by hand.
    console.warn(`\nCould not confirm after install: ${still.map((r) => r.id).join(", ")}`);
    console.warn("Check these files by hand, then re-run without --yes to confirm:");
    for (const row of still) {
      const pkg = PACKAGES.find((p) => p.id === row.id);
      console.warn(`  - ${row.id}: ${pkg.skills.map((s) => `${s}/SKILL.md`).join(", ")} under the ${scope} skill directory`);
    }
    return 0;
  }
  console.log("\nAll required packages are installed.");
  return 0;
}

// realpath on both sides: a symlinked or differing absolute path used to make
// this guard false and skip the whole bootstrap silently.
function invokedDirectly() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  try {
    process.exitCode = await main();
  } catch (error) {
    if (error instanceof UsageError) process.exitCode = 64;
    else throw error;
  }
}
