# Website Development Skill Set — universal entry

This repository contains a portable skill set for taking a website from idea to
launch and ongoing maintenance. Every skill is a plain `SKILL.md` file under
`skills/<name>/`. Nothing here depends on a specific agent product, command
syntax, or integration protocol.

## What is inside

- `skills/website-master/` — orchestrator. Owns the 13-stage workflow, progress
  tracking, stage gates, and user approvals.
- `skills/website-intake/` — question bank that turns a request into
  `docs/brief.md`.
- `skills/seo/`, `skills/legal-compliance/`, `skills/monitoring-maintenance/` —
  web-specific stages that the dependency skill packs do not cover.
- `skills/final-quality-gate/` — the release gate. It reads every other output
  and produces one PASS / FAIL report.
- `README.md` — installation, dependency list, compatibility notes.

## How an agent should use this set

1. Read `skills/website-master/SKILL.md` first. It decides the current stage and
   names the skill file for that stage.
2. Open only the skill file for the current stage. Do not preload the whole set.
3. Follow that skill's Steps and Checklist. Write the output file it names.
4. Return to `website-master` and check the stage completion criteria before
   moving on.
5. Run `skills/final-quality-gate/SKILL.md` before any release.

## If your agent does not auto-load skills

Read the files in this order and treat each one as active instructions for the
current task:

1. `skills/website-master/SKILL.md`
2. The stage skill named by the orchestrator
3. `skills/final-quality-gate/SKILL.md` before release

Never load two stage skills at once unless the orchestrator explicitly runs a
parallel phase. Keep the orchestrator's file as the source of truth for stage
order.

## Dependency skills

`website-master` delegates several engineering stages to external skill packs
instead of duplicating them. Those skills are referenced by name and repository,
never copied into this repo. See the dependency section of `README.md` for the
install commands and the verified skill folder names.

### Bootstrap on first use

The first website request in a project starts with one dependency check:

1. Run `node scripts/bootstrap.mjs` from the `website-master` skill folder's
   `scripts/` directory. It only reports; it installs nothing.
2. Show the user the missing packages, the pinned commits, and the exact
   commands. Ask for approval.
3. On approval, run the same script with `--yes`. It installs only the fixed list
   in that file, pinned to the commits written there. It accepts no package
   source argument.
4. Project scope is the default. Add `--global` only when the user asks for a
   user-wide install. Pass `--agent <id>` when the script reports none or several
   detected agents; never guess one.
5. On refusal or no network, continue the base flow. Record in `docs/progress.md`
   which stages run in limited mode and why.

The script never adds agent hooks, never edits agent configuration, and never
installs the optional `impeccable` package. Optional packages are reported with
their manual command.

If a required dependency skill is missing and the user does not want to install
it, tell the user which stage is limited and stop that stage. Do not imitate the
missing skill from memory.

## Language rules

- Skill files, code, commits, and file names: English.
- Reports, briefs, plans, and messages shown to the user: the user's language.
- Keep code, commands, paths, numbers, and error strings verbatim.

## Honesty rules

- If the agent has no terminal, browser, network, or deploy access, say so and
  give the user manual steps. Never claim a check ran when it did not.
- Every completion claim needs evidence: a command output, a report file, or a
  user confirmation.
- Do not invent metrics, test results, or legal approval.
