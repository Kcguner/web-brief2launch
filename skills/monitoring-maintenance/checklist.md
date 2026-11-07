# Monitoring and maintenance checklist (extended)

## Monthly routine

- [ ] Apply dependency updates; run the test suite; deploy through the pipeline.
- [ ] Review error tracker: new errors, error rate, top affected releases.
- [ ] Review uptime report: incidents, duration, false positives.
- [ ] Broken-link scan on the main navigation and conversion paths.
- [ ] Check certificate expiry (≥ 30 days remaining) and domain expiry (≥ 60).
- [ ] Review analytics: traffic sources, conversion rate, drop-off pages.
- [ ] Review search performance: impressions, clicks, index coverage errors.
- [ ] Restore-test the backup on a non-production environment (quarterly is the
      minimum; monthly is better for transactional sites).
- [ ] Review storage and cost trend.
- [ ] Confirm consent banner still blocks non-essential cookies.

## Quarterly routine

- [ ] Re-run the performance audit; compare against the launch baseline.
- [ ] Accessibility spot check with keyboard navigation and a screen reader.
- [ ] Security review: headers, dependency findings, access list, secret scan.
- [ ] Review user feedback and support tickets for recurring problems.
- [ ] Content freshness: outdated prices, dates, team pages, policies.
- [ ] Review and rotate any credentials older than the policy period.
- [ ] Update the runbooks with anything learned from incidents.

## Annual routine

- [ ] Renew domain and certificates ahead of expiry.
- [ ] Re-audit legal pages against current law and actual data flows.
- [ ] Refresh design and brand assets if they drifted.
- [ ] Review hosting and vendor contracts and costs.
- [ ] Full disaster-recovery rehearsal.

## Alert design rules

- Alert on symptoms users feel: site down, error spike, checkout failing, LCP
  regression. Do not alert on every metric movement.
- Every alert has an owner, a channel, and a documented first action.
- Test each alert once after creation and after any routing change.
- Keep a severity scale: page-now, next business day, weekly digest.
- Avoid alert fatigue: one channel per severity, not per tool.

## Runbook template

```markdown
# Incident: <name>

## Detect
How the alert appears and what it means.

## Assess
Commands or checks to confirm severity and blast radius.

## Act
Step-by-step recovery. Include the rollback command.

## Verify
How to confirm the site is healthy again.

## Communicate
Who to notify and what to say.

## Follow up
What to record and what to fix so it cannot recur.
```

## Data hygiene

- Do not send personal data to analytics or error tools.
- Scrub URLs, query strings, and form values before they reach error reports.
- Set retention on logs and analytics to the period in the privacy policy.
- Keep the consent decision attached to any client-side event.

## Ownership table

| Area | Tool | Owner | Alert channel | Severity |
|------|------|-------|---------------|----------|
| Uptime | | | | page-now |
| Errors | | | | page-now |
| Performance | | | | weekly |
| Security | | | | next business day |
| Backups | | | | weekly |
| Analytics | | | | monthly |
