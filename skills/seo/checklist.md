# SEO audit checklist (extended)

Load when the audit finds many issues or the user asks for a full technical SEO
review. Tick each item with the evidence path next to it.

## Crawl and indexation

- [ ] `robots.txt` returns 200 and is not an HTML error page.
- [ ] `User-agent: *` block allows the public site.
- [ ] `Sitemap:` line points to the absolute sitemap URL.
- [ ] No `Disallow: /` left from staging.
- [ ] XML sitemap returns 200 with `Content-Type` containing `xml`.
- [ ] Sitemap contains only canonical, indexable, 200-status URLs.
- [ ] No `noindex` meta tag on pages that must rank.
- [ ] `X-Robots-Tag` headers do not block public assets accidentally.
- [ ] Pagination uses real links, not infinite scroll only.
- [ ] Faceted or filtered URLs are canonicalized or blocked deliberately.
- [ ] Staging is protected and not indexed.
- [ ] `hreflang` and `canonical` do not contradict each other.

## On-page

- [ ] Title unique per page, primary keyword early, brand at the end.
- [ ] Meta description unique and action-oriented.
- [ ] One H1, matching the page intent.
- [ ] H2/H3 form a logical outline.
- [ ] Primary content is in the HTML source, not injected after load.
- [ ] Images have descriptive `alt`; decorative images use empty `alt`.
- [ ] Descriptive anchor text; no "click here".
- [ ] No thin or duplicate pages in the index.

## Structured data

- [ ] `Organization` or `LocalBusiness` with name, url, logo, sameAs.
- [ ] `WebSite` with `potentialAction` when site search exists.
- [ ] `BreadcrumbList` matches the visible breadcrumb.
- [ ] `Article` with author, datePublished, dateModified on posts.
- [ ] `Product` with `offers`, price, currency, availability on products.
- [ ] `FAQPage` only where the Q&A is visible on the page.
- [ ] All JSON-LD parses and has no `@type` mismatches.

## Social

- [ ] `og:title`, `og:description`, `og:image`, `og:url`, `og:type`.
- [ ] `og:image` ≥ 1200×630, absolute URL, under 5 MB.
- [ ] `twitter:card`, `twitter:title`, `twitter:description`,
      `twitter:image`.
- [ ] Preview renders correctly in a link debugger.

## Performance-adjacent SEO

- [ ] Mobile-friendly viewport meta present.
- [ ] No intrusive interstitials on entry.
- [ ] Core Web Vitals pass (hand this item to the `performance-optimization`
      dependency skill; see `../website-master/stages.md` Stage 7).
- [ ] HTTPS everywhere; no mixed content.

## Content and keywords

- [ ] One primary intent per page; no keyword cannibalization.
- [ ] Internal links use relevant anchor text.
- [ ] Titles and descriptions match search intent.
- [ ] Redirect map from any old site covers every old URL.
- [ ] 404 page helps the visitor recover.
