---
name: monitoring-maintenance
description: Use when the user directly asks for post-launch monitoring, analytics, error tracking, uptime checks, or a maintenance calendar. Produces docs/monitoring.md. For a full website build or redesign, use website-master first.
---

# Monitoring & Maintenance

## Purpose

Know when the site is broken, slow, or losing traffic, and keep it healthy with
a repeatable monthly routine. Produce `docs/monitoring.md` and a maintenance
calendar the user owns.

Supporting files: `checklist.md` (monthly and quarterly routines).

## Inputs

- Production URL and hosting account access.
- `docs/brief.md` for the success metric.
- `docs/deployment.md` for environments and rollback procedure.
- The user's budget and privacy constraints.

## Steps

1. **Analytics.** Choose one tool. Prefer a privacy-friendly option when the
   brief requires consent-light tracking; otherwise use the user's existing
   tool. Define events for the primary action and the two secondary actions.
   Verify data arrives in real time.
2. **Error tracking.** Enable runtime error capture on the client, and server
   error logs where a backend exists. Group by release version. Set one alert
   for a new error type and one for an error-rate spike.
3. **Uptime.** Add an external check on the home page and the primary
   conversion path, every 1–5 minutes, from at least two regions. Set alert
   channels. Add a status page only if the site has SLA-bearing users.
4. **Performance watch.** Enable real-user Core Web Vitals reporting if the
   analytics tool supports it, or add a synthetic check weekly. Record LCP, CLS,
   and INP thresholds from the performance report.
5. **SEO watch.** Track index status, sitemap errors, and a small set of target
   queries monthly.
6. **Security watch.** Enable dependency alerts, certificate-expiry alerts, and
   a monthly secret scan.
7. **Backups.** Confirm schedule, retention, and a restore test date. Record the
   last successful restore.
8. **Maintenance calendar.** Build a monthly list: dependency updates, backup
   restore test, broken-link scan, analytics review, error review, certificate
   and domain expiry check, content freshness pass. Add a quarterly review:
   accessibility spot check, performance re-audit, security review, cost review.
9. **Runbooks.** Write short procedures for: site down, certificate expired,
   deploy rollback, spam or abuse, data breach first response.
10. **Ownership.** Name the person responsible for each alert and the escalation
    path. Without an owner, monitoring is decoration.

## Checklist

- [ ] One analytics tool installed; primary conversion event verified.
- [ ] Error tracking captures client and server errors with release tags.
- [ ] Uptime check on home and conversion path, two regions, alert tested.
- [ ] Certificate and domain expiry alerts enabled.
- [ ] Real-user or weekly synthetic Core Web Vitals tracking live.
- [ ] Dependency vulnerability alerts enabled.
- [ ] Backups scheduled and a restore test performed and dated.
- [ ] Monthly maintenance calendar written with owners.
- [ ] Quarterly review items scheduled.
- [ ] Runbooks written for the five common incidents.
- [ ] Alert routing tested end to end (a real notification was received).
- [ ] Privacy review: analytics respects consent settings.

## Completion criteria

- `docs/monitoring.md` exists and names the tool, owner, and alert channel for
  analytics, errors, uptime, performance, security, and backups.
- A test alert was delivered to a human and acknowledged.
- A restore from backup succeeded on a non-production environment and the date
  is recorded.
- The monthly calendar covers the next three months with owners.
- No monitoring item depends on a tool the user has not authorized.

## Output

- `docs/monitoring.md`
- `docs/runbooks/*.md` for incident procedures
- Configuration in the chosen tools

## On failure

- The user has no budget for paid monitoring: propose free tiers and local
  alternatives, and state their limits (retention, regions, alert delay).
- No access to hosting or DNS: give the exact checks to run and mark the stage
  `blocked-manual`; do not claim alerts are live.
- Analytics blocked by consent settings: confirm this is intended and record the
  measurement gap. Do not bypass consent to collect data.
- Restore test impossible: record the reason, escalate it as a launch risk, and
  keep the backup policy as unverified.
- Alert delivery cannot be tested: leave the item open and name the person who
  will confirm it.
