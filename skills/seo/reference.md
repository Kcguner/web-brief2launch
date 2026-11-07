# SEO reference — snippets

Copy-paste starting points. Adapt to the framework in use; never add a
third-party SEO plugin without the user's consent.

## Base head template

```html
<title>Primary keyword — Brand</title>
<meta name="description" content="One sentence with the primary intent and a reason to click.">
<link rel="canonical" href="https://example.com/page">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta property="og:type" content="website">
<meta property="og:url" content="https://example.com/page">
<meta property="og:title" content="Primary keyword — Brand">
<meta property="og:description" content="Same intent as the meta description.">
<meta property="og:image" content="https://example.com/og/page.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Primary keyword — Brand">
<meta name="twitter:description" content="Same intent as the meta description.">
<meta name="twitter:image" content="https://example.com/og/page.png">
```

## robots.txt

```txt
User-agent: *
Allow: /

# Keep private and low-value areas out of the index.
Disallow: /admin/
Disallow: /api/
Disallow: /search

Sitemap: https://example.com/sitemap.xml
```

## sitemap.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-01-15</lastmod>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2026-01-15</lastmod>
  </url>
</urlset>
```

Rules: absolute URLs, canonical only, no `priority` or `changefreq` (ignored by
major engines), split at 50,000 URLs or 50 MB.

## Organization JSON-LD

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Example Ltd",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "sameAs": [
    "https://www.linkedin.com/company/example",
    "https://github.com/example"
  ]
}
</script>
```

## Article JSON-LD

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article title",
  "datePublished": "2026-01-15",
  "dateModified": "2026-02-01",
  "author": { "@type": "Person", "name": "Author Name" },
  "image": ["https://example.com/og/article.png"],
  "mainEntityOfPage": "https://example.com/blog/article"
}
</script>
```

## Product JSON-LD

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product name",
  "image": ["https://example.com/img/product.jpg"],
  "description": "Short factual description.",
  "sku": "SKU-1",
  "brand": { "@type": "Brand", "name": "Brand" },
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/product",
    "priceCurrency": "USD",
    "price": "49.00",
    "availability": "https://schema.org/InStock"
  }
}
</script>
```

## Breadcrumb JSON-LD

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com/" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://example.com/blog" }
  ]
}
</script>
```

## hreflang set

```html
<link rel="alternate" hreflang="en" href="https://example.com/en/page">
<link rel="alternate" hreflang="tr" href="https://example.com/tr/page">
<link rel="alternate" hreflang="x-default" href="https://example.com/page">
```

Every language version must list all the others, including itself.

## Redirect rules

- One 301 per old URL, straight to the final destination.
- Preserve the path when the structure is unchanged.
- Map every URL from the old sitemap and analytics, not just the top pages.
- Remove the redirect only after search engines have processed it.

## Title and description length

Aim for 50–60 characters in titles and 120–155 in descriptions. Measure with
`node -e "console.log('text'.length)"`. Do not truncate mid-word by hand; write
shorter copy.
