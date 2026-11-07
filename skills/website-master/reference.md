# Reference — Information Architecture and Backend/Data

Stage checklists that the dependency skill packs do not cover. Load only the
section for the current stage. Skip the backend section entirely for a static
site and record the reason in `docs/progress.md`.

## Information architecture (Stage 2)

Output: `docs/ia.md`.

### Steps

1. List every page and section from the approved brief.
2. Group pages into a hierarchy with at most three levels for a marketing site
   and at most four for documentation or e-commerce.
3. Design the navigation model: primary nav (≤ 7 items), secondary nav, utility
   nav, footer nav.
4. Define the URL scheme: lowercase, hyphen-separated, stable, no file
   extensions, no dates unless the content is dated.
5. Map internal links: every page reachable within three clicks of the home
   page.
6. Define breadcrumb rules for nested sections.
7. Define the taxonomy for tags, categories, or filters if the site has many
   items (blog, catalog).
8. Produce a sitemap diagram as a Markdown list and a page-inventory table.

### Checklist

- [ ] Every brief page has a place in the hierarchy.
- [ ] Primary nav has 7 items or fewer.
- [ ] URL scheme documented with at least three examples per content type.
- [ ] No orphan pages: every page has an inbound internal link.
- [ ] Depth from home ≤ 3 clicks (≤ 4 for docs/catalog).
- [ ] Breadcrumb rule defined for nested content.
- [ ] Page inventory lists: URL, title, purpose, primary CTA, parent.
- [ ] 301 redirect map drafted if an existing site is being replaced.
- [ ] Sitemap matches the pages that will actually ship.

### Completion criteria

`docs/ia.md` contains hierarchy, nav model, URL scheme, page inventory, and (if
applicable) the redirect map, and the user approved it. No page in the inventory
lacks a URL and a parent.

## Backend and data (Stage 5)

Output: `docs/data-model.md`.

### Steps

1. List the entities and their relationships. Draw them as a text or a plain
   entity-relationship diagram in Markdown.
2. Define fields, types, nullability, defaults, and uniqueness per entity.
3. Define indexes for every query the UI needs.
4. Choose the auth model (none, session, token, OAuth) and the session lifetime.
5. Define authorization rules per role and per endpoint. Default to deny.
6. Define environment variables and where each secret lives. Never in the repo.
7. Plan migrations: forward and rollback for each change, and how to run them
   safely on production data.
8. Define the backup policy: frequency, retention, restore test interval.
9. Define input validation at every boundary and the error response shape.
10. Define rate limits for auth, forms, and any expensive endpoint.

### Checklist

- [ ] Entity list with relationships and cardinality.
- [ ] Every field has a type and a nullability decision.
- [ ] Indexes exist for every hot query path.
- [ ] Auth model chosen and session lifetime stated.
- [ ] Authorization matrix: role × resource × action.
- [ ] Secrets listed by name only, with the storage location, never the value.
- [ ] `.env.example` lists every required variable with no real values.
- [ ] Migration plan has a tested rollback step.
- [ ] Backup frequency and restore test recorded.
- [ ] Validation and error shape documented.
- [ ] Rate limits defined for auth and public forms.
- [ ] SQL/ORM usage parameterized; no string-built queries.

### Completion criteria

`docs/data-model.md` covers entities, auth, authorization, secrets, migrations,
backups, validation, and rate limits. A restore from backup was performed at
least once on a non-production environment and its result is recorded.
