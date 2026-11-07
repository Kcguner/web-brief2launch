# web-brief2launch

A portable, harness-independent skill set that takes a website from idea to
launch and ongoing maintenance. It is plain Markdown: no product-specific tools,
commands, or integrations. It works in any agent that reads `SKILL.md` files,
and in agents that do not, through `AGENTS.md`.

**Version:** 0.1.0

## What it contains

| Path | Role |
|------|------|
| `skills/website-master/` | Orchestrator: 13-stage flow, gates, approvals, progress file |
| `skills/website-intake/` | Question bank that produces `docs/brief.md` |
| `skills/seo/` | Technical and on-page SEO, structured data, plus an audit script |
| `skills/legal-compliance/` | Privacy, cookies, KVKK/GDPR, terms — not legal advice |
| `skills/monitoring-maintenance/` | Analytics, errors, uptime, maintenance calendar |
| `skills/final-quality-gate/` | Release gate: one PASS/FAIL report from every output |
| `AGENTS.md` | Universal entry point and reading order |

Only six skills are written here. The engineering stages (planning, UI/UX,
frontend, backend, performance, security, testing, deployment) are delegated to
two well-maintained external skill packs, referenced by name and repository.
Information architecture and the backend data model use the checklists in
`skills/website-master/reference.md`. Nothing is copied. This keeps one source
of truth per skill and avoids drift.

## Install

### 1. This skill set

The [skills CLI](https://github.com/vercel-labs/skills) installs into many
agents:

```bash
npx skills add Kcguner/web-brief2launch
```

Or clone and point your agent at the folder:

```bash
git clone https://github.com/Kcguner/web-brief2launch.git
```

Then install the `skills/*` folders with whatever mechanism your agent supports
for local skills, or copy them into the agent's skill directory (see the
compatibility table).

### 2. Dependency skill packs

**superpowers** (planning, brainstorming, delegation, TDD, code review):

```bash
# generic, via the skills CLI
npx skills add obra/superpowers

# Claude Code
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace

# Codex
/plugins            # then search "superpowers" and install

# Cursor
/add-plugin superpowers

# Gemini CLI
gemini extensions install https://github.com/obra/superpowers

# GitHub Copilot CLI
copilot plugin marketplace add obra/superpowers-marketplace
copilot plugin install superpowers@superpowers-marketplace
```

**addyosmani/agent-skills** (frontend, API design, performance, security,
testing, CI/CD, launch, observability):

```bash
npx skills add addyosmani/agent-skills            # all 25 skills
npx skills add addyosmani/agent-skills --skill frontend-ui-engineering
```

Individual skills this set refers to:

| Skill | Repo | Stage |
|-------|------|-------|
| `brainstorming` | obra/superpowers | 0 Intake |
| `writing-plans` | obra/superpowers | 1 Planning |
| `subagent-driven-development` | obra/superpowers | 2 Delegation |
| `dispatching-parallel-agents` | obra/superpowers | 2 Delegation |
| `test-driven-development` | obra/superpowers | 10 Testing, Phase 2 (regression cases) |
| `requesting-code-review` | obra/superpowers | review between phases |
| `planning-and-task-breakdown` | addyosmani/agent-skills | 1 Planning |
| `frontend-ui-engineering` | addyosmani/agent-skills | 3, 4 |
| `incremental-implementation` | addyosmani/agent-skills | 4 Frontend |
| `api-and-interface-design` | addyosmani/agent-skills | 5 Backend |
| `performance-optimization` | addyosmani/agent-skills | 7 Performance |
| `security-and-hardening` | addyosmani/agent-skills | 8 Security |
| `browser-testing-with-devtools` | addyosmani/agent-skills | 10 Testing |
| `ci-cd-and-automation` | addyosmani/agent-skills | 11 Deployment |
| `shipping-and-launch` | addyosmani/agent-skills | 11 Deployment |
| `observability-and-instrumentation` | addyosmani/agent-skills | 12 Monitoring (supporting) |

Folder names above were read from the repositories' file trees on 2026-11-07.
Re-check after upgrading a dependency pack; skill names can change.

## Usage

1. Ask your agent to build, redesign, or audit a website.
2. The agent reads `skills/website-master/SKILL.md`, which starts at intake.
3. Answer the grouped questions. Approve `docs/brief.md`.
4. Review `docs/plan.md`. Approve it.
5. Work through the stages. Each transition needs your approval.
6. Before release, the agent runs `skills/final-quality-gate/SKILL.md` and shows
   one PASS/FAIL report.
7. After launch, `skills/monitoring-maintenance/SKILL.md` sets up monitoring.

If your agent does not auto-load skills, open `AGENTS.md` first and follow the
reading order there.

## Compatibility

Conventions below come from each project's setup documentation and the
dependency packs' setup guides. None of them was install-tested in this
repository, so every row says "not tested".

| Agent | Skill location / mechanism | Verified how | Tested |
|-------|---------------------------|--------------|--------|
| Claude Code | `~/.claude/skills/` or project `.claude/skills/`; plugins via `.claude-plugin/` | Common convention; dependency docs use plugins | not tested |
| OpenCode | project `.opencode/skills/` or `~/.config/opencode/skills/` | Stated in addyosmani/agent-skills setup docs | not tested |
| Codex | plugin with a root `skills/` directory, or `AGENTS.md` | Stated in addyosmani/agent-skills setup docs | not tested |
| Cursor | project `.cursor/skills/`, rules in `.cursor/rules/*.mdc` | Stated in addyosmani/agent-skills setup docs | not tested |
| GitHub Copilot | `.github/copilot-instructions.md`; skills vary by surface | Stated in addyosmani/agent-skills setup docs | not tested |
| Windsurf | rules/skills configuration; no stable public skill folder | Not verified | not tested |
| Gemini CLI | `gemini skills install <path>` | Stated in addyosmani/agent-skills setup docs | not tested |
| Generic / other | `AGENTS.md` at repo root | Documented in this repo, untested | not tested |

Anything marked "not tested" should be treated as a starting point: check your
agent's current documentation before relying on the path.

## Design rules

- No product-specific tool names, command syntax, or integrations in skill text.
- Frontmatter is limited to `name` and `description`.
- `name` always matches its folder name, lowercase with hyphens.
- Skill files stay under 200 lines; long lists live in `checklist.md` or
  `reference.md` in the same folder.
- Skills reference each other by relative path, never by agent name.
- Scripts are Node.js (>= 18) or POSIX bash, with dependency checks and clear
  errors. Node is preferred for Windows compatibility.
- Skill text is English; reports shown to users are in the user's language.
- One documented exception to the no-product-names rule: the release criteria
  are expressed as a Lighthouse performance score because that is the agreed
  measurement standard. It names a metric source, not a required product; the
  agent may measure it with any equivalent lab tool.

## Legal notice

The `legal-compliance` skill and its checklist are engineering guidance, not
legal advice. They do not create a lawyer-client relationship. Privacy policies,
cookie notices, KVKK aydınlatma metinleri, and terms of use must be reviewed by
a qualified lawyer in the applicable jurisdiction before publication. KVKK
obligations in particular depend on your data-processing scope and may include
VERBİS registration.

## Acknowledgements

This set stands on two excellent open skill packs and does not copy from them:

- [obra/superpowers](https://github.com/obra/superpowers) — the plan-first,
  subagent-driven development methodology behind Phases 0–2.
- [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) — the
  engineering skills for frontend, API, performance, security, testing, CI/CD,
  launch, and observability.

Install them with the commands above; they keep their own licenses and update
cadence.

## License

MIT — see `LICENSE`. Copyright (c) 2026 Kaan Can Güner.
