---
name: final-quality-gate
description: Use when a website is about to go live or the user asks whether a site is ready to publish. Merges every prior stage output into one PASS/FAIL release report at docs/quality-gate.md and blocks release on any critical failure.
---

# Final Quality Gate

## Purpose

Be the single release decision. Read every stage output, verify each completion
criterion independently, and produce one report: **PASS** or **FAIL**. This gate
does not trust a stage's self-assessment. It re-checks the evidence.

This is the last file in the set. Nothing ships without it.

Supporting files: `checklist.md` (full release checklist).

## Inputs

Required files, from `../website-master/stages.md`:

- `docs/brief.md`, `docs/plan.md`, `docs/progress.md`
- `docs/ia.md`, `docs/design.md`, `docs/data-model.md`
- `docs/seo-report.md`, `docs/performance-report.md`,
  `docs/security-report.md`
- `docs/legal-review.md`, `docs/test-report.md`, `docs/deployment.md`,
  `docs/monitoring.md`

Other inputs: the staging or production URL, deploy access, and a runnable
terminal. Without a capability, the gate marks the item `manual-required` and
cannot return PASS.

## Steps

1. Run the structural check from the repository root:
   `node skills/final-quality-gate/scripts/gate.mjs --docs ./docs --out docs/quality-gate.json`
   It reports missing files, empty templates, and unresolved markers.
2. Load `checklist.md`. Walk every item in order. Record one of:
   `pass`, `fail`, `manual-required`, `accepted-risk`.
3. Verify evidence, not prose. For each item, open the referenced report and
   confirm the number or artifact it claims. A claim without an artifact is a
   `fail`.
4. Re-run the live checks you can run: status codes on the main routes, security
   headers, robots and sitemap, Core Web Vitals on mobile, and the primary
   conversion flow in a browser.
5. Check legal status. If `docs/legal-review.md` says counsel review is pending,
   the item is `fail` for regulated projects and `accepted-risk` only with the
   user's written acceptance.
6. Check cross-stage contradictions: SEO report claims HTTPS but security
   reports mixed content; performance passes but the test report shows a
   time-out; IA lists pages that do not exist.
7. Score the outcome:
   - **PASS**: zero `fail`, and every `manual-required` was completed by the
     user with evidence, and every `accepted-risk` has a written acceptance.
   - **FAIL**: one or more `fail`, or an unresolved `manual-required`.
8. Write `docs/quality-gate.md` in the user's language. Lead with the verdict,
   then the blocker list, then the full table, then accepted risks, then manual
   steps still open.
9. Present the verdict and ask for explicit release approval. Approval is
   separate from PASS; PASS means eligible, approval means go.
10. On FAIL, hand the blocker list back to `../website-master/SKILL.md` for
    correction and re-run this gate after the fixes.

## Checklist

High-level gate items. The full list is in `checklist.md`.

- [ ] Every required stage output file exists and is non-empty.
- [ ] Every stage gate in `docs/progress.md` is `done` or a recorded `skip`.
- [ ] SEO: zero errors on titles, descriptions, canonicals, H1s, and social tags
      for indexable pages.
- [ ] Performance: mobile Lighthouse Performance ≥ 90, LCP < 2.5 s,
      CLS < 0.1, INP < 200 ms.
- [ ] Security: HTTPS and HSTS live, security headers present, no critical or
      high dependency findings, secret scan clean.
- [ ] Legal: required policy pages published and linked; counsel review recorded
      or release risk explicitly accepted in writing.
- [ ] Testing: primary flows, forms, 404, 500, and mobile viewport verified on
      the release candidate.
- [ ] Deployment: DNS and SSL verified, pipeline reproducible, rollback
      rehearsed and documented.
- [ ] Monitoring: uptime, errors, analytics, and backup restore verified with an
      owner and a tested alert.
- [ ] Accessibility: WCAG 2.1 AA spot check passes (keyboard, contrast, focus,
      alt text).
- [ ] No secrets in the repository, the client bundle, or error reports.
- [ ] No unresolved `TBD`, placeholder copy, or lorem ipsum in shipped pages.
- [ ] No cross-stage contradiction left unexplained.
- [ ] User gave explicit release approval after reading the report.

## Completion criteria

- `docs/quality-gate.md` exists with a verdict of PASS or FAIL and a dated
  evidence reference for every row.
- `docs/quality-gate.json` exists with machine-readable results.
- On PASS: release eligibility is stated, open accepted risks are listed with
  owner and expiry, and user approval is recorded.
- On FAIL: every blocker has a stage owner, a fix, and a re-check command.

## Output

- `docs/quality-gate.md` — the single release report
- `docs/quality-gate.json` — structured results
- A blocker list handed back to the orchestrator when the verdict is FAIL

Report structure:

```markdown
# Release Quality Gate

**Verdict: PASS | FAIL**  (generated <date>, commit <sha>)

## Blockers
## Stage results
| Stage | Output | Result | Evidence |
## Accepted risks
| Risk | Owner | Reason | Expiry |
## Manual steps still open
## Release approval
- Requested: <date>
- Approved by: <name / pending>
```

## On failure

- A required output is missing: FAIL with the file name and the stage that owns
  it. Do not reconstruct the missing work here.
- A file exists but has no evidence: FAIL. Ask the stage to attach a command
  output, a screenshot, or a metric.
- The gate cannot run live checks (no browser, network, or deploy access):
  mark those rows `manual-required`, list exact steps for the user, and do not
  return PASS until the user reports the result with evidence.
- The user asks to skip a blocker: record it as `accepted-risk` only with a
  written reason and an owner. Never silently downgrade a security, legal, or
  data-loss blocker.
- Contradictory evidence between stages: FAIL the item and name both reports.
  Ask for one authoritative re-check.
- This file was modified to make a failing site pass: that is a process
  violation. Report it and restore the criteria from version control.
