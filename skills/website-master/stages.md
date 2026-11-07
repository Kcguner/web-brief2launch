# Stage map — 13 stages

Read alongside `SKILL.md`. Routine stages auto-advance on a passing gate; the
orchestrator pauses only for the decision points listed in `SKILL.md` step 7
(missing dependency, brief/plan, scope change, double gate failure, irreversible
action, legal sign-off, release). Each stage names its skill, its depth by project type,
its output, and its gate. "ext:" means an external dependency skill; install it
from the commands in `../../README.md` or let `scripts/bootstrap.mjs` do it.
"optional ext:" never blocks a stage: when it is missing, the stage records the
fallback evidence in `docs/progress.md`.

| # | Stage | Skill (in repo / external) | Output | Gate (measurable) |
|---|-------|----------------------------|--------|-------------------|
| 0 | Intake & discovery | `../website-intake/SKILL.md` + ext: `brainstorming` | `docs/brief.md` | Brief approved by user |
| 1 | Planning & analysis | ext: `writing-plans`, `planning-and-task-breakdown` | `docs/plan.md` | Every task has owner role, files, and a verifiable criterion |
| 2 | Information architecture | `reference.md` §IA | `docs/ia.md` | Sitemap, nav model, URL scheme, and hierarchy recorded and consistent with the approved brief |
| 3 | UI/UX design | ext: `frontend-ui-engineering` + optional ext: `impeccable` | `docs/design.md` + `DESIGN.md` tokens | Responsive breakpoints defined; WCAG 2.1 AA contrast and focus states; every screen in the flow designed; when `impeccable` is installed, its `audit` runs and findings are resolved or recorded, otherwise the manual accessibility and design checklist evidence is recorded |
| 4 | Frontend development | ext: `frontend-ui-engineering`, `incremental-implementation` | working app | Build passes; component inventory matches design; no console errors on primary routes |
| 5 | Backend & data | ext: `api-and-interface-design` + `reference.md` §Backend | `docs/data-model.md` | Schema, auth, secrets, migrations, and backup plan documented and exercised |
| 6 | SEO | `../seo/SKILL.md` | `docs/seo-report.md` | Script and manual checks pass; see `../seo/SKILL.md` criteria |
| 7 | Performance | ext: `performance-optimization` | `docs/performance-report.md` | Lighthouse Performance ≥ 90 (mobile), LCP < 2.5 s, CLS < 0.1, INP < 200 ms |
| 8 | Security | ext: `security-and-hardening` | `docs/security-report.md` | Security headers present, no critical/high dependency findings, secret scan clean |
| 9 | Legal & compliance | `../legal-compliance/SKILL.md` | `docs/legal-review.md` | Privacy, cookie, KVKK/GDPR, terms pages published and linked; counsel sign-off recorded |
| 10 | Testing & QA | ext: `test-driven-development`, `browser-testing-with-devtools` | `docs/test-report.md` | Primary flows, 404/500, forms, and mobile viewport pass on staging |
| 11 | Deployment | ext: `ci-cd-and-automation`, `shipping-and-launch` | `docs/deployment.md` | DNS + SSL verified, staging→prod pipeline runs, rollback rehearsed |
| 12 | Monitoring & maintenance | `../monitoring-maintenance/SKILL.md` + ext: `observability-and-instrumentation` | `docs/monitoring.md` | Analytics, error tracking, uptime check live; monthly calendar owned |
| — | Release gate | `../final-quality-gate/SKILL.md` | `docs/quality-gate.md` | PASS + user approval |

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
