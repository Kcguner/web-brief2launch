# Trigger tests

Manual tests for skill auto-selection. Run each in a **fresh session** with a
**natural prompt** (no skill names, no slash commands). Record which skill the
agent loads first.

## Should trigger `website-master` (10)

### Turkish (5)

1. "Bana bir portfolyo web sitesi yap."
   - Expected first skill: `website-master`
2. "Küçük bir kafe için landing page oluşturmak istiyorum."
   - Expected first skill: `website-master`
3. "Mevcut kurumsal sitemizi baştan tasarla."
   - Expected first skill: `website-master`
4. "Bir SaaS için web uygulaması geliştireceğiz, nerden başlayalım?"
   - Expected first skill: `website-master`
5. "Sitemizi yeniden lansmana hazırla, audit de yap."
   - Expected first skill: `website-master`

### English (5)

6. "Build me a personal portfolio website."
   - Expected first skill: `website-master`
7. "Create a landing page for my new product."
   - Expected first skill: `website-master`
8. "Redesign our company website from scratch."
   - Expected first skill: `website-master`
9. "I need a web app for a small SaaS, where do we start?"
   - Expected first skill: `website-master`
10. "Audit our site before relaunch."
    - Expected first skill: `website-master`

## Should NOT trigger `website-master` (5)

11. "Sitemin SEO'sunu denetle, meta ve sitemap eksik."
    - Expected first skill: `seo`
12. "KVKK aydınlatma metni ve çerez politikası hazırla."
    - Expected first skill: `legal-compliance`
13. "Launch sonrası analytics ve uptime takibi kur."
    - Expected first skill: `monitoring-maintenance`
14. "Yayına çıkmadan önce kalite kapısı çalıştır."
    - Expected first skill: `final-quality-gate`
15. "Henüz brief yok, proje için intake sorularını sor."
    - Expected first skill: `website-intake`

## How to test

- Use a clean session with no prior context.
- Send the prompt verbatim, without naming a skill or using a slash command.
- Observe the first skill the agent loads; it should match the expected skill.
- If `website-master` loads for a narrow task, narrow that skill's description
  further and re-run.