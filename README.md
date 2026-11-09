# web-brief2launch

## Quick start

One command installs this skill set. The dependency packs install on first use,
from the fixed list in `skills/website-master/scripts/bootstrap.mjs`, after you
approve them.

```bash
npx skills add Kcguner/web-brief2launch --skill '*'
```

`--skill '*'` installs all six skills; without it the CLI can prompt per skill
and leave a partial install. The CLI asks which agent to target; add
`-a <agent>` to skip that prompt (ids are in the compatibility table).

Then open `AGENTS.md` (or your agent's instruction file) and follow the reading
order there. For agents that do not auto-load skills, point the agent at this
folder and start with `skills/website-master/SKILL.md`.

### What the bootstrap does

The script ships inside the `website-master` skill folder, because the skills CLI
installs skill folders and nothing else. On the first website request in a
project, the agent runs it from that skill folder's `scripts/` directory:

```bash
node scripts/bootstrap.mjs                      # report only
node scripts/bootstrap.mjs --yes                # install required, project scope
node scripts/bootstrap.mjs --yes --global       # only when the user asks for it
node scripts/bootstrap.mjs --yes --agent opencode   # when detection is ambiguous
```

- It installs only the packages written in that file. It accepts no package
  source argument, no URL, and no environment override.
- Every package is pinned to a full commit SHA, resolved from the upstream tag
  with `git ls-remote --tags` when the list was written:

  | Package | Tag at pin time | Commit |
  |---|---|---|
  | `obra/superpowers` | `v7.0.2` | `22f0b463e7a5e579904dd6211a520321035526f7` |
  | `addyosmani/agent-skills` | `0.6.15` | `8bfcc1f9916f2eea55494d8c1fa7f4bde867dd9e` |
  | `pbakaus/impeccable` (optional) | `skill-v4.8.0` | `414603bf14c7a344edb466bb1f85690c77ce8b7d` |

- Scope is project level by default. `--global` installs into the user
  directory, and only when you ask for it.
- The target agent is never guessed. One detected agent is used; none or several
  detected agents stop the install until you pass `--agent <id>`.
- It installs only the verified skill names listed in the script, one `--skill`
  argument each. No wildcard.
- It runs one `npx skills add <repo>@<commit> -a <agent> -y --skill <name> ...`
  command per missing package, and prints each command before running it.
- It never edits agent configuration, never installs hooks, and never installs
  optional packages.
- Detection looks for each agent's configuration directory, not the shared
  `.agents/skills` directory, because several agents use that same path.
- Nothing updates automatically. Pins change only when this file and the table
  below change together. `npx skills update` updates installed copies on demand
  and can move a pinned package to its latest commit; run `npx skills check`
  first to see what would change.
- If you decline, or there is no network, the workflow continues without the
  missing skills and records which stages run in limited mode.

#### Updating a pin

1. Resolve the new tag: `git ls-remote --tags https://github.com/<repo>`.
2. Take the dereferenced commit (`refs/tags/<tag>^{}`) and check the skill
   folders still exist at that commit.
3. Update `ref`, `pin`, and `source()` for that package in
   `skills/website-master/scripts/bootstrap.mjs`.
4. Update this table and run `node scripts/validate.mjs`.

Manual commands, if you prefer to install everything yourself:

```bash
# Our skill set, all six skills (not install-tested)
npx skills add Kcguner/web-brief2launch --skill '*'

# Dependency: superpowers, all skills (not install-tested)
npx skills add obra/superpowers --skill '*'

# Dependency: addyosmani/agent-skills, all skills (not install-tested)
npx skills add addyosmani/agent-skills --skill '*'

# Optional dependency: impeccable, design direction and audit (not install-tested)
npx impeccable install
```

`impeccable` is optional. Stage 3 uses it for design direction and the design
audit. Without it, stage 3 still passes on the manual WCAG 2.1 AA and design
checklist evidence, and `docs/progress.md` records the fallback. It has its own
installer, which asks questions and can add agent hooks, so the bootstrap never
runs it for you.

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
| `skills/website-master/scripts/bootstrap.mjs` | Fixed, pinned dependency installer used on first run |
| `AGENTS.md` | Universal entry point and reading order |

Only six skills are written here. The engineering stages (planning, UI/UX,
frontend, backend, performance, security, testing, deployment) are delegated to
three well-maintained external skill packs, referenced by name and repository.
Information architecture and the backend data model use the checklists in
`skills/website-master/reference.md`. Nothing is copied. This keeps one source
of truth per skill and avoids drift.

## Install

### 1. This skill set

The [skills CLI](https://github.com/vercel-labs/skills) installs into many
agents:

```bash
npx skills add Kcguner/web-brief2launch --skill '*'
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

**impeccable** (design direction, craft floor, design audit and polish):

```bash
npx impeccable install
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
| `impeccable` | pbakaus/impeccable | 3 UI/UX craft and audit, design polish before release (optional) |
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
5. Work through the stages. Routine stages auto-advance on a passing gate; the
   agent pauses only for decision points (missing dependency, brief and plan,
   scope change, a gate that fails twice, irreversible actions, legal sign-off,
   release).
6. Before release, the agent runs `skills/final-quality-gate/SKILL.md` and shows
   one PASS/FAIL report.
7. After launch, `skills/monitoring-maintenance/SKILL.md` sets up monitoring.

If your agent does not auto-load skills, open `AGENTS.md` first and follow the
reading order there.

## Compatibility

Skill paths and `--agent` ids below were checked against the
[skills CLI supported-agents table](https://github.com/vercel-labs/skills/blob/main/docs/agents.md)
on 2026-11-10. Installation into each agent was not run in this repository, so
every row still says "not tested". Several agents share the project directory
`.agents/skills/`; the CLI links it into the agent-specific location.

| Agent | `--agent` id | Project path | Global path | Tested |
|-------|--------------|--------------|-------------|--------|
| Claude Code | `claude-code` | `.claude/skills/` | `~/.claude/skills/` | not tested |
| OpenCode | `opencode` | `.agents/skills/` | `~/.config/opencode/skills/` | not tested |
| Codex | `codex` | `.agents/skills/` | `~/.agents/skills/` | not tested |
| Cursor | `cursor` | `.agents/skills/` | `~/.cursor/skills/` | not tested |
| GitHub Copilot | `github-copilot` | `.agents/skills/` | `~/.copilot/skills/` | not tested |
| Windsurf | `windsurf` | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` | not tested |
| Gemini CLI | `gemini-cli` | `.agents/skills/` | `~/.gemini/skills/` | not tested |
| Generic / other | n/a | `AGENTS.md` at repo root | n/a | not tested |

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

This set stands on three excellent open skill packs and does not copy from them:

- [obra/superpowers](https://github.com/obra/superpowers) — the plan-first,
  subagent-driven development methodology behind Phases 0–2.
- [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) — the
  engineering skills for frontend, API, performance, security, testing, CI/CD,
  launch, and observability.
- [pbakaus/impeccable](https://github.com/pbakaus/impeccable) — the design
  direction, craft floor, and design audit used in stage 3.

Install them with the commands above; they keep their own licenses and update
cadence.

## License

MIT — see `LICENSE`. Copyright (c) 2026 Kaan Can Güner.
