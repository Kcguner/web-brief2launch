---
name: seo
description: Use when the user directly asks for an SEO audit or SEO improvements (titles, meta, sitemap, robots, canonical, Schema.org, Open Graph, Twitter Cards). For a full website build or redesign, use website-master first.
---

# SEO

## Purpose

Make the site crawlable, indexable, and correctly represented in search results
and social previews. Produce `docs/seo-report.md` with evidence for every claim.

Supporting files: `checklist.md` (full audit list), `reference.md` (snippets),
`scripts/audit.mjs` (automated checks).

## Inputs

- The site URL (staging or production) or the repository with built HTML.
- `docs/brief.md` for target keywords and audience.
- `docs/ia.md` for URL scheme and page inventory.
- Access to run a terminal. Without it, hand the user the manual steps.

## Steps

1. Run the automated audit from the user's project with
   `node <skill-folder>/scripts/audit.mjs --url https://example.com --out docs/seo-audit.json`.
   Installed skills live under `.agents/skills/<name>/`, so `<skill-folder>` is
   `.agents/skills/seo` (or this folder in a clone). With no network access, run
   it against a local build directory with `--dir ./dist --out docs/seo-audit.json`.
2. Read the JSON. Note every page with a missing or duplicated title,
   description, canonical, H1, or Open Graph tag.
3. Ground the keyword and search-gap analysis in real data. Ask the user for a
   CSV export from Google Search Console (Performance report) or Google Trends,
   or an analytics export; direct console access is not required. For every
   keyword, search-volume, or competition claim without a data source, write
   the label `assumption — not verified with data` next to it in
   `docs/seo-report.md`. Never invent search volumes. With no data at all,
   label the whole analysis as assumption and list obtaining the export as a
   manual step.
4. Check heading hierarchy: exactly one H1 per page, no skipped levels, headings
   used for structure not styling.
5. Check `robots.txt`: allows intended crawling, blocks admin and search-result
   pages, links the sitemap. The robots.txt policy for AI crawlers (GPTBot,
   ClaudeBot, PerplexityBot, Google-Extended) must be a recorded, deliberate
   user decision (allow or block, with a reason in `docs/seo-report.md`), never
   a silent default; see reference.md.
6. Check `sitemap.xml`: valid XML, only canonical 200-status URLs, no redirects
   or 404s, listed in `robots.txt`.
7. Check canonical tags: one per page, absolute, self-referencing unless a real
   duplicate exists.
8. Check Schema.org JSON-LD: `Organization` or `LocalBusiness` on the home page,
   `WebSite` with `SearchAction` if search exists, `Article` on posts,
   `Product` + `Offer` on product pages, `BreadcrumbList` on nested pages.
   Validate with a rich-results testing tool and record the result.
9. Check Open Graph and Twitter Card tags on every shareable page, with an image
   of at least 1200×630.
10. Check indexability: no accidental `noindex`, no `Disallow: /`, no soft 404s.
11. Check internal linking: no orphan pages, descriptive anchor text, no
    click-depth above three. In `--url` mode read `site.linkGraph` from the
    JSON: `orphans`, `inbound` counts, measured `depth`, and `navOnlyPages`.
    When `complete` is false, re-run with a higher `--max` or mark the check
    partial. Navigation/footer links are counted separately from contextual
    in-content links (`contextualInbound`): a page linked only from the footer
    still needs a contextual link where the content supports it. In `--dir`
    mode the graph is unavailable; check links manually.
12. Check language and region: `lang` attribute present; `hreflang` pairs are
    reciprocal and include `x-default` when multi-language.
13. Check redirects: one hop, 301 to the final canonical URL, HTTPS and
    host-normalized.
14. Write `docs/seo-report.md` in the user's language: findings by severity,
    the fix for each, and the evidence path.

## Checklist

- [ ] Keyword and volume claims cite a data source or carry the
      `assumption — not verified with data` label.
- [ ] Unique title (≤ 60 chars) and meta description (≤ 155 chars) per page.
- [ ] Exactly one H1 per page; no skipped heading levels.
- [ ] `robots.txt` valid, links the sitemap, does not block the site.
- [ ] `sitemap.xml` valid, canonical URLs only, referenced in `robots.txt`.
- [ ] Canonical tag present and self-referencing where appropriate.
- [ ] Schema.org JSON-LD present and validates without errors.
- [ ] Open Graph tags complete (`og:title`, `og:description`, `og:image`,
      `og:url`, `og:type`).
- [ ] Twitter Card tags complete (`twitter:card`, `twitter:title`,
      `twitter:description`, `twitter:image`).
- [ ] No unintended `noindex` or crawl blocks.
- [ ] Image `alt` text present and descriptive.
- [ ] Internal links: no orphans, descriptive anchors.
- [ ] `lang` set; `hreflang` reciprocal if multilingual.
- [ ] Redirects are single-hop 301s to canonical URLs.

## Completion criteria

- `docs/seo-report.md` exists with severity-tagged findings and evidence.
- Automated audit reports zero errors for title, description, canonical, H1, and
  Open Graph on indexable pages.
- `sitemap.xml` and `robots.txt` return HTTP 200 and are mutually consistent.
- Schema.org validation returns zero errors on the home, article, and product
  templates that exist.
- Every critical finding is fixed or explicitly accepted by the user with a
  written reason.

## Output

- `docs/seo-report.md`
- `docs/seo-audit.json` (machine-readable audit result)
- Fixed source files where the issue was code-level

## On failure

- No network access: run the audit with `--dir` on the build output, and list
  the live-only checks (redirects, status codes, robots.txt) as manual steps.
- No build directory either: give the user the checklist and the exact commands
  to run, and mark the stage `blocked-manual`.
- Site is behind auth or a CDN block: ask for a bypass token or a staging URL
  that allows the crawler. Do not report a false pass.
- Schema validation service unreachable: check the JSON syntax with the bundled
  check in `scripts/audit.mjs` (it runs `JSON.parse` only) and label structural
  and online validation as not performed.
- The site is client-rendered and the audit sees an empty shell: report
  rendering as a finding and re-run against a rendered snapshot.
- Record failures and lessons in `docs/ledger.md` per `../shared/ledger-rule.md`.
