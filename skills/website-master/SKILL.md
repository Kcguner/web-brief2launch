---
name: website-master
description: Use when the user asks to build, redesign, relaunch, or audit a website, landing page, portfolio, or web app, in English or Turkish (e.g. "build a website", "create a landing page", "make a portfolio", "build a web app", "redesign my site", "relaunch", "site audit", "web sitesi oluştur", "landing page yap", "portfolyo sitesi", "web uygulaması geliştir", "siteyi yeniden tasarla", "siteyi baştan yap", "site denetimi"). Orchestrates the 13 stages, delegates to stage skills and external skill packs, tracks progress in docs/progress.md, and enforces stage gates and approval at decision points. If the request is only a narrow task (SEO, legal, monitoring, intake, quality gate), use that specific skill instead.
---

# Website Master (Orchestrator)

## Purpose

Own the full lifecycle. Decide the current stage, open the right skill file,
check the stage gate, and keep one progress file. Never do a stage's work here;
delegate it and verify the result.

Supporting files: `reference.md` (information-architecture and backend/data
checklists), `stages.md` (stage-to-skill map and priority rules).

## First run

Before the first stage, run the dependency bootstrap. It is part of the first
website request, not a separate step for the user.

1. Run `node scripts/bootstrap.mjs` from this skill folder's `scripts/` directory,
   the folder that holds this `SKILL.md`. It reports only; it installs nothing.
2. Show the user the missing packages, pinned versions, and commands. Ask for
   approval.
3. On approval, run the same script with `--yes`. The script installs only the
   fixed list inside it, pinned to the commits written there. It accepts no
   source argument.
4. Install scope is project level by default. Add `--global` only when the user
   asks for a user-wide install.
5. Pass `--agent <id>` when the script reports none or several detected agents.
   Never guess a target agent.
6. On refusal or no network, continue the base flow. Record the limited stages
   and the reason in `docs/progress.md`. Do not imitate a missing skill.

Rules: never install without explicit approval; never edit agent configuration
or add hooks; `impeccable` is optional, so a missing install falls back to
recorded manual evidence in stage 3 without blocking; ask once per project, and
never prompt again when a second check finds everything present.

Then, once per project, ask whether to add this exact line to the project's
agent instruction file (AGENTS.md or the file the agent reads at session start):

`For website or web app requests, use the website-master skill first.`

Never modify the file without approval, do not ask again if the line is already
present or the user declined, and record the decision in `docs/progress.md`.

## Language

Write every skill file, code change, commit, and file name in English. Write
every report, brief, plan, and message shown to the user in the user's language.
Keep code, commands, paths, numbers, and error strings verbatim in any language.

## Inputs

- `docs/brief.md` (from `../website-intake/SKILL.md`). If missing, run intake
  first. Do not plan without an approved brief.
- The repository, existing site URL, and any deployed environment.
- User constraints: time, budget, access to DNS, hosting, and deploy.

## Steps

1. **Read the brief.** If `docs/brief.md` is absent or unapproved, stop and run
   `../website-intake/SKILL.md`.
2. **Classify the project.** Portfolio, e-commerce, SaaS, blog, corporate,
   documentation, community, other. Record it in `docs/progress.md`.
3. **Weight the stages.** Use the table in `stages.md`. A static portfolio skips
   heavy TDD and backend work; e-commerce keeps security, legal, and testing at
   full weight. Record the chosen depth per stage.
4. **Check dependency skills.** Run `scripts/bootstrap.mjs` from this skill
   folder's `scripts/` directory at the start of the first stage and again when a
   stage's skill is not found. Missing required package: show the reported
   command, ask for approval, then run the same script with `--yes`. Project
   scope is the default; add `--global` only when the user asks for it. Pass
   `--agent <id>` when the script cannot settle on one agent. Missing optional
   package: continue, and record the fallback in `docs/progress.md`. Never
   substitute an invented workflow.
5. **Load one stage skill.** Open only the file for the current stage. Apply its
   Steps and Checklist.
6. **Check the gate.** Compare the output against the stage completion criteria
   in `stages.md`. Failing gate: fix and retest. Do not advance.
7. **Auto-advance on a passing gate.** Record progress and move to the next
   stage without pausing. Pause only for decisions: a missing dependency
   (install approval), the brief and plan in Phase 0-1, a scope change that
   contradicts the brief, a gate that fails twice, an irreversible action
   (deploy, DNS change, migration, secret rotation), legal sign-off, or release.
   At each pause, show what was done, the evidence, what is next, and the risk.
8. **Record progress** in `docs/progress.md` after each stage: stage, status,
   evidence path, date, open issues, and whether the stage auto-advanced or
   paused for a decision.
9. **Run the release gate** with `../final-quality-gate/SKILL.md` before any
   publish. Release needs a PASS plus explicit user approval.
10. **Hand off to maintenance** with `../monitoring-maintenance/SKILL.md` after
    launch.

### Phase 0 — Intake

Skill: `../website-intake/SKILL.md` plus external `brainstorming`.
Output: `docs/brief.md`. Gate: user-approved brief.

### Phase 1 — Plan

Skill: external `writing-plans`, supported by
`planning-and-task-breakdown`.
Output: `docs/plan.md` with phases, tasks, responsible role, dependencies, files
to touch, and a measurable completion criterion per task.
Gate: every task has an owner role, a file target, and a verifiable criterion;
the user approved the plan.

### Phase 2 — Phased delegation

Skills: external `subagent-driven-development` and
`dispatching-parallel-agents` when the agent supports subagents. Otherwise the
same agent takes each role in sequence.
Rules:
- One writer per file. Parallel agents never edit the same file.
- Each phase writes `docs/handoffs/<phase>-task.md` and
  `docs/handoffs/<phase>-result.md`.
- A separate reviewer pass checks each phase against `docs/plan.md`.
- Stage work in order: information architecture (`reference.md`), UI/UX design
  → external `frontend-ui-engineering` for the screen and token contract, with
  external `impeccable` for design direction and the `audit` pass, frontend build
  → external `frontend-ui-engineering` and `incremental-implementation`, backend
  and data → external `api-and-interface-design` plus `reference.md`.
  SEO, hardening, and testing run in their own phases below.

### Phase 3 — Hardening

Skills: `../seo/SKILL.md`, external `performance-optimization`,
external `security-and-hardening`, `../legal-compliance/SKILL.md`.
Gate: each skill's own completion criteria plus its own output file.

### Phase 4 — Verification

Skills: external `browser-testing-with-devtools`, external
`test-driven-development` for regression cases. Stage 10 flows (404/500, forms,
mobile) are defined in `stages.md` and `../final-quality-gate/checklist.md` §6.
Gate: all listed flows pass on staging; no open blocker.

### Phase 5 — Release

Skills: external `ci-cd-and-automation`, external `shipping-and-launch`, the
Stage 11 deployment checks in `stages.md`, then `../final-quality-gate/SKILL.md`.
Gate: PASS report plus user approval.

### Phase 6 — Operate

Skill: `../monitoring-maintenance/SKILL.md`.
Gate: analytics, error tracking, uptime checks, and a monthly maintenance
calendar exist and are owned.

## Checklist

- [ ] `docs/brief.md` exists and is approved.
- [ ] Project type and per-stage depth recorded in `docs/progress.md`.
- [ ] Dependency skills confirmed present, or the user got install commands.
- [ ] Only one stage skill loaded at a time (except approved parallel phases).
- [ ] Every important decision (brief, plan, scope change, irreversible action,
      legal sign-off, release) had explicit user approval; routine stages
      auto-advanced and are logged in `docs/progress.md`.
- [ ] `docs/progress.md` updated after each stage.
- [ ] `docs/plan.md` tasks each have an owner role and a measurable criterion.
- [ ] Handoff files exist for each delegated phase.
- [ ] `final-quality-gate` ran last and returned PASS.
- [ ] Maintenance handoff completed.

## Completion criteria

- All 13 stages are recorded as done in `docs/progress.md`, or explicitly
  skipped with a recorded reason.
- `docs/quality-gate.md` exists and reports PASS.
- The site is live on the production domain, or the user accepted a documented
  deferral.
- Maintenance ownership and the monthly calendar are recorded.
- No unresolved blocker remains in `docs/progress.md`.

## Output

- `docs/brief.md`, `docs/plan.md`, `docs/progress.md`
- `docs/handoffs/*.md`
- Stage outputs as named by each stage skill
- `docs/quality-gate.md` (written by the final gate)

## On failure

- Missing brief: run intake. Do not guess requirements.
- Missing dependency skill: print the install command, stop the stage, and ask
  the user to install it. Offer to continue with the remaining stages only when
  they are independent.
- Gate fails twice in a row: stop, report the failing criterion and evidence,
  and ask the user to choose between fixing scope, accepting a documented
  exception, or changing the plan. Record the decision.
- No terminal, browser, or network access: say so, give manual steps with exact
  checks, and mark the stage `blocked-manual` instead of `done`.
- Conflicting instructions from the user: restate both, ask one resolving
  question, and record the answer in `docs/progress.md`.
