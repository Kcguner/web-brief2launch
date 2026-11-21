#!/usr/bin/env node
// Generate the /webmaster command file for each supported harness from one source.
// Usage: node scripts/generate-commands.mjs [--check]

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

if (process.argv.includes("--help")) {
  console.log("Usage: node scripts/generate-commands.mjs [--check]");
  process.exit(0);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const canonical = await readFile(join(root, "commands/webmaster.md"), "utf8");

const description =
  "Install the entire web-brief2launch skill set and its pinned dependencies into the current project";

function body(harness, args) {
  return canonical
    .replaceAll("{{HARNESS}}", harness)
    .replaceAll("{{ARGS}}", args)
    .trimEnd() + "\n";
}

function markdown(frontmatter, harness, args) {
  return `---\n${frontmatter}\n---\n\n${body(harness, args)}`;
}

function tomlString(value) {
  // A JSON string is a valid TOML basic string: same escapes for \n, \", \\.
  return JSON.stringify(value);
}

const files = new Map([
  [
    ".opencode/commands/webmaster.md",
    markdown(
      `description: ${description}\nagent: general`,
      "opencode",
      "Extra instructions from the user: $ARGUMENTS"
    ),
  ],
  [
    ".claude/commands/webmaster.md",
    markdown(`description: ${description}`, "claude-code", "Extra instructions from the user: $ARGUMENTS"),
  ],
  [
    ".cursor/commands/webmaster.md",
    markdown(`description: ${description}`, "cursor", "Extra instructions from the user: $ARGUMENTS"),
  ],
  [
    ".github/prompts/webmaster.prompt.md",
    markdown(
      `agent: 'agent'\ndescription: '${description}'`,
      "github-copilot",
      "If the user supplied extra instructions with this command, follow them."
    ),
  ],
  [
    ".windsurf/workflows/webmaster.md",
    `# webmaster\n\n${description}.\n\n## Steps\n\n${body("windsurf", "If the user supplied extra instructions with this command, follow them.")}`,
  ],
  [
    ".gemini/commands/webmaster.toml",
    `description = ${tomlString(description)}\nprompt = ${JSON.stringify(body("gemini-cli", "Extra instructions from the user: {{args}}"))}\n`,
  ],
  [
    "commands/webmaster.codex.toml",
    `# Paste this block into ~/.codex/config.toml.\n[tui.presets."1"]\nlabel = "webmaster"\ninput = ${tomlString(body("codex", "If the user supplied extra instructions with this command, follow them."))}\n`,
  ],
]);

// Harnesses that discover Agent Skills instead of separate command files.
// Copy each generated SKILL.md into that harness's project skills directory.
const skillHarnesses = [
  ["deepseek-harness", ".dsh/skills"],
  ["qwen-code", ".qwen/skills"],
  ["kimi-code-cli", ".kimi-code/skills"],
  ["minimax-code", ".minimax/skills"],
  ["grok-build", ".grok/skills"],
  ["kiro-cli", ".kiro/skills"],
  ["cline", ".agents/skills"],
  ["roo-code", ".roo/skills"],
  ["continue", ".continue/skills"],
  ["openhands", ".openhands/skills"],
];

for (const [harness] of skillHarnesses) {
  files.set(
    `commands/harness-skills/${harness}/webmaster/SKILL.md`,
    `---\nname: webmaster\ndescription: ${description}\n---\n\n${body(harness, "If the user supplied extra instructions with this command, follow them.")}`
  );
}

const check = process.argv.includes("--check");
let drift = 0;

for (const [relative, content] of files) {
  const path = join(root, relative);
  if (check) {
    let current = "";
    try {
      current = await readFile(path, "utf8");
    } catch {
      current = "";
    }
    if (current !== content) {
      console.log(`STALE ${relative}`);
      drift++;
    }
  } else {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
    console.log(`WROTE ${relative}`);
  }
}

if (check) {
  if (drift) {
    console.error(`${drift} command file(s) out of date. Run: node scripts/generate-commands.mjs`);
    process.exitCode = 1;
  } else {
    console.log(`OK ${files.size} command files match commands/webmaster.md`);
  }
}
