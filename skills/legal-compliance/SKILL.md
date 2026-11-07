---
name: legal-compliance
description: Use when the user directly asks for legal or compliance work (privacy, cookies, KVKK/GDPR, terms of use). Produces a documented legal review package; it is not legal advice. For a full website build or redesign, use website-master first.
---

# Legal & Compliance

> **This list is not legal advice; have a lawyer approve it before publication.**
> It is an engineering checklist for what a website must contain and how to
> implement it. Every privacy policy, cookie notice, KVKK aydınlatma metni, and
> terms of use must be reviewed by a qualified lawyer in the applicable
> jurisdiction.

## Purpose

Make sure the site discloses what it collects, why, and for how long; obtains
valid consent where required; and publishes the policies a visitor and a
regulator expect. Produce `docs/legal-review.md` plus the policy pages, and
record whether a lawyer reviewed them.

Supporting files: `checklist.md` (jurisdiction matrix and page contents).

## Inputs

- `docs/brief.md`: jurisdictions, personal-data scope, payments, target users.
- The list of actual data flows: forms, analytics, cookies, third-party embeds,
  auth, payments, logs, email tools.
- Company legal identity: registered name, address, contact, representative.

## Steps

1. Inventory every data flow. For each: data category, purpose, legal basis,
   storage location, retention period, and the third parties that receive it.
   Include analytics, fonts, maps, video embeds, chat widgets, and CDNs.
2. Determine the applicable regimes from the brief: KVKK (Türkiye), GDPR (EU/
   EEA), UK GDPR, CCPA/CPRA (California), or none. Record each and its trigger.
3. Decide whether cookie consent is required: only strictly necessary cookies
   may load before consent under GDPR-style regimes. Implement a consent
   mechanism that blocks non-essential scripts until opt-in.
4. Draft or gather these pages:
   - Privacy policy / gizlilik politikası
   - Cookie policy and cookie settings
   - KVKK aydınlatma metni (if Turkish data subjects)
   - Terms of use / kullanım şartları
   - Impressum or company details if required by jurisdiction
   - Refund, shipping, and cancellation policy if selling
   - Accessibility statement if the site claims conformance
5. Implement the consent UI: granular categories, equal prominence for accept
   and reject, no pre-ticked boxes, easy withdrawal, and a persistent settings
   link.
6. Implement data-subject rights: access, correction, deletion, portability, and
   objection, with a contact channel and a stated response time.
7. Check forms: purpose stated at the point of collection, minimum fields,
   explicit consent where a legal basis requires it, and a link to the policy.
8. Check third-party embeds: no tracking scripts before consent; use
   privacy-preserving alternatives where possible.
9. Check retention: define a period per data category and a deletion mechanism.
10. Check security-adjacent obligations: breach notification path, processor
    agreements (DPA) for vendors, and a record of processing activities.
11. Write `docs/legal-review.md` in the user's language: each requirement,
    status (met / missing / needs counsel), and the owner.
12. Ask the user to have counsel review. Record the reviewer name and date, or
    record that review is pending.

## Checklist

- [ ] Data-flow inventory covers every form, cookie, and third-party script.
- [ ] Applicable jurisdictions identified with their trigger.
- [ ] Privacy policy published and linked from every page footer.
- [ ] Cookie policy published; consent banner blocks non-essential scripts.
- [ ] Consent has accept and reject with equal prominence; withdrawal possible.
- [ ] KVKK aydınlatma metni published when Turkish data subjects exist.
- [ ] Terms of use published when the site has accounts, payments, or UGC.
- [ ] Refund, shipping, and cancellation terms published for sales.
- [ ] Data-subject request channel and response time stated.
- [ ] Retention period defined per data category.
- [ ] Processor agreements exist for vendors that handle personal data.
- [ ] Breach notification path documented.
- [ ] No personal data in analytics URLs, logs, or error reports.
- [ ] Legal review by counsel recorded, or explicitly pending.

## Completion criteria

- `docs/legal-review.md` exists and lists every requirement with a status.
- Every required policy page is reachable from the footer and returns HTTP 200.
- A consent test shows that non-essential cookies are absent before opt-in and
  appear after it, and that rejection is honored on reload.
- No item is left "missing" without a written user acceptance.
- Counsel review is recorded, or the report states clearly that it is pending
  and the release gate treats that as a blocker for regulated projects.

## Output

- `docs/legal-review.md`
- Policy pages in the site source
- Consent component and its configuration
- `docs/data-flows.md` if the inventory is large enough to need its own file

## On failure

- The user has no company legal details: list exactly which fields are needed
  and mark the policy pages as drafts, not publishable.
- The jurisdictions are unclear: default to the strictest plausible regime and
  say so; do not silently choose the lightest.
- A consent vendor is requested: implement category mapping and verify blocking
  behavior; do not accept a banner that only logs clicks.
- Counsel review is unavailable before launch: state the risk in plain language,
  require explicit written acceptance, and flag it in the final gate.
- The user asks for legal advice: decline to give a legal opinion; provide the
  checklist and point to a qualified lawyer.
