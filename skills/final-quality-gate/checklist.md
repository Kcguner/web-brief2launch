# Release gate checklist (full)

> Not legal advice. Not a substitute for the stage reports. Each line needs an
> evidence path or a command output recorded next to it.

## 1. Structure and process

- [ ] `docs/brief.md`, `docs/plan.md`, `docs/progress.md` exist.
- [ ] `docs/ia.md`, `docs/design.md`, `docs/data-model.md` exist (backend may be
      an explicit skip for static sites).
- [ ] `docs/seo-report.md`, `docs/performance-report.md`,
      `docs/security-report.md` exist.
- [ ] `docs/legal-review.md`, `docs/test-report.md`, `docs/deployment.md`,
      `docs/monitoring.md` exist.
- [ ] Every stage in `docs/progress.md` is `done` or `skip` with a reason.
- [ ] Every important decision (brief, plan, scope change, irreversible action,
      legal sign-off, release) has a recorded approval; routine stages are logged
      as auto-advanced in `docs/progress.md`.
- [ ] No file is a stub: each has at least one measured result. A short but
      complete report is valid; an empty template with headings only is not.

## 2. SEO

- [ ] Unique title and meta description on every indexable page.
- [ ] One H1 per page; heading order valid.
- [ ] Canonical present and absolute; self-referencing where correct.
- [ ] `robots.txt` returns 200, allows the public site, links the sitemap.
- [ ] `sitemap.xml` returns 200, lists canonical URLs only.
- [ ] Open Graph and Twitter Card tags complete; image ≥ 1200×630.
- [ ] Schema.org JSON-LD parses and validates.
- [ ] No accidental `noindex` on public pages.
- [ ] Redirect map applied; single-hop 301s.
- [ ] `lang` set; `hreflang` reciprocal if multilingual.

## 3. Performance

- [ ] Mobile Lighthouse Performance ≥ 90.
- [ ] LCP < 2.5 s on a representative mobile run.
- [ ] CLS < 0.1.
- [ ] INP < 200 ms (or TBT proxy recorded with a note).
- [ ] Images served as WebP or AVIF with correct dimensions.
- [ ] Below-the-fold images lazy-loaded; the LCP image is not.
- [ ] CSS and JS minified and compressed.
- [ ] Fonts: limited families and weights, `font-display` set, preloaded where
      needed.
- [ ] No render-blocking third-party script on the critical path.
- [ ] Cache headers set for static assets and HTML.

## 4. Security

- [ ] HTTPS everywhere; HTTP redirects to HTTPS.
- [ ] HSTS present with a sensible max-age.
- [ ] Content-Security-Policy present and tested (no unsafe bypass left).
- [ ] `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
      `Permissions-Policy`, frame protection set.
- [ ] No critical or high dependency vulnerabilities.
- [ ] Secret scan clean across repo history and client bundle.
- [ ] Auth: password storage hashed with a modern algorithm, session lifetime
      bounded, logout invalidates.
- [ ] Authorization checked server-side per resource.
- [ ] Input validation on every boundary; output encoded.
- [ ] CSRF protection on state-changing requests.
- [ ] Parameterized queries only.
- [ ] Rate limits on auth, forms, and expensive endpoints.
- [ ] Error pages do not leak stack traces or internal paths.
- [ ] Admin and debug routes blocked from indexing and protected.

## 5. Legal

- [ ] Privacy policy published and linked in the footer.
- [ ] Cookie policy published; consent blocks non-essential scripts.
- [ ] Accept and reject have equal prominence; withdrawal works.
- [ ] KVKK aydınlatma metni published when Turkish data subjects exist.
- [ ] Terms of use published for accounts, payments, or user content.
- [ ] Refund, shipping, and cancellation terms published for sales.
- [ ] Data-subject request channel and response time stated.
- [ ] Counsel review recorded, or risk accepted in writing.
- [ ] No personal data in analytics URLs, logs, or error reports.

## 6. Testing

- [ ] Primary user journey passes end to end on the release candidate.
- [ ] Every form submits, validates, and shows success and error states.
- [ ] 404 page returns 404 and helps recovery.
- [ ] 500 page is controlled and does not leak internals.
- [ ] Mobile viewport tested at 360 px, 390 px, and 768 px.
- [ ] Keyboard-only navigation works through the main flow.
- [ ] Cross-browser spot check: two major browsers.
- [ ] No console errors on primary routes.
- [ ] Regression tests for fixed bugs exist and pass.

## 7. Accessibility (WCAG 2.1 AA spot check)

- [ ] Text contrast ≥ 4.5:1 (large text ≥ 3:1).
- [ ] Visible focus indicator on every interactive element.
- [ ] Images have alt text; decorative images use `alt=""`.
- [ ] Form fields have labels and error messages tied to the field.
- [ ] Page has one H1 and a logical landmark structure.
- [ ] No keyboard trap; skip link present.
- [ ] Motion respects `prefers-reduced-motion`.

## 8. Deployment

- [ ] DNS records correct; apex and `www` resolve consistently.
- [ ] Certificate valid for all hostnames; auto-renewal confirmed.
- [ ] Staging environment matches production configuration.
- [ ] Build is reproducible from a clean checkout.
- [ ] Pipeline runs tests and blocks on failure.
- [ ] Rollback procedure documented and rehearsed.
- [ ] Environment variables set in the host; none in the repo.
- [ ] Cache invalidation strategy documented.
- [ ] Maintenance or launch window agreed with the user.

## 9. Monitoring

- [ ] Uptime check live on home and conversion path; alert tested.
- [ ] Error tracking live with release tags; alert tested.
- [ ] Analytics live; primary conversion event verified.
- [ ] Certificate and domain expiry alerts enabled.
- [ ] Backup schedule confirmed; restore test dated.
- [ ] Maintenance calendar and owner recorded.
- [ ] Runbooks written for the common incidents.

## 10. Content

- [ ] No lorem ipsum, placeholder links, or draft copy in shipped pages.
- [ ] Prices, dates, contact details, and legal entity data are correct.
- [ ] Every link resolves; no 404 in the main navigation.
- [ ] Images optimized and licensed for use.
- [ ] Meta and social copy match the page intent.
- [ ] Accessibility statement accurate if one is published.

## Verdict rules

| Condition | Verdict |
|-----------|---------|
| Any `fail` | FAIL |
| Any `manual-required` not completed | FAIL |
| All items pass | PASS |
| All items pass except written `accepted-risk` items | PASS (with risks listed) |
