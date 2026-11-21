# web-brief2launch — Detaylı Depo Özeti

> Bu dosya, deponun 2026-11-11 tarihindeki hâlinin tam taramasıdır.
> Kaynak dosyalar değişirse bu özet de güncellenmelidir.
> 2026-11-16: tam denetim yapıldı ve tüm bulgular düzeltildi (§15).

## 1. Kısa özet

Bu depo, bir web sitesini **fikirden yayına ve sonrasındaki bakıma** kadar
götüren, taşınabilir (harness bağımsız) bir **agent skill seti**dir. İçinde
çalıştırılabilir bir web uygulaması yoktur; Markdown talimat dosyaları ve
isteğe bağlı Node.js (>= 18) yardımcı script'leri vardır.

- **Sürüm:** 0.1.0
- **Lisans:** MIT — Copyright (c) 2026 Kaan Can Güner
- **Boyut:** ~876 KB, 23 dosya (`.git` hariç), 16 Markdown dosyası
- **Yerel klasör adı:** `webmaster-skill`
- **README'deki ürün adı / kurulum kaynağı:** `web-brief2launch` (`Kcguner/web-brief2launch`)
- **Kendi doğrulaması:** `node scripts/validate.mjs` → **12/12 PASS**

Temel fikir: altı yerel skill ile 13 aşamalı bir iş akışı yönetmek; mühendislik
aşamalarını (planlama, UI/UX, frontend, backend, performans, güvenlik, test,
deploy) kopyalamak yerine üç dış skill paketine devretmek ve hiçbir şeyi kanıtsız
"tamam" saymamak.

---

## 2. Tasarım felsefesi

1. **Tek doğruluk kaynağı:** Dış skill paketleri repoya kopyalanmaz; ad ve repo
   ile referans verilir. Böylece bilgi çürümesi (drift) önlenir.
2. **Orkestratör iş yapmaz:** `website-master` yalnızca aşamayı belirler, doğru
   skill dosyasını açar, kapıyı (gate) kontrol eder ve ilerlemeyi kaydeder.
3. **Kanıtsız geçiş yok:** Her aşamanın ölçülebilir bir kapısı ve yazılı bir
   çıktı dosyası vardır. "Yaptım" demek yetmez; komut çıktısı, rapor veya
   kullanıcı onayı gerekir.
4. **Dürüstlük:** Terminal, tarayıcı, ağ veya deploy erişimi yoksa ajan bunu
   söylemek ve manuel adım vermek zorundadır. Sahte metrik, test sonucu veya
   hukuki onay üretilemez.
5. **Ürün bağımsızlığı:** Skill metinlerinde ürüne özel araç, komut veya
   entegrasyon adı yoktur. Tek istisna: Lighthouse performans skoru (ölçüm
   standardı olarak adı geçiyor, zorunlu ürün değil).
6. **Dil kuralı:** Skill dosyaları, kod, commit ve dosya adları İngilizce;
   kullanıcıya gösterilen rapor/brief/plan/mesaj kullanıcının dilinde.
7. **İnsan onayı yalnızca karar noktalarında:** Rutin aşamalar kapıyı geçince
   otomatik ilerler; ajan sadece gerçek kararlarda durur.

---

## 3. Mimari

```
AGENTS.md  (evrensel giriş, kopyalama kurulumunda gelir)
README.md  (kurulum, bağımlılıklar, uyumluluk)
│
├─ skills/website-master/        ← ORKESTRATÖR (198 satır)
│   ├─ SKILL.md                    aşama seçimi, kapılar, karar noktaları
│   ├─ stages.md                   13 aşama haritası, faz eşlemesi, derinlik tablosu
│   ├─ reference.md                IA (Aşama 2) + Backend/Veri (Aşama 5) checklist'leri
│   └─ scripts/bootstrap.mjs       bağımlılık kurucu (392 satır)
│
├─ skills/website-intake/  SKILL.md    soru bankası → docs/brief.md (168 satır)
├─ skills/seo/             SKILL.md    teknik + on-page SEO (103 satır)
│   ├─ checklist.md                     genişletilmiş SEO denetimi
│   ├─ reference.md                     hazır snippet'ler
│   └─ scripts/audit.mjs                otomatik SEO denetleyici (663 satır)
├─ skills/legal-compliance/ SKILL.md    KVKK/GDPR/çerez/şartlar (110 satır)
│   └─ checklist.md                     yargı bölgesi matrisi, sayfa içerikleri
├─ skills/monitoring-maintenance/ SKILL.md  analytics/hata/uptime/bakım (95 satır)
│   └─ checklist.md                     aylık/çeyreklik/yıllık rutinler
└─ skills/final-quality-gate/ SKILL.md  tek PASS/FAIL yayın kararı (155 satır)
    ├─ checklist.md                     10 bölümlü tam yayın kontrol listesi
    └─ scripts/gate.mjs                 yapısal kapı kontrolü (262 satır)

scripts/validate.mjs             depo öz-denetimi (653 satır)
.github/workflows/validate.yml   CI: her push/PR'da Node 18 ve 22'de öz-denetim
docs/trigger-tests.md            15 manuel skill tetikleme testi
```

**Toplam:** 6 yerel skill, 4 Node.js script'i, 16 Markdown dosyası.
SKILL.md dosyalarının tamamı 200 satır sınırının altında (en uzun:
`website-master`, 198 satır); uzun listeler `checklist.md` / `reference.md`
dosyalarına taşınmış.

---

## 4. 13 aşamalı iş akışı

`stages.md` aşamaları, hangi skill'in çalışacağını, çıktı dosyasını ve
ölçülebilir kapıyı tanımlar:

| # | Aşama | Skill | Çıktı | Kapı |
|---|-------|-------|-------|------|
| 0 | Intake & keşif | `website-intake` + dış `brainstorming` | `docs/brief.md` | Brief kullanıcı tarafından onaylı |
| 1 | Planlama | dış `writing-plans`, `planning-and-task-breakdown` | `docs/plan.md` | Her görevin sahibi, dosyası ve doğrulanabilir kriteri var |
| 2 | Bilgi mimarisi | `reference.md` §IA | `docs/ia.md` | Sitemap, nav, URL şeması brief ile tutarlı |
| 3 | UI/UX tasarım | dış `frontend-ui-engineering` + opsiyonel `impeccable` | `docs/design.md` + `DESIGN.md` token'ları | Breakpoint'ler, WCAG 2.1 AA kontrast/focus, tüm ekranlar |
| 4 | Frontend geliştirme | dış `frontend-ui-engineering`, `incremental-implementation` | çalışan uygulama + `docs/frontend-report.md` | Build geçer, bileşen envanteri tasarımla uyumlu, konsol hatası yok |
| 5 | Backend & veri | dış `api-and-interface-design` + `reference.md` §Backend | `docs/data-model.md` | Şema, auth, secret, migration, yedek planı belgeli ve denenmiş |
| 6 | SEO | `seo` | `docs/seo-report.md` | Script + manuel kontroller geçer |
| 7 | Performans | dış `performance-optimization` | `docs/performance-report.md` | Mobil Lighthouse ≥ 90, LCP < 2.5 s, CLS < 0.1, INP < 200 ms |
| 8 | Güvenlik | dış `security-and-hardening` | `docs/security-report.md` | Güvenlik başlıkları var, kritik/yüksek bağımlılık bulgusu yok, secret taraması temiz |
| 9 | Hukuk & uyum | `legal-compliance` | `docs/legal-review.md` | Gizlilik/çerez/KVKK/şartlar yayında ve linkli; avukat onayı kayıtlı |
| 10 | Test & QA | dış `test-driven-development`, `browser-testing-with-devtools` | `docs/test-report.md` | Ana akışlar, 404/500, formlar, mobil viewport staging'de geçer |
| 11 | Deployment | dış `ci-cd-and-automation`, `shipping-and-launch` | `docs/deployment.md` | DNS + SSL doğrulandı, staging→prod hattı çalışıyor, rollback provalı |
| 12 | İzleme & bakım | `monitoring-maintenance` + dış `observability-and-instrumentation` | `docs/monitoring.md` | Analytics/hata/uptime canlı, takvim sahipli, test alarmı onaylandı, restore testi tarihli |
| — | **Yayın kapısı** | `final-quality-gate` | `docs/quality-gate.md` + `.json` | **PASS + kullanıcı onayı** |

### Faz eşlemesi

| Faz | Ad | Aşamalar |
|-----|----|----------|
| 0 | Intake | 0 |
| 1 | Plan | 1 |
| 2 | Aşamalı delegasyon | 2–5 |
| 3 | Sertleştirme | 6–9 |
| 4 | Doğrulama | 10 |
| 5 | Yayın | 11 + yayın kapısı |
| 6 | Operasyon | 12 |

### Proje tipine göre derinlik

`stages.md` her aşama için beş proje tipinde derinlik tanımlar:
**portfolio/brochure, blog, corporate, SaaS, e-commerce**. Seviyeler:
`full` (aynen uygula), `standard` (opsiyoneller hariç tüm checklist),
`light` (smoke + atlananların gerekçesi), `skip` (nedeni `progress.md`'ye yaz).
Listede olmayan tipler en yakın sütuna eşlenir ve seçim gerekçesiyle kaydedilir.

---

## 5. Karar noktaları (ajanın durduğu yerler)

Rutin aşamalar kapıdan geçince **otomatik ilerler**. `website-master` yalnızca
şu durumlarda durur ve "ne yapıldı / kanıt / sırada ne var / risk" özeti sunar:

1. Eksik bağımlılık (kurulum onayı)
2. Brief ve plan (Faz 0–1)
3. Brief ile çelişen kapsam değişikliği
4. Üst üste iki kez başarısız olan kapı
5. Geri alınamaz işlem (deploy, DNS değişikliği, migration, secret rotasyonu)
6. Hukuki onay
7. Yayın

Çakışma önceliği: güvenlik/hukuk > erişilebilirlik (WCAG 2.1 AA) > onaylı brief
> ölçülmüş kanıt > `final-quality-gate` (her aşamanın öz değerlendirmesini ezer).

---

## 6. Belge akışı

Tüm çıktılar kullanıcının projesindeki `docs/` klasörüne yazılır:

```
docs/brief.md ──► docs/plan.md ──► docs/ia.md ──► docs/design.md
      │                                   │
      ├──► docs/data-model.md             ├──► docs/frontend-report.md
      ├──► docs/seo-report.md + seo-audit.json
      ├──► docs/performance-report.md
      ├──► docs/security-report.md
      ├──► docs/legal-review.md
      ├──► docs/test-report.md
      ├──► docs/deployment.md
      ├──► docs/monitoring.md
      └──► docs/quality-gate.md + quality-gate.json  (PASS/FAIL)
```

Ek olarak delegasyon fazlarında `docs/handoffs/<phase>-task.md` ve
`<phase>-result.md` yazılır. Geçerli faz adları:
`intake, plan, delegation, hardening, verification, release, operate`.

Mekanik aşama raporları (4, 7, 8, 10, 12) üç başlık kullanır:
`## What ran`, `## Results`, `## Evidence`.

`docs/progress.md` formatı `gate.mjs` tarafından **birebir** ayrıştırılır:

- `Project type: <type>` satırı; kanonik tipler: `static`, `portfolio`,
  `brochure`, `blog`, `corporate`, `e-commerce`, `saas`, `documentation`,
  `community`, `web app`, `other`. `Next.js static export` gibi bileşik ifade
  `static` sayılmaz. Gate token'ları doğrulamaz; yalnızca `static`,
  `portfolio`, `brochure`, `blog` için `data-model.md` muafiyeti uygular.
- Her aşama için `status: done | in progress | pending | skip` (skip gerekçesi
  kaydedilir). `blocked`, `blocked-manual`, `fail`, `failed` kapıyı düşürür.
  Statü satır başında veya liste öğesi içinde olabilir (stages.md örneği gibi);
  tablo satırları ve kod blokları yok sayılır.
- Kod blokları dışında işaretlenmemiş her checkbox (`- [ ]` vb.) kapıyı düşürür.
- `docs/` içinde `TBD`, `TODO:`, `PLACEHOLDER`, `FIXME`, `XXX:`,
  `lorem ipsum` kalmamalı (kod blokları hariç).

`.gitignore`, üretilen `docs/` çıktılarını (brief, progress, ia, design,
data-model, deployment, handoffs, json raporlar) takip dışında bırakır; girdiler
takip edilir.

---

## 7. Skill bazlı detaylar

### 7.1 `website-master` (orkestratör)

- 13 aşamayı, 7 fazı, kapıları ve ilerleme dosyasını yönetir.
- **First run:** `bootstrap.mjs` çalıştırılır (önce rapor, onay sonrası `--yes`),
  eksik/opsiyonel paketler kaydedilir. Proje başına bir kez şu satırın agent
  talimat dosyasına eklenmesi önerilir (onaysız asla düzenlenmez):
  `For website or web app requests, use the website-master skill first.`
- Proje tipini sınıflandırır ve her aşamanın derinliğini `progress.md`'ye yazar.
- Aynı anda yalnızca tek aşama skill'i yükler (onaylı paralel fazlar hariç).
- **On failure:** brief yoksa intake'e döner; bağımlılık yoksa aşamayı durdurur;
  kapı iki kez düşerse kullanıcıya kapsam düzeltme / istisna / plan değişikliği
  seçeneklerini sunar; terminal/tarayıcı/ağ yoksa `blocked-manual` işaretler.
- Tamamlanma: 13 aşama kayıtlı, `quality-gate.md` PASS, site canlı (veya kabul
  edilmiş erteleme), bakım sahibi ve takvim kayıtlı, açık blocker yok.

### 7.2 `website-intake`

- Amaç: kullanıcıyı sorguya boğmadan planlamaya yetecek minimum bilgiyi toplayıp
  onaylı `docs/brief.md` üretmek.
- **24 soruluk banka, 7 grupta** (A hedef/kitle, B tip/kapsam, C stack/hosting,
  D tasarım/marka, E SEO, F veri/ödeme/hukuk, G operasyon). Sorular 5–7'lik
  gruplar hâlinde sorulur; her soruda önerilen varsayılan + tek satır gerekçe +
  "sen karar ver" seçeneği vardır. "Sen karar ver" cevabı
  `decided-by-agent: true` olarak işaretlenir.
- Çıktı şablonu: Snapshot, Audience and content, Scope, Stack/hosting/access,
  Design/accessibility, SEO/languages, Data/payments/legal, Operations,
  Open questions, Decisions delegated.
- Onay olmadan planlama başlamaz. Çelişen cevaplar sessizce çözülmez; tek bir
  netleştirme sorusu sorulur.
- Kullanıcı çoğu soruyu yanıtlamazsa beş bloklayıcı gerçek (hedef, kitle,
  kapsam, stack, yargı bölgesi) ile `provisional: true` brief üretilir.

### 7.3 `seo`

- 13 adımlı süreç: otomatik audit → başlık/açıklama/canonical/H1/OG kontrolü →
  başlık hiyerarşisi → `robots.txt` → `sitemap.xml` → canonical → Schema.org
  JSON-LD (Organization, WebSite, Article, Product+Offer, BreadcrumbList) →
  OG/Twitter Card (≥ 1200×630) → indekslenebilirlik → iç linkleme → dil/hreflang
  → redirect'ler → `docs/seo-report.md`.
- `reference.md`: kopyala-yapıştır `<head>` şablonu, robots.txt, sitemap.xml,
  dört JSON-LD örneği, hreflang seti, redirect kuralları, başlık/açıklama
  uzunlukları. Üçüncü taraf SEO eklentisi kullanıcı onayı olmadan eklenmez.
- Tamamlanma: raporda önem dereceli bulgular + kanıt; indekslenebilir sayfalarda
  sıfır hata; sitemap/robots HTTP 200 ve tutarlı; JSON-LD sıfır hata; kritik
  bulgular düzeltilmiş veya yazılı kabul edilmiş.
- Ağ yoksa `--dir` ile yerel build denetlenir; o da yoksa `blocked-manual`.

### 7.4 `legal-compliance`

- **Hukuki tavsiye değildir**; yayın öncesi avukat onayı şarttır. Bu uyarı hem
  skill'de hem README'de hem checklist'te tekrarlanır.
- Veri akışı envanteri (form, analytics, çerez, embed, auth, ödeme, log) →
  yargı bölgesi tespiti (KVKK, GDPR, UK GDPR, CCPA/CPRA, LGPD, PIPEDA) → çerez
  onayı gereksinimi → politika sayfaları (gizlilik, çerez, KVKK aydınlatma,
  kullanım şartları, impressum, iade/kargo, erişilebilirlik) → onay UI'ı
  (kabul/reddet eşit görünürlük, ön işaretli kutu yok, geri çekme kolay) →
  veri sahibi hakları → form/embed/saklama kontrolleri → DPA, ihlal bildirimi,
  işleme kaydı → `docs/legal-review.md` → avukat incelemesi kaydı.
- Checklist: 6 rejim tetikleyicisi, veri akışı alanları, gizlilik/çerez/KVKK/
  şartlar/e-ticaret içerik listeleri, 6 adımlı çerez onay testi, kayıt tutma.
- Avukat incelemesi yoksa risk açık dille yazılır, yazılı kabul istenir ve son
  kapıda işaretlenir. Kullanıcı hukuki görüş isterse ajan görüş vermez.

### 7.5 `monitoring-maintenance`

- Tek analytics aracı + birincil dönüşüm olayları; istemci/sunucu hata takibi
  (release etiketli, yeni hata tipi ve hata oranı alarmı); iki bölgeden 1–5
  dakikalık uptime; gerçek kullanıcı veya haftalık sentetik CWV; SEO, güvenlik
  ve yedek izleme; aylık bakım takvimi; 5 olay için runbook; her alarmın sahibi.
- Checklist üç rutin seviyesi tanımlar: **aylık** (bağımlılık, hata, uptime,
  kırık link, sertifika/domain, analytics, SEO, restore, maliyet, çerez),
  **çeyreklik** (performans, erişilebilirlik, güvenlik, geri bildirim, içerik,
  kimlik rotasyonu, runbook), **yıllık** (domain/sertifika, hukuk, marka,
  sözleşme, felaket kurtarma provası).
- Alarm tasarım kuralları: kullanıcının hissettiği semptomlara alarm kur, her
  alarmın sahibi/kanalı/ilk eylemi olsun, kurulum ve yönlendirme değişikliğinde
  test et, önem ölçeği kullan, alarm yorgunluğundan kaçın.
- Tamamlanma: `monitoring.md` araç/sahip/kanalı adlandırır; test alarmı insana
  ulaşıp onaylanmıştır; restore testi tarihlidir; 3 aylık takvim sahiplidir.

### 7.6 `final-quality-gate`

- Tek yayın kararı: her aşama çıktısını okur, **aşamanın öz değerlendirmesine
  güvenmez**, kanıtı yeniden kontrol eder ve `PASS` / `FAIL` üretir.
- Girdiler: `brief`, `plan`, `progress`, `ia`, `design`, `frontend-report`,
  `data-model`, `seo-report`, `performance-report`, `security-report`,
  `legal-review`, `test-report`, `deployment`, `monitoring` + staging/prod URL,
  deploy erişimi, terminal. Eksik yetenek tek başına FAIL değil; satır
  `manual-required` olur.
- Her satır `pass`, `fail`, `manual-required`, `accepted-risk` olarak işaretlenir.
  Kanıtsız iddia = `fail`. Çapraz çelişkiler (SEO HTTPS diyor, güvenlik mixed
  content diyor vb.) FAIL'dir.
- PASS: sıfır `fail`, tüm `manual-required` kullanıcı kanıtıyla tamamlanmış, her
  `accepted-risk` yazılı kabul edilmiş. FAIL: bir `fail` veya onaysız
  `manual-required`.
- PASS **uygunluk** demektir; yayın için ayrıca kullanıcının açık onayı gerekir.
- Checklist 10 bölüm: yapı/süreç, SEO, performans, güvenlik, hukuk, test,
  erişilebilirlik (WCAG 2.1 AA), deployment, izleme, içerik.
- Rapor yapısı: verdict satırı → Blockers → Stage results tablosu → Accepted
  risks → açık manuel adımlar → Release approval.

---

## 8. Script'ler

Hepsi bağımlılıksız, Node.js >= 18, `--help` çıktısı `Usage:` satırı içerir.

### 8.1 `skills/website-master/scripts/bootstrap.mjs`

İlk çalıştırmada dış bağımlılıkları kuran sabit listeli yükleyici.

- **Sabit liste (`PACKAGES`):** hiçbir argüman, env değişkeni veya dosya paket
  kaynağını değiştiremez. `--source`, `--url`, `--repo`, `--from` yoktur.
- Paketler tam 40 karakterlik commit SHA'sına pinlidir; kurulum kaynağı tek
  yerde `repo@pin` olarak türetilir.
- **`--yes` olmadan kurulum yok**; varsayılan mod yalnızca raporlar ve eksik
  zorunlu paket varsa `1` ile çıkar.
- **Varsayılan kapsam proje** (`cwd`); global kurulum yalnızca `--global` ile.
  Proje kapsamı için `cwd`'de `.git` veya `package.json` aranır.
- **Agent tahmin edilmez:** 7 agent'ın config işaretçisi taranır (claude-code,
  opencode, codex, cursor, github-copilot, windsurf, gemini-cli). Tek agent
  otomatik seçilir; sıfır/çoklu agent `--agent <id>` ister. Paylaşılan
  `.agents/skills` klasörü yerine agent config dizinleri kullanılır.
- Skills CLI sürümü de pinlidir: `skills@1.9.0`, `npx -y` ile. Kurulum zaman
  aşımı 300 s; zaman aşımında süreç grubu öldürülür (SIGTERM, 5 s sonra
  SIGKILL yedeği), böylece npx'in torun süreci yetim kalmaz.
- Her paket için tek `npx skills@1.9.0 add repo@pin -a <agent> -y --skill <ad> ...`
  komutu çalıştırılır; skill adları tek tek verilir, wildcard yok. Komut
  çalıştırılmadan önce yazdırılır.
- Agent config'i düzenlemez, hook kurmaz, opsiyonel paketi kurmaz.
- Kurulum sonrası doğrulama: eksik kalan varsa uyarı verir (CLI farklı klasör
  adı kullanmış olabilir), hata saymaz.
- `--json` ile `--yes` birlikte kullanılamaz.
- **Çıkış kodları:** `0` tüm zorunlu paketler var; `1` eksik paket raporlandı
  veya kurulum başarısız; `2` kurulum istendi ama agent belirsiz; `64` kullanım
  hatası. Rapor modunda belirsiz agent `0` döner (liste basılır).

### 8.2 `skills/seo/scripts/audit.mjs`

- Modlar: `--url https://...` (canlı crawl) veya `--dir ./dist` (yerel HTML).
  İkisi birlikte kullanılamaz. `--out`, `--max` (varsayılan 30),
  `--allow-private` desteklenir.
- **SSRF koruması:** varsayılan olarak localhost, loopback, link-local, private,
  documentation ve multicast IPv4/IPv6 hedefleri reddedilir; IPv4-mapped IPv6
  ve oktallı/hex IPv4 formları dahil kontrol edilir. Redirect'ler manuel takip
  edilir ve her hop'ta şema + özel-host kontrolü yeniden yapılır; ayrıca
  best-effort DNS ön kontrolü özel adrese çözümlenen adları reddeder
  (resolve-then-fetch yarışı tümüyle kapatılamaz). `--allow-private` ile
  geçersiz kılınır.
- Sayfa başına: title varlık/uzunluk/tekillik, meta description, canonical
  (sayı + mutlaklık), H1 sayısı, başlık atlamaları, `lang`, OG (5 alan + görsel
  boyutu), Twitter Card (4 alan), JSON-LD parse, noindex, img alt, ince içerik.
- Site düzeyinde (`--url`): `robots.txt` parse + `Disallow` kurallarına uyarak
  crawl, `sitemap.xml` kontrolü ve sitemap URL'leriyle keşif tohumlama (sitemap
  index bir seviye açılır), ana sayfa linklerinden başlayan genişlik öncelikli
  (BFS) crawl, aynı origin keşfi, eşzamanlılık 4, yanıt boyutu 2 MB ile sınırlı,
  içerik tipi HTML olmayan sayfalar atlanır. Tırnaksız `href` değerleri de okunur.
- Rapor atomik yazılır (tmp + rename). Hata varsa `1`, kullanım hatasında `2`.
- Not: script'te tek ağ erişimi (`fetch`) ve iki dosya silme (`unlink`, geçici
  dosya temizliği) var; `validate.mjs` bunları bilgi amaçlı raporlar.

### 8.3 `skills/final-quality-gate/scripts/gate.mjs`

- `--docs <proje>/docs [--out ...]`. 14 zorunlu çıktı dosyasını arar:
  `brief, plan, progress, ia, design, frontend-report, data-model, seo-report,
  performance-report, security-report, legal-review, test-report, deployment,
  monitoring`.
- `data-model.md`, `progress.md`'de proje tipi `static|portfolio|blog|brochure`
  ise opsiyoneldir (tam token eşleşmesi; `weblog` ≠ `blog`).
- Dosya var ama başlıklar dışında < 40 karakter içerik varsa "stub" bulgusu.
- Kod blokları hariç `TBD/TODO:/PLACEHOLDER/lorem ipsum/FIXME/XXX:` arar.
- `progress.md`'de `blocked/blocked-manual/fail/failed` statüleri (liste öğesi
  içi dahil, tablo satırları ve kod blokları hariç) ve işaretsiz checkbox'ları
  bulgu sayar.
- Yayın kararını `docs/quality-gate.md` içindeki `Verdict:` satırından okur ve
  `releaseVerdict` alanına yazar; rapor atomik yazılır (tmp + rename).
- **Çıkış kodları:** `0` yapı geçti ve kayıtlı yayın PASS'ı var, `1` yapısal
  FAIL veya kayıtlı yayın FAIL'ı, `2` argüman/rapor yazma hatası, `3` yapısal
  PASS ama yayın kararı henüz kaydedilmemiş. `3` bilinçli: yapısal PASS yayın
  PASS'ı değildir, CI yanlış okumasın.

### 8.4 `scripts/validate.mjs`

Depo öz-denetimi; 12 kontrol çalıştırır:

1. Her `SKILL.md` ≤ 200 satır
2. Frontmatter geçerli, `name` = klasör, `description` "Use when" ile başlar
3. Zorunlu başlıklar: Purpose, Inputs, Steps, Checklist, Completion criteria,
   Output, On failure
4. Göreli linkler gerçek dosyalara çözülür (üretilen `docs/` çıktıları hariç)
5. `skills/` altında ürün/agent adı sızıntısı yok (README/AGENTS uyumluluk
   tablosu ayrı raporlanır)
6. Dış skill adları doğrulanmış upstream listeleriyle eşleşir
7. Her script `--check`, `--help` ve üretilen mini site fixture'ında çalışır;
   `--json` sunan script'lerin çıktısı parse edilebilir JSON olmalı. Fixture
   ayrıca iki gate regresyonu (liste öğesi içi `status: blocked` → exit 1,
   kayıtlı `Verdict: PASS` → exit 0) ve geçici bir yerel HTTP sunucusuyla
   URL-modu audit regresyonları çalıştırır: loopback ve oktallı IP reddi,
   sitemap tohumlu BFS crawl, robots skip, manuel redirect takibi
8. Script'lerin ağ/dosya silme/env/secret erişim yüzeyi listelenir (`node:dns`
   dahil)
9. `LICENSE` mevcut
10. `website-master` bir "First run" bölümü içerir
11. Bootstrap yalnızca sabit, pinli, onaylı liste kurar (argümanla kaynak
    değiştirilemez, `--yes` kapısı var, kapsam varsayılanı proje, agent tahmin
    edilmez, wildcard yok)
12. `skills/` klasörü mevcut

Fixture, `mkdtemp` ile oluşturulan benzersiz geçici klasörde çalışır ve yalnızca
beklenen prefix altındaysa silinir. Çıkış: `0` tümü geçti, `1` en az bir hata,
`2` bilinmeyen flag.

---

## 9. Bağımlılık paketleri

| Paket | Tür | Tag | Pin (commit) | Kurulan skill'ler |
|-------|-----|-----|--------------|-------------------|
| `obra/superpowers` | zorunlu | v7.0.2 | `22f0b463e7a5e579904dd6211a520321035526f7` | brainstorming, writing-plans, subagent-driven-development, dispatching-parallel-agents, test-driven-development, requesting-code-review |
| `addyosmani/agent-skills` | zorunlu | 0.6.15 | `8bfcc1f9916f2eea55494d8c1fa7f4bde867dd9e` | frontend-ui-engineering, incremental-implementation, api-and-interface-design, performance-optimization, security-and-hardening, browser-testing-with-devtools, ci-cd-and-automation, shipping-and-launch, observability-and-instrumentation, planning-and-task-breakdown |
| `pbakaus/impeccable` | opsiyonel | skill-v4.8.0 | `414603bf14c7a344edb466bb1f85690c77ce8b7d` | impeccable |

- Opsiyonel `impeccable` yalnızca kendi interaktif kurucusuyla kurulur
  (`npx impeccable install`); bootstrap onu asla çalıştırmaz. Yokluğunda Aşama 3
  manuel WCAG/design checklist kanıtıyla geçer ve fallback kaydedilir.
- Kurulum yoksa veya ağ yoksa iş akışı sınırlı modda devam eder; hangi
  aşamaların eksik olduğu `docs/progress.md`'ye yazılır. Eksik skill taklit
  edilmez.
- Uyumluluk tablosu 7 agent + generic giriş içerir; **hiçbir kurulum test
  edilmemiştir** ("not tested"), tablo başlangıç noktası olarak sunulur.

---

## 10. Depo doğrulama durumu

`node scripts/validate.mjs` çıktısı (2026-11-16, düzeltmeler sonrası):

```
RESULT: PASS — 12/12 checks passed, 0 failed.
  1. 6 files checked
  2. 6 files checked
  3. 7 sections x 6 files
  4. 15 files, 0 docs/ outputs skipped
  5. clean; 6 agent-directory mention(s) in skill scripts, expected
  6. 14 referenced, 17 table rows
  7. 4 scripts; audit: Pages: 2 | errors: 0 | warnings: 0 |
     gate: Required: 14 | missing: 0 | skipped: 0 | findings: 0 |
     regressions: blocked=ok, verdict=ok, url-mode=ok
  8. network 2, delete 4, env 0, secret-path 0
  9. LICENSE found
 10-12. PASS
```

Yani depo kendi kurallarına göre tutarlı: frontmatter, satır limitleri, linkler,
bağımlılık adları, script sağlığı ve bootstrap güvenlik kuralları doğrulanmış
durumda.

---

## 11. Güçlü yönler

- **Kanıt zorunluluğu** her katmanda: aşama kapıları, `progress.md` ayrıştırma,
  `quality-gate` yeniden doğrulama ve validate fixture'ı.
- **Güvenlik bilinci:** bootstrap sabit pinli liste + `--yes` kapısı + agent
  tahmin etmeme; SEO audit'te SSRF engeli; gate'te yapısal PASS'ın yayın PASS'ı
  sayılmaması.
- **Drift önleme:** dış skill'ler kopyalanmaz; adlar doğrulanmış upstream
  listelerine karşı kontrol edilir; pin güncelleme prosedürü README'de tanımlı.
- **Gerçekçi kapsam yönetimi:** proje tipine göre derinlik, `skip` gerekçesi,
  sınırlı mod kaydı, iki kez düşen kapıda durma.
- **Hukuk sınırı net:** "legal advice değildir" uyarısı tutarlı; avukat onayı
  yoksa risk kaydı ve kapı davranışı tanımlı.
- **Küçük ve taşınabilir:** 6 skill, bağımlılıksız script'ler, ürün bağımsız
  metin; herhangi bir agent'ta `SKILL.md`, agent skill okumuyorsa `AGENTS.md`
  üzerinden çalışır.

## 12. Dikkat edilmesi gerekenler / riskler

1. **İsim tutarsızlığı (çözüldü, 2026-11-16):** Yerel klasör `webmaster-skill`,
   remote ve README `Kcguner/web-brief2launch`. `git ls-remote` ile deponun bu
   adla yayında olduğu ve `main`'in yerel HEAD ile aynı olduğu doğrulandı;
   kurulum komutu geçerli. Klonlanan klasör adı yine farklı olur.
2. **Kurulum test edilmemiş:** README açıkça söylüyor; 7 agent için de yalnızca
   "not tested" yazıyor. Agent yolları ve `--agent` id'leri skills CLI
   tablosundan alınmış, uçtan uca denenmemiş.
3. **Erken sürüm (0.1.0):** Akış ve dosya formatları değişebilir; özellikle
   `progress.md` formatı `gate.mjs` tarafından sıkı ayrıştırıldığı için format
   değişikliği geriye dönük kırıcı olur.
4. **`gate.mjs` çıkış kodu 3:** Yayın kararı kaydedilmemiş yapısal PASS'ta `3`
   döner; kayıtlı `Verdict: PASS` artık `0` döner. CI hattı yalnızca `0`'ı
   başarı sayacak şekilde yazılırsa, karar öncesi aşamada yanlış negatif üretir.
5. **Proje tipi token hassasiyeti:** `Project type:` satırında kanonik tipler
   dışındaki ifadeler (ör. `Next.js static export`) `data-model.md` muafiyetini
   tetiklemez; muafiyet yalnızca `static`, `portfolio`, `brochure`, `blog`
   token'ları için geçerlidir.
6. **İçerik doğruluğu:** `quality-gate` bir süreç kapısıdır; hukuki uygunluk,
   güvenlik veya performansı kendi başına garanti etmez. Kanıt dosyalarının
   gerçekten ölçüm içermesi gerekir.
7. **Ağ/servis bağımlılığı:** SEO audit ve bootstrap sırasıyla hedef siteye ve
   `npx`/npm registry'ye erişim ister; kapalı ortamda manuel moda düşer.
8. **Bakım yükü:** Dış skill paketleri güncellendikçe pinler, README tablosu ve
   `validate.mjs` içindeki doğrulanmış isim listeleri birlikte güncellenmelidir;
   aksi halde validate 6. kontrolü düşer.

---

## 13. Hızlı kullanım

```bash
# 1) Kurulum (skills CLI; tüm altı skill)
npx skills add Kcguner/web-brief2launch --skill '*'

# veya klonla (AGENTS.md de gelir)
git clone https://github.com/Kcguner/web-brief2launch.git

# 2) İlk istekte bağımlılık kontrolü (hedef proje kökünde)
node <skill-folder>/scripts/bootstrap.mjs
node <skill-folder>/scripts/bootstrap.mjs --yes
node <skill-folder>/scripts/bootstrap.mjs --yes --agent opencode

# 3) Depoyu doğrula
node scripts/validate.mjs

# 4) Yayın öncesi yapısal kapı
node <skill-folder>/scripts/gate.mjs --docs ./docs --out docs/quality-gate.json

# 5) SEO denetimi
node <skill-folder>/scripts/audit.mjs --url https://example.com --out docs/seo-audit.json
node <skill-folder>/scripts/audit.mjs --dir ./dist --out docs/seo-audit.json
```

Agent akışı: istek → `website-master` → intake → onaylı `brief.md` → onaylı
`plan.md` → 13 aşama (rutin olanlar otomatik, kararlarda durur) →
`final-quality-gate` PASS + kullanıcı onayı → yayın → `monitoring-maintenance`.

---

## 14. Commit geçmişi (özet)

| Commit | Mesaj |
|--------|-------|
| `c67f8f9` | fix: harden helper scripts and align skill docs after full audit |
| `9ba86a3` | fix: align bootstrap agent paths with the skills CLI |
| `6f36933` | fix: keep website-master SKILL.md within the 200-line rule |
| `ddecbaf` | fix: auto-advance routine stages; ask only at decision points |
| `fe5a475` | feat: one-command setup with pinned dependency bootstrap |
| `46b36bc` | fix: safe temp cleanup, reject non-http(s) URLs, content-based release stub check |
| `74eee78` | feat: portable brief-to-launch website skill set v0.1.0 |

Geçmiş, olgunlaşma yönünü gösteriyor: önce iskelet (13 aşama + 6 skill), sonra
tek komutla kurulum ve pinleme, ardından karar noktalarının azaltılması, satır
limiti ve script sertleştirmeleri.

---

## 15. 2026-11-16 denetim düzeltmeleri

Tam denetimde bulunan ve düzeltilen sorunlar (öncelik sırasıyla):

1. **gate.mjs statü parse'u (kritik):** stages.md örnek formatındaki liste içi
   `status: blocked/failed` ve numaralı liste statüleri artık yakalanıyor;
   tablo satırları ve kod blokları hariç tutuluyor. Regresyon testleri
   validate fixture'ına eklendi.
2. **audit.mjs SSRF (yüksek):** redirect'ler manuel takip ediliyor, her hop'ta
   şema + özel-host kontrolü ve best-effort DNS ön kontrolü yapılıyor;
   oktallı/hex IPv4 formları reddediliyor.
3. **gate.mjs yayın kararı:** `Verdict:` satırı `docs/quality-gate.md`'den
   okunuyor; kayıtlı PASS → exit 0, kayıtlı FAIL → exit 1, karar yok → exit 3.
   `releaseVerdict` artık JSON'a yazılıyor; rapor atomik yazılıyor.
4. **Kanonik proje tipleri:** SKILL.md, intake ve stages.md aynı listeyi
   kullanıyor (static, portfolio, brochure, blog, corporate, e-commerce, saas,
   documentation, community, web app, other); `skip` statüsü belgelendi.
5. **frontend-report.md** gate'in zorunlu listesine (14 dosya), final gate
   Inputs ve checklist §1'e eklendi.
6. **TDD ad çakışması:** bootstrap zaten yalnızca superpowers'dan kuruyor;
   README'ye manuel `--skill '*'` kurulumundaki çakışma notu eklendi.
7. **audit crawl:** sitemap URL'leri keşfi tohumluyor (index bir seviye
   açılıyor), genişlik öncelikli crawl derin sayfaları da denetliyor;
   tırnaksız href, `<title>` regex ve `<style>` temizliği düzeltildi.
8. **.gitignore** tutarlı hâle getirildi: girdiler (brief, plan) takip edilir,
   üretilen çıktılar ignore'lu; şablon olduğu açıkça belirtildi.
9. **README** pin güncelleme prosedürü `packageSource()` türetmesine göre
   güncellendi.
10. **bootstrap timeout:** süreç grubu öldürülerek yetim npx torunu önlendi.
11. **validate:** AGENTS.md ürün adı sayıma dahil; 11. kontrol regex'leri
    boşluk değişimlerine tolerant; risk yüzeyi `node:dns` kapsıyor;
    `e-commerce` proje tipi beyaz listede.
12. **ozet.md → SUMMARY.md** olarak yeniden adlandırıldı (İngilizce dosya adı
    kuralı) ve yanlış iddialar düzeltildi.
13. **CI + otomatik regresyon (2026-11-16, ikinci tur):** GitHub Actions
    iş akışı her push/PR'da öz-denetimi Node 18 ve 22'de çalıştırır; manuel
    yerel-sunucu audit testleri (SSRF reddi, BFS crawl, robots, redirect)
    validate fixture'ına taşındı ve ağa çıkmadan otomatik çalışır.

Doğrulama: `node scripts/validate.mjs` → 12/12 PASS (fixture regresyonları
dahil); gate için 8, audit için yerel sunuculu 4 senaryo testi elle çalıştırıldı
ve tümü beklendiği gibi sonuçlandı.
