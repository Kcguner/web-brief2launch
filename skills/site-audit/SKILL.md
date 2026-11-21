---
name: site-audit
description: Use when the user asks to audit an existing website or repository for missing pieces and errors without building or redesigning it (e.g. "site audit", "audit this site", "check my site for problems", "site denetimi", "eksik ve hataları bul", "sitemde neler eksik"). Read-only; runs the SEO audit script plus a quick technical sweep and writes one severity-ranked report; fixes start only after explicit approval. For a full build, redesign, or relaunch, use website-master first.
---

# Site Audit

## Purpose

Find gaps and errors in an existing site or repository, without building or
redesigning it. Produce `docs/site-audit.md`: one severity-ranked report with
evidence for every finding. This skill is a router: it runs the existing
checks from the stage skills and collects their results. It never
reimplements their rules and never modifies project source files.

## Inputs

- The repository path, the live URL, or both. Both is best: the URL enables
  live checks, the repository enables source-level findings.
- A runnable terminal. A browser is optional and only adds the console check.
- No brief is required. If the user wants fixes, a redesign, or a relaunch,
  hand off to `../website-master/SKILL.md` after the report is approved.

## Steps

1. **Confirm the target.** Record the repository path, URL, and audit mode
   (url, dir, or both) in the report header. Write only under `docs/`; treat
   every project source file as read-only. Create `docs/ledger.md` per
   `../shared/ledger-rule.md` before starting.
2. **Identify the stack and build output.** Read `package.json` scripts and
   framework config. Repository-only target with no built HTML: run the
   project's own build command (build artifacts are the only allowed side
   effect). A failing build is an error finding, not something to fix here.
3. **SEO, full depth.** Run
   `node <skills-dir>/seo/scripts/audit.mjs --url <site> --out docs/seo-audit.json`
   (prefer the live URL). Without network or a live URL, use
   `--dir <build-dir>`. Then follow the manual steps in `../seo/SKILL.md`
   (JavaScript-off check, keyword data or assumption labels, schema
   validation, heading and link review). Its rules stay the single source of
   truth; copy findings into the report, do not restate the rules.
4. **Security headers (live URL only).** Run `curl -sI <url>` and check the
   HTTP-to-HTTPS redirect, HSTS, Content-Security-Policy,
   `X-Content-Type-Options`, `Referrer-Policy`, and frame protection. Grade
   missing headers against `../final-quality-gate/checklist.md` §4. Without a
   URL, list the exact command as a manual step.
5. **Dependencies.** With a lockfile present, run `npm audit --omit=dev` (or
   the project's package-manager equivalent). Critical or high findings are
   errors. Without a lockfile, record the check as not performed.
6. **Links and structure.** From the audit's `site.linkGraph` (url mode) or a
   manual spot check (dir mode): orphan pages, broken internal links,
   click-depth. Check the 404 page: request a nonexistent URL (live) or
   confirm a 404 template exists (dir).
7. **Console check (optional).** With a browser available, open the home page
   and one nested page and record console errors. Without a browser, mark
   the check not performed; do not claim it ran.
8. **Write `docs/site-audit.md`** in the user's language: target and mode
   header, findings by severity (error, warning, info) each with an evidence
   path or command output, a "not performed" list with reasons and exact
   manual steps, and a suggested fix order. Apply no fixes.
9. **Record the ledger.** Append failures and lessons to `docs/ledger.md`;
   a clean run records a no-failures line.
10. **Ask for the fix decision.** Offer: fix now (direct fixes or handoff to
    `../website-master/SKILL.md`), or stop at the report. Start fixes only
    after explicit approval, and record the decision in the report.

## Checklist

- [ ] `docs/site-audit.md` exists; every finding has a severity and evidence.
- [ ] SEO audit ran and `docs/seo-audit.json` exists, or the reason it could
      not run is recorded.
- [ ] Keyword claims cite a data source or carry the assumption label.
- [ ] Live-only checks are listed as manual steps when no URL was audited.
- [ ] Every check either ran with evidence or is listed as not performed
      with a reason and a manual step.
- [ ] No project source file was modified; only `docs/` outputs were written.
- [ ] `docs/ledger.md` updated.
- [ ] The fix decision (approved, declined, or deferred) is recorded.

## Completion criteria

- `docs/site-audit.md` exists with severity-tagged findings and evidence, or
  an explicit no-findings result naming every check that ran.
- `docs/seo-audit.json` exists, or the SEO step is `blocked-manual` with the
  exact commands for the user.
- No project source file changed (verify with the repository's status
  command when it is a git checkout).
- The user received the report and the fix decision is recorded.

## Output

- `docs/site-audit.md`
- `docs/seo-audit.json` (from the SEO audit script)
- `docs/ledger.md` entries

## On failure

- Build fails: record the error verbatim, continue with source-level checks,
  and do not fix the build without approval.
- No network access: run the SEO audit with `--dir` and list live-only
  checks (headers, redirects, HTTP statuses) as manual steps.
- Site behind auth or a CDN block: ask for a staging URL or bypass token.
  Do not report a false pass.
- No terminal: give the user the exact commands and mark the affected
  checks `blocked-manual`.
- Record failures and lessons in `docs/ledger.md` per `../shared/ledger-rule.md`.