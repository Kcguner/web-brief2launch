---
description: Install the entire web-brief2launch skill set and its pinned dependencies into the current project
---

Install the complete webmaster skill set into the CURRENT project (the working directory). "All" means: this repository's seven skills, the two required dependency packs at the pins held by the bootstrap script, and the project entry pointer. Never install globally unless the user explicitly asked for global scope.

Running harness: cursor. Use the agent id and skills directory for that harness from the table below. Do not guess and do not ask which harness is active — the harness is named here.

| Harness | skills CLI `-a` id | Installed skills directory |
|---------|--------------------|----------------------------|
| opencode | `opencode` | `.agents/skills/` |
| claude-code | `claude-code` | `.claude/skills/` |
| codex | `codex` | `.agents/skills/` |
| cursor | `cursor` | `.agents/skills/` |
| github-copilot | `github-copilot` | `.agents/skills/` |
| windsurf | `windsurf` | `.windsurf/skills/` |
| gemini-cli | `gemini-cli` | `.agents/skills/` |
| deepseek-harness | `universal` | `.agents/skills/` |
| qwen-code | `qwen-code` | `.qwen/skills/` |
| kimi-code-cli | `kimi-code-cli` | `.agents/skills/` |
| minimax-code | `minimax-code` | `.minimax/skills/` |
| grok-build | `grok` | `.grok/skills/` |
| kiro-cli | `kiro-cli` | `.kiro/skills/` |
| cline | `cline` | `.agents/skills/` |
| roo-code | `roo` | `.roo/skills/` |
| continue | `continue` | `.continue/skills/` |
| openhands | `openhands` | `.openhands/skills/` |

DeepSeek Harness has no dedicated skills CLI id: use `universal`, which writes to `.agents/skills/`, a directory DSH reads natively. Its setup skill may live in `.dsh/skills/` or `.agents/skills/`.

If this file is used as a plain prompt without a harness name (for example pasted into a chat), detect the harness from project markers in this order: `.dsh/` → deepseek-harness, `.qwen/` → qwen-code, `.kimi-code/` → kimi-code-cli, `.minimax/` → minimax-code, `.grok/` → grok-build, `.kiro/` → kiro-cli, `.claude/` → claude-code, `.opencode/` → opencode, `.codex/` → codex, `.cursor/` → cursor, `.github/` → github-copilot, `.windsurf/` or `.devin/` → windsurf, `.gemini/` → gemini-cli, `.cline/` → cline, `.roo/` → roo-code, `.continue/` → continue, `.openhands/` → openhands. Check the home-directory counterparts only when no project marker matches. If several still match, ask the user in plain text or with the question tool. Never hand-write raw UI blocks to ask a question; use the question tool or plain text.

1. Check `node --version`. Node.js >= 18 is required. If it is missing or older, stop and tell the user to install Node.js >= 18 first.

2. From the project root, install this skill set with all seven skills:

   `npx -y skills add Kcguner/web-brief2launch --skill '*' -a <id> -y`

   Use the id from the table in place of `<id>`. Do not add `--global`. Do not install skills one by one. If this command fails, stop and report the exact output.

3. Locate `website-master/scripts/bootstrap.mjs` inside the skills directory from the table. If it is missing, stop: step 2 did not install the skill set. Do not write dependency commands by hand.

4. From the project root, run the pinned dependency installer with approval already given for this all-at-once setup:

   `node <project-skills-dir>/website-master/scripts/bootstrap.mjs --yes --agent <id>`

   Show the commands the script prints and its exit code. It installs only the fixed, pinned packages from its own list. Never pass a package source, URL, or extra package to it. If it exits 1 or 2, report the failure and do not claim a complete install.

5. Add the entry pointer for agents that do not auto-load skills:
   - If the project already has an instruction file (AGENTS.md, CLAUDE.md, GEMINI.md or the equivalent), ask before editing it. On approval, add one line: `For website or web app requests, use the website-master skill first.`
   - If no instruction file exists, create `AGENTS.md` at the project root with that line, plus two lines naming the installed entry skill (`website-master/SKILL.md`) and the read-only audit skill (`site-audit/SKILL.md`).

6. Verify the install before reporting success:
   - List the skill folders in the project skills directory. Confirm all seven are present: `website-master`, `website-intake`, `site-audit`, `seo`, `legal-compliance`, `monitoring-maintenance`, `final-quality-gate`.
   - Re-run the bootstrap in report mode (`node <project-skills-dir>/website-master/scripts/bootstrap.mjs --agent <id>`) and confirm exit 0 with no missing required packages.

7. Report in the user's language: the target agent id and scope, the seven installed skills, the dependency packs with their pinned commits, the verification output, and what was skipped. State that `impeccable` stays optional and was not installed. Give the next step: ask the agent to build or redesign a website, or to audit an existing site for a read-only report.

Do not edit agent configuration files, do not add hooks, and do not install optional packages without explicit approval. Every success claim needs command output from steps 2, 4 and 6.

Extra instructions from the user: $ARGUMENTS
