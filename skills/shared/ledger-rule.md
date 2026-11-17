# Shared ledger and safe-work rules

Support file for all 13 stages, including stages run by external dependency
skills. Referenced from `../website-master/stages.md`. This is not a skill.

## Ledger rule

- One shared file for the whole project: `docs/ledger.md`. Every stage appends
  to this one file. Never create per-stage ledgers.
- Create the file at stage 0, before any work. The release gate fails on a
  missing or empty ledger.
- Line format: `- YYYY-MM-DD | stage N | action | error (verbatim) | lesson`.
- Failures, errors, and lessons get entries: a failed command, a failed gate,
  a wrong assumption, a fix that took two tries. Quote the error text verbatim
  so a later stage can search for it. A stage with no failures records one
  line: `- YYYY-MM-DD | stage N | no failures | — | —`.
- Successes stay in `docs/progress.md`; do not duplicate them here.
- Before starting a stage, skim the ledger for lessons from earlier stages.

Example:

```text
- 2026-01-15 | stage 6 | ran SEO audit on staging | Error: duplicate title on /about | use one title template per page type
- 2026-01-16 | stage 11 | rehearsed rollback | Error: missing env var DB_URL | list required env vars in the deploy runbook
```

## Safe-work rules

- Before a bulk edit (a shared template, or more than five pages in one pass),
  create a git branch or a file backup first.
- Never rewrite many URLs or meta tags in one unreviewed pass. Batch the
  change, verify one batch (e.g. with `../seo/scripts/audit.mjs`), then
  continue with the next batch.
- Deploy always needs explicit recorded human approval; see
  `../website-master/SKILL.md` step 7.