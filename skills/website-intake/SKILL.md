---
name: website-intake
description: Use when the user directly asks for intake or brief creation for a website project and no approved brief exists yet. Turns a vague request into docs/brief.md through a short, grouped question bank with recommended defaults. For general website build or redesign requests, use website-master first.
---

# Website Intake

## Purpose

Collect the minimum information needed to plan a website without interrogating
the user. Produce an approved `docs/brief.md` that every later stage reads.

This skill is the entry to Phase 0 of `../website-master/SKILL.md`. It pairs with
the external `brainstorming` skill: use this skill for structured facts, use
brainstorming for open-ended exploration of goals and trade-offs.

## Inputs

- The user's request, in any level of detail.
- Any existing site URL, repository, brand materials, or analytics exports the
  user provides.
- Answers from the question bank below.

## Steps

1. Read the request and list what is already known. Do not re-ask a known fact.
2. Ask the question bank in groups of 5–7 questions maximum. Never ask all
   groups at once. Prefer one round at a time and adapt the next round to the
   previous answers.
3. For every question, attach a recommended default and a one-line reason. Offer
   a "you decide" option so the user can delegate the choice.
4. If the user answers "you decide", record the recommended default in the brief
   and mark it `decided-by-agent: true`.
5. Detect the project type from the answers: portfolio, e-commerce, SaaS, blog,
   corporate, documentation, community, or other. Record it verbatim.
6. Fill the brief template. Keep it under two pages.
7. Run the open-ended exploration with the external `brainstorming` skill if it
   is available. Fold its conclusions into the brief; do not create a second
   competing document.
8. Ask the user to approve the brief. Do not start planning before approval.

### Question bank

**Group A — Goal and audience**
1. What must the site achieve in the next 6–12 months? (default: one primary
   goal plus two secondary goals; reason: priorities drive every trade-off)
2. Who is the primary visitor, and what do they need in the first 10 seconds?
   (default: describe one primary persona; reason: prevents design by committee)
3. What is the single most important action a visitor should take? (default: one
   primary call to action; reason: competing CTAs lower conversion)
4. What does success look like numerically? (default: one metric with a target;
   reason: later stages need a measurable baseline)

**Group B — Site type and scope**
5. Which type fits best: portfolio, e-commerce, SaaS, blog, corporate,
   documentation, community, other? (default: inferred from answers; reason:
   the orchestrator weights stages by type)
6. Which pages or sections are required at launch? (default: home, primary
   service or product page, about, contact, legal pages; reason: launch scope)
7. What is explicitly out of scope for version one? (default: accounts,
   personalization, multi-language; reason: prevents scope creep)
8. Is content ready, or must the project include copywriting and imagery?
   (default: assume content is not ready; reason: content blocks launch)

**Group C — Stack and hosting**
9. Is there an existing stack, repository, or CMS that must be kept? (default:
   no constraint; reason: migration cost dominates)
10. Does the site need a backend, database, authentication, or payments?
    (default: static-first, add services only when required; reason: lower cost
    and smaller attack surface)
11. Where will it be hosted, and who controls DNS? (default: unknown, decide in
    the deployment stage; reason: access is a launch blocker)
12. Are there budget or vendor constraints? (default: none stated; reason:
    affects build and monitoring choices)

**Group D — Design and brand**
13. Are brand assets, a design system, or an existing site to match available?
    (default: minimal custom design system; reason: consistency and speed)
14. Any accessibility or language requirements? (default: WCAG 2.1 AA, single
    language; reason: legal and usability baseline)
15. Any reference sites or styles the user likes or dislikes? (default: none;
    reason: reduces revision cycles)

**Group E — SEO and discoverability**
16. Which search terms or topics matter? (default: derive from the primary
    service; reason: drives structure and content)
17. Is the site new, or does it replace an existing indexed site? (default: new;
    reason: redirects and preserved rankings differ)
18. Any multi-language or regional targeting? (default: no; reason: URL and
    hreflang strategy depends on it)

**Group F — Data, payments, and legal**
19. What personal data will be collected: forms, accounts, analytics, payments?
    (default: contact form plus privacy-friendly analytics; reason: determines
    legal documents and consent UI)
20. Which jurisdictions apply: KVKK, GDPR, CCPA, other? (default: user's stated
    country; reason: disclosure and consent text differ)
21. Are there regulated claims, prices, or terms? (default: none; reason: needs
    legal review before launch)

**Group G — Operations and maintenance**
22. Who updates content after launch, and how often? (default: the user, monthly;
    reason: decides CMS need and maintenance plan)
23. What is the acceptable downtime and response time? (default: best effort,
    business hours; reason: sets monitoring depth)
24. Is there an existing analytics, error-tracking, or uptime tool? (default:
    none; reason: avoid duplicate tooling)

## Checklist

- [ ] Known facts were not re-asked.
- [ ] Questions were asked in groups, not one giant list.
- [ ] Every question had a recommended default and a reason.
- [ ] "You decide" answers are recorded with `decided-by-agent: true`.
- [ ] Project type is recorded explicitly.
- [ ] Launch pages and out-of-scope items are listed.
- [ ] Legal jurisdiction and personal-data scope are recorded.
- [ ] `docs/brief.md` exists and follows the template.
- [ ] The user approved the brief in writing.

## Completion criteria

- `docs/brief.md` exists and contains every section of the template.
- No section contains the literal placeholder `TBD` without an owner and a date.
- Project type, primary goal, primary action, launch scope, stack constraint,
  jurisdiction, and maintenance owner are all answered.
- The user has approved the brief. Without approval, Phase 1 must not start.

## Output

`docs/brief.md`, using this structure:

```markdown
# Website Brief

## Snapshot
- Project type:
- One-line description:
- Primary goal:
- Primary visitor action:
- Success metric:

## Audience and content
## Scope (launch / later / out of scope)
## Stack, hosting, and access
## Design and accessibility
## SEO and languages
## Data, payments, and legal
## Operations and maintenance
## Open questions
## Decisions delegated to the agent
```

## On failure

- The user refuses to answer most questions: reduce to the five blocking facts
  (goal, audience, scope, stack, jurisdiction), record the rest as assumptions,
  and mark the brief `provisional: true`.
- The user cannot decide the project type: propose the closest type, state why,
  and ask for a yes/no confirmation.
- Answers contradict each other: list the contradiction in `## Open questions`
  and ask one resolving question. Do not silently pick a side.
- The brainstorming dependency is unavailable: continue with the question bank
  and note in the brief that open-ended exploration was skipped.
- The user withholds approval: stop and wait. Do not produce a plan.
