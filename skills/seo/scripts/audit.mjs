#!/usr/bin/env node
// SEO audit. No dependencies. Node.js >= 18 (uses global fetch).
//
// Run from the repository root:
//   node skills/seo/scripts/audit.mjs --url https://example.com --out docs/seo-audit.json
//   node skills/seo/scripts/audit.mjs --dir ./dist --out docs/seo-audit.json
//   node skills/seo/scripts/audit.mjs --url https://example.com --max 25
//
// Checks per page: title, meta description, canonical (count and absolute),
// H1 count, heading order, lang, Open Graph (incl. image size), Twitter Card,
// JSON-LD parse. Site-level: robots.txt, sitemap.xml, duplicate titles.
// Writes JSON and prints a summary. Exit 1 if errors exist.

import { readFile, writeFile, readdir, stat, mkdir } from "node:fs/promises";
import { join, extname, dirname, relative, resolve } from "node:path";

const args = process.argv.slice(2);
function arg(name, fallback = null) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node skills/seo/scripts/audit.mjs --url <site> | --dir <build-dir> [--out file] [--max N]

Checks title, meta description, canonical, H1, heading order, lang, Open Graph,
Twitter Card, and JSON-LD per page. Checks robots.txt and sitemap.xml when
--url is used. Writes a JSON report. Exit 1 if errors exist, 2 on bad usage.
Requires Node.js >= 18. Run from the repository root.`);
  process.exit(0);
}

const urlArg = arg("--url");
const dirArg = arg("--dir");
const outArg = arg("--out", "seo-audit.json");
const maxRaw = Number(arg("--max", "30"));
const maxPages = Number.isFinite(maxRaw) && maxRaw > 0 ? Math.floor(maxRaw) : 30;
if (!urlArg && !dirArg) {
  console.error("Usage: node skills/seo/scripts/audit.mjs --url <site> | --dir <build-dir> [--out file] [--max N]");
  console.error("Requires Node.js >= 18. Run from the repository root.");
  process.exit(2);
}
if (typeof fetch !== "function") {
  console.error("This script needs global fetch. Install Node.js 18 or newer.");
  process.exit(2);
}
if (args.includes("--max") && (!Number.isFinite(maxRaw) || maxRaw < 1)) {
  console.error(`Invalid --max value: ${arg("--max")}. Use a positive number.`);
  process.exit(2);
}

const results = { generatedAt: new Date().toISOString(), mode: null, pages: [], site: {}, errors: 0, warnings: 0 };
const titleIndex = new Map();

function stripTags(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function metas(html, key, attr = "name") {
  const safe = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<meta[^>]+${attr}=["']${safe}["'][^>]*>`, "gi");
  return [...html.matchAll(re)].map((m) => {
    const c = m[0].match(/content=["']([\s\S]*?)["']/i);
    return c ? c[1].trim() : "";
  });
}
function meta(html, key, attr = "name") {
  const all = metas(html, key, attr);
  return all.length ? all[0] : null;
}
function links(html, rel) {
  const re = new RegExp(`<link[^>]+rel=["']${rel}["'][^>]*>`, "gi");
  return [...html.matchAll(re)].map((m) => {
    const h = m[0].match(/href=["']([\s\S]*?)["']/i);
    return h ? h[1].trim() : "";
  });
}

function auditHtml(html, pageUrl, status = 200) {
  const entry = { url: pageUrl, findings: [], status };
  results.pages.push(entry);
  const push = (level, rule, detail) => {
    entry.findings.push({ level, rule, detail });
    if (level === "error") results.errors++;
    else if (level === "warning") results.warnings++;
  };

  if (status >= 400) push("error", "http-status", `Page returned ${status}.`);

  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
  if (!title) push("error", "title-missing", "No <title> element.");
  else {
    const t = title.trim();
    if (t.length > 60) push("warning", "title-long", `Title is ${t.length} chars (aim <= 60).`);
    else if (t.length < 15) push("warning", "title-short", `Title is ${t.length} chars.`);
    const key = t.toLowerCase();
    if (key && titleIndex.has(key)) push("error", "title-duplicate", `Same title as ${titleIndex.get(key)}.`);
    else if (key) titleIndex.set(key, pageUrl);
  }

  const desc = meta(html, "description");
  if (!desc) push("error", "meta-description-missing", "No meta description.");
  else if (desc.length > 155) push("warning", "meta-description-long", `Description is ${desc.length} chars (aim <= 155).`);

  const canonList = links(html, "canonical");
  if (canonList.length === 0) push("error", "canonical-missing", "No canonical link.");
  if (canonList.length > 1) push("error", "canonical-multiple", `${canonList.length} canonical links.`);
  for (const c of canonList) {
    if (!/^https?:\/\//i.test(c)) push("error", "canonical-relative", `Canonical is not absolute: ${c}`);
  }

  const h1s = html.match(/<h1[\s>]/gi) || [];
  if (h1s.length === 0) push("error", "h1-missing", "No H1.");
  if (h1s.length > 1) push("error", "h1-multiple", `${h1s.length} H1 elements.`);

  const order = [...html.matchAll(/<h([1-6])[\s>]/gi)].map((m) => Number(m[1]));
  let prev = 0;
  for (const level of order) {
    if (prev && level > prev + 1) push("warning", "heading-skip", `Heading jumps H${prev} -> H${level}.`);
    prev = level;
  }

  const lang = (html.match(/<html[^>]*\blang=["']([^"']+)["']/i) || [])[1];
  if (!lang) push("error", "lang-missing", "No lang attribute on <html>.");

  for (const k of ["og:title", "og:description", "og:image", "og:url", "og:type"]) {
    if (!meta(html, k, "property")) push("error", "og-missing", `Missing ${k}.`);
  }
  const ogImage = meta(html, "og:image", "property");
  if (ogImage && !/^https?:\/\//i.test(ogImage)) push("error", "og-image-relative", "og:image must be absolute.");
  const ogWRaw = meta(html, "og:image:width", "property");
  const ogHRaw = meta(html, "og:image:height", "property");
  if (ogWRaw && ogHRaw) {
    const ogW = Number(ogWRaw);
    const ogH = Number(ogHRaw);
    if (Number.isFinite(ogW) && Number.isFinite(ogH) && (ogW < 1200 || ogH < 630)) {
      push("warning", "og-image-small", `og:image is ${ogW}x${ogH}; aim for at least 1200x630.`);
    }
  }

  for (const k of ["twitter:card", "twitter:title", "twitter:description", "twitter:image"]) {
    if (!meta(html, k)) push("error", "twitter-missing", `Missing ${k}.`);
  }

  const ld = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  if (ld.length === 0) push("warning", "jsonld-missing", "No JSON-LD structured data.");
  for (const [i, m] of ld.entries()) {
    try { JSON.parse(m[1]); }
    catch (e) { push("error", "jsonld-invalid", `Block ${i + 1} does not parse: ${e.message}`); }
  }

  const noindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
  if (noindex) push("warning", "noindex", "Page declares noindex.");

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const noAlt = imgs.filter((t) => !/\balt=/.test(t)).length;
  if (noAlt) push("warning", "img-alt-missing", `${noAlt} of ${imgs.length} images lack alt.`);

  const body = stripTags(html.replace(/<head[\s\S]*?<\/head>/i, ""));
  if (body.length < 200) push("warning", "thin-content", `Rendered text is ${body.length} chars.`);
  return entry;
}

async function fetchText(url, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "user-agent": "webmaster-skill-seo-audit/0.1" } });
    return { status: res.status, text: await res.text(), url: res.url };
  } finally {
    clearTimeout(timer);
  }
}

async function walk(dir, acc = []) {
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) await walk(p, acc);
    else if ([".html", ".htm"].includes(extname(p).toLowerCase())) acc.push(p);
  }
  return acc;
}

function normalizeUrl(u) {
  const s = u.replace(/\/index\.html?$/i, "/").replace(/\/$/, "");
  return s || "/";
}

async function runUrl(base) {
  results.mode = "url";
  const origin = new URL(base).origin;
  let home;
  try { home = await fetchText(base); }
  catch (e) { console.error(`Cannot reach ${base}: ${e.message}`); process.exit(2); }

  const html = home.text;
  auditHtml(html, base, home.status);
  const hrefs = [...html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
  const seen = new Set([normalizeUrl(base)]);
  const queue = [];
  for (const l of hrefs) {
    try {
      const abs = new URL(l, base);
      if (abs.origin !== origin) continue;
      if (abs.pathname.match(/\.(css|js|png|jpe?g|svg|webp|avif|ico|pdf|zip|xml|txt)$/i)) continue;
      const clean = normalizeUrl(abs.origin + abs.pathname);
      if (seen.has(clean)) continue;
      seen.add(clean);
      queue.push(clean);
    } catch { /* ignore malformed */ }
  }
  results.site.linksDiscovered = queue.length + 1;
  results.site.truncated = queue.length > Math.max(0, maxPages - 1);
  for (const u of queue.slice(0, Math.max(0, maxPages - 1))) {
    try { const r = await fetchText(u); auditHtml(r.text, u, r.status); }
    catch (e) { results.pages.push({ url: u, status: null, findings: [{ level: "error", rule: "fetch-failed", detail: e.message }] }); results.errors++; }
  }

  try {
    const robots = await fetchText(origin + "/robots.txt");
    results.site.robots = { status: robots.status, hasSitemap: /^\s*sitemap:/im.test(robots.text), blocksAll: /^\s*disallow:\s*\/\s*$/im.test(robots.text) };
    if (robots.status !== 200) { results.errors++; results.site.robots.error = "robots.txt is not 200."; }
    if (results.site.robots.blocksAll) { results.errors++; results.site.robots.error = "robots.txt disallows the whole site."; }
  } catch (e) { results.site.robots = { error: e.message }; results.errors++; }

  try {
    const sm = await fetchText(origin + "/sitemap.xml");
    const locs = [...sm.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
    results.site.sitemap = { status: sm.status, urls: locs.length, absolute: locs.every((u) => /^https?:\/\//i.test(u)) };
    if (sm.status !== 200) { results.errors++; results.site.sitemap.error = "sitemap.xml is not 200."; }
    if (locs.length === 0) { results.errors++; results.site.sitemap.error = "sitemap.xml has no <loc> entries."; }
  } catch (e) { results.site.sitemap = { error: e.message }; results.errors++; }
}

async function runDir(dir) {
  results.mode = "dir";
  const root = resolve(dir);
  const files = await walk(root);
  if (!files.length) { console.error(`No HTML files under ${dir}.`); process.exit(2); }
  const rels = files.slice(0, maxPages);
  for (const f of rels) {
    const html = await readFile(f, "utf8");
    const rel = "/" + relative(root, f).split("\\").join("/");
    auditHtml(html, rel, 200);
  }
  results.site.filesTotal = files.length;
  results.site.truncated = files.length > rels.length;
}

try {
  if (urlArg) await runUrl(urlArg);
  else await runDir(dirArg);

  const payload = JSON.stringify(results, null, 2);
  await mkdir(dirname(resolve(outArg)), { recursive: true });
  await writeFile(outArg, payload, "utf8");
  console.log(`Pages: ${results.pages.length} | errors: ${results.errors} | warnings: ${results.warnings}`);
  console.log(`Report: ${outArg}`);
  if (results.errors > 0) {
    console.log("Top errors:");
    for (const p of results.pages) for (const f of p.findings.filter((x) => x.level === "error").slice(0, 3)) console.log(`  ${p.url}: ${f.rule} — ${f.detail}`);
    process.exit(1);
  }
} catch (e) {
  console.error(`Audit failed: ${e.message}`);
  process.exit(2);
}
