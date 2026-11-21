---
description: Install the entire web-brief2launch skill set and its pinned dependencies into the current project
agent: general
---

Install the complete webmaster skill set into the CURRENT project (the working directory). "All" means: this repository's seven skills, the two required dependency packs at the pins held by the bootstrap script, and the project entry pointer. Never install globally unless the user explicitly asked for global scope.

1. Detect the target agent id for this project (claude-code, opencode, codex, cursor, github-copilot, windsurf, gemini-cli). The presence of a commands folder alone is not a project-level agent config marker. If zero or several agents are detected, ask the user in plain text or with the question tool and use the id they choose. Never guess. Never hand-write raw UI blocks to ask a question; use the question tool or plain text.

2. Check `node --version`. Node.js >= 18 is required. If it is missing or older, stop and tell the user to install Node.js >= 18 first.

3. From the project root, install this skill set with all seven skills:

   `npx -y skills add Kcguner/web-brief2launch --skill '*' -a <id> -y`

   Use the detected id in place of `<id>`. Do not add `--global`. Do not install skills one by one. If this command fails, stop and report the exact output.

4. The installer places skills under `.agents/skills/` for OpenCode, Codex, Cursor, GitHub Copilot and Gemini CLI, or `.claude/skills/` for Claude Code, or `.windsurf/skills/` for Windsurf. Locate `website-master/scripts/bootstrap.mjs` in that project skills directory. If it is missing, stop: step 3 did not install the skill set. Do not write dependency commands by hand.

5. From the project root, run the pinned dependency installer with approval already given for this all-at-once setup:

   `node <project-skills-dir>/website-master/scripts/bootstrap.mjs --yes --agent <id>`

   Show the commands the script prints and its exit code. It installs only the fixed, pinned packages from its own list. Never pass a package source, URL, or extra package to it. If it exits 1 or 2, report the failure and do not claim a complete install.

6. Add the entry pointer for agents that do not auto-load skills:
   - If the project already has an instruction file (AGENTS.md, CLAUDE.md or the equivalent), ask before editing it. On approval, add one line: `For website or web app requests, use the website-master skill first.`
   - If no instruction file exists, create `AGENTS.md` at the project root with that line, plus two lines naming the installed entry skill (`website-master/SKILL.md`) and the read-only audit skill (`site-audit/SKILL.md`).

7. Verify the install before reporting success:
   - List the skill folders in the project skills directory. Confirm all seven are present: `website-master`, `website-intake`, `site-audit`, `seo`, `legal-compliance`, `monitoring-maintenance`, `final-quality-gate`.
   - Re-run the bootstrap in report mode (`node <project-skills-dir>/website-master/scripts/bootstrap.mjs --agent <id>`) and confirm exit 0 with no missing required packages.

8. Report in the user's language: the target agent id and scope, the seven installed skills, the dependency packs with their pinned commits, the verification output, and what was skipped. State that `impeccable` stays optional and was not installed. Give the next step: ask the agent to build or redesign a website, or to audit an existing site for a read-only report.

Do not edit agent configuration files, do not add hooks, and do not install optional packages without explicit approval. Every success claim needs command output from steps 3, 5 and 7.

Extra instructions from the user: $ARGUMENTS
