# Stage map — 13 stages

Read alongside `SKILL.md`. Routine stages auto-advance on a passing gate; the
orchestrator pauses only for the decision points listed in `SKILL.md` step 7
(missing dependency, brief/plan, scope change, double gate failure, irreversible
action, legal sign-off, release). Each stage names its skill, its depth by project type,
its output, and its gate. "ext:" means an external dependency skill; install it
with the pinned command that `scripts/bootstrap.mjs` prints for it, or let the
bootstrap run it. "optional ext:" never blocks a stage: when it is missing, the
stage records the fallback evidence in `docs/progress.md`.

| # | Stage | Skill (in repo / external) | Output | Gate (measurable) |
|---|-------|----------------------------|--------|-------------------|
| 0 | Intake & discovery | `../website-intake/SKILL.md` + ext: `brainstorming` | `docs/brief.md` | Brief approved by user |
| 1 | Planning & analysis | ext: `writing-plans`, `planning-and-task-breakdown` | `docs/plan.md` | Every task has owner role, files, and a verifiable criterion |
| 2 | Information architecture | `reference.md` §Information architecture (Stage 2) | `docs/ia.md` | Sitemap, nav model, URL scheme, and hierarchy recorded and consistent with the approved brief |
| 3 | UI/UX design | ext: `frontend-ui-engineering` + optional ext: `impeccable` | `docs/design.md` + `DESIGN.md` tokens | Responsive breakpoints defined; WCAG 2.1 AA contrast and focus states; every screen in the flow designed; when `impeccable` is installed, its `audit` runs and findings are resolved or recorded, otherwise the manual accessibility and design checklist evidence is recorded |
| 4 | Frontend development | ext: `frontend-ui-engineering`, `incremental-implementation` | working app + `docs/frontend-report.md` | Build passes; component inventory matches design; no console errors on primary routes |
| 5 | Backend & data | ext: `api-and-interface-design` + `reference.md` §Backend and data (Stage 5) | `docs/data-model.md` | Schema, auth, secrets, migrations, and backup plan documented and exercised |
| 6 | SEO | `../seo/SKILL.md` | `docs/seo-report.md` | Script and manual checks pass; see `../seo/SKILL.md` criteria |
| 7 | Performance | ext: `performance-optimization` | `docs/performance-report.md` | Lighthouse Performance ≥ 90 (mobile), LCP < 2.5 s, CLS < 0.1, INP < 200 ms |
| 8 | Security | ext: `security-and-hardening` | `docs/security-report.md` | Security headers present, no critical/high dependency findings, secret scan clean |
| 9 | Legal & compliance | `../legal-compliance/SKILL.md` | `docs/legal-review.md` | Privacy, cookie, KVKK/GDPR, terms pages published and linked; counsel sign-off recorded |
| 10 | Testing & QA | ext: `test-driven-development`, `browser-testing-with-devtools` | `docs/test-report.md` | Primary flows, 404/500, forms, and mobile viewport pass on staging |
| 11 | Deployment | ext: `ci-cd-and-automation`, `shipping-and-launch` | `docs/deployment.md` | DNS + SSL verified, staging→prod pipeline runs, rollback rehearsed |
| 12 | Monitoring & maintenance | `../monitoring-maintenance/SKILL.md` + ext: `observability-and-instrumentation` | `docs/monitoring.md` | Analytics, error tracking, uptime check live; monthly calendar owned; a test alert delivered and acknowledged; a backup restore test dated |
| — | Release gate | `../final-quality-gate/SKILL.md` | `docs/quality-gate.md` | PASS + user approval |

## Phase to stage map

`SKILL.md` groups work into phases. Stage numbers are finer, so the two systems
never share a number meaning. Use this map.

| Phase | Name | Stages |
|-------|------|--------|
| 0 | Intake | 0 |
| 1 | Plan | 1 |
| 2 | Phased delegation | 2–5 |
| 3 | Hardening | 6–9 |
| 4 | Verification | 10 |
| 5 | Release | 11 + release gate |
| 6 | Operate | 12 |

## Report file structure

Every mechanical stage report uses the same three headings, in the user's
language: `## What ran`, `## Results`, and `## Evidence` (commands, output
excerpt, date). This applies to `docs/frontend-report.md` (Stage 4),
`docs/performance-report.md` (Stage 7), `docs/security-report.md` (Stage 8),
`docs/test-report.md` (Stage 10), and `docs/monitoring.md` (Stage 12).

## `docs/progress.md` format

`../final-quality-gate/scripts/gate.mjs` parses only these patterns:

- One line `Project type: <type>`, matched by exact token: `static`,
  `portfolio`, `brochure`, `blog`, or `web app`. A composite phrase such as
  `Next.js static export` is not the `static` type. For `static`, `portfolio`,
  `brochure`, and `blog`, `docs/data-model.md` is optional; every other type
  must provide it.
- Stage status lines, one per stage: `status: done`, `status: in progress`,
  `status: pending`. The gate fails the structure on `status: blocked`,
  `status: blocked-manual`, `status: fail`, and `status: failed`. Only lines
  that start with `status:` (an optional list marker allowed) are read; a
  Markdown table column named Status is ignored.
- Checkboxes. Every unchecked item fails the gate: `- [ ]`, `* [ ]`, `+ [ ]`,
  and `1. [ ]` all count. Write `- [x]` for finished items.
- No unresolved markers anywhere in `docs/`: `TBD`, `TODO:`, `PLACEHOLDER`,
  `FIXME`, `XXX:`, `lorem ipsum` (case-insensitive). Fenced code blocks are
  skipped, so a report may quote a marker inside ``` without failing.

Minimal example:

```markdown
# Progress

Project type: web app

- Stage 0 Intake — status: done — evidence: docs/brief.md
- Stage 1 Planning — status: in progress — evidence: docs/plan.md

- [x] Brief approved
```

## Depth by project type

| Stage | Portfolio / brochure | Blog | Corporate | SaaS | E-commerce |
|-------|---------------------|------|-----------|------|------------|
| 1 Planning | light | light | standard | full | full |
| 2 IA | light | standard | standard | full | full |
| 3 UI/UX | standard | standard | standard | full | full |
| 4 Frontend | standard | standard | standard | full | full |
| 5 Backend | skip (static) | light (CMS) | light (CMS) | full | full |
| 6 SEO | full | full | full | full | full |
| 7 Performance | full | full | full | full | full |
| 8 Security | standard | standard | standard | full | full |
| 9 Legal | standard | standard | full | full | full |
| 10 Testing | light (smoke) | light | standard | full | full |
| 11 Deployment | standard | standard | standard | full | full |
| 12 Monitoring | light | light | standard | full | full |

"full" = apply the skill as written. "standard" = all checklist items except
those marked optional. "light" = smoke-level checks and a written rationale for
anything skipped. "skip" = record the reason in `docs/progress.md`.

Project types not listed (documentation, community, market, other): pick the
closest column, apply it, and record which column you chose and why in
`docs/progress.md`. Do not leave the depth undefined.

## Priority when skills conflict

1. Security and legal constraints override design and performance wishes.
2. Accessibility (WCAG 2.1 AA) overrides visual preference.
3. The approved brief overrides mid-project feature requests until the user
   re-approves a scope change.
4. Measured evidence overrides opinion. A gate passes only on evidence.
5. `final-quality-gate` overrides every stage's self-assessment.

## Parallel-phase rules

- Safe to parallelize: design exploration, content drafting, SEO research,
  test authoring in separate files.
- Never parallelize: two writers on the same file, migration plus schema change,
  deploy plus DNS change.
- Every parallel phase ends with one reviewer pass and one merged handoff file.
