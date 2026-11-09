#!/usr/bin/env node
// SEO audit. No dependencies. Node.js >= 18 (uses global fetch).
//
// Usage (run from any directory; <skill-folder> is where this skill is installed,
// for example .agents/skills/seo):
//   node <skill-folder>/scripts/audit.mjs --url https://example.com --out docs/seo-audit.json
//   node <skill-folder>/scripts/audit.mjs --dir ./dist --out docs/seo-audit.json
//   node <skill-folder>/scripts/audit.mjs --url https://example.com --max 25
//
// Checks per page: title, meta description, canonical (count and absolute),
// H1 count, heading order, lang, Open Graph (incl. image size), Twitter Card,
// JSON-LD parse. Site-level: robots.txt, sitemap.xml, duplicate titles.
// Writes JSON and prints a summary. Exit 1 if errors exist.

import { readFile, writeFile, readdir, mkdir, rename, unlink } from "node:fs/promises";
import { join, extname, dirname, relative, resolve } from "node:path";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node <skill-folder>/scripts/audit.mjs --url <site> | --dir <build-dir> [options]

Options:
  --url <site>       Audit a live site (http: or https:). Reads robots.txt and
                     sitemap.xml, then crawls same-origin pages.
  --dir <build-dir>  Audit HTML files in a local directory instead.
  --out <file>       Report path. Default: seo-audit.json (in --dir mode it is
                     resolved next to <build-dir>; otherwise in the current dir).
  --max <N>          Maximum pages to audit (default 30).
  --allow-private    Allow localhost, loopback, link-local and private IPv4/IPv6
                     targets. Off by default to block SSRF.

Checks title, meta description, canonical, H1, heading order, lang, Open Graph,
Twitter Card, and JSON-LD per page. Checks robots.txt and sitemap.xml when
--url is used. Writes a JSON report. Exit 1 if errors exist, 2 on bad usage.
Requires Node.js >= 18. Runnable from any directory.`);
  process.exit(0);
}

if (typeof fetch !== "function") {
  console.error("This script needs global fetch. Install Node.js 18 or newer.");
  process.exit(2);
}

// A flag needs a value that is present and does not look like another flag.
function arg(name, fallback = null) {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  const value = args[i + 1];
  if (value === undefined || value.startsWith("-")) {
    console.error(`Missing value for ${name}. Pass it as ${name} <value>.`);
    process.exit(2);
  }
  return value;
}

const urlArg = arg("--url");
const dirArg = arg("--dir");
const outGiven = args.includes("--out");
const outArg = outGiven ? arg("--out") : null;
const maxRaw = Number(arg("--max", "30"));
const allowPrivate = args.includes("--allow-private");

if (urlArg && dirArg) {
  console.error("Use either --url or --dir, not both.");
  process.exit(2);
}
if (!urlArg && !dirArg) {
  console.error("Usage: node <skill-folder>/scripts/audit.mjs --url <site> | --dir <build-dir> [options]");
  console.error("Run with --help for the option list.");
  process.exit(2);
}
if (!Number.isFinite(maxRaw) || maxRaw < 1) {
  console.error(`Invalid --max value: ${arg("--max", "")}. Use a positive number.`);
  process.exit(2);
}
const maxPages = Math.floor(maxRaw);

function ipv4Parts(host) {
  const dotted = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (dotted) {
    const parts = dotted.slice(1).map(Number);
    return parts.every((n) => n <= 255) ? parts : null;
  }
  const single = host.match(/^(?:0x([0-9a-f]+)|\d+)$/i);
  if (single) {
    const n = single[1] ? parseInt(single[1], 16) : Number(host);
    if (Number.isFinite(n) && n >= 0 && n <= 0xffffffff) {
      return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
    }
  }
  return null;
}

// True for loopback, link-local, private, documentation and multicast hosts.
function isPrivateHost(hostname) {
  let host = hostname.toLowerCase().replace(/\.$/, "");
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;

  const v4 = ipv4Parts(host);
  if (v4) {
    const [a, b] = v4;
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 168)) ||
      (a === 198 && (b === 18 || b === 19 || b === 51)) ||
      (a === 203 && b === 0) ||
      a >= 224
    );
  }

  if (host.includes(":")) {
    const mapped = host.match(/^(?:::ffff:|0:0:0:0:0:ffff:)(.+)$/);
    if (mapped) {
      const inner = ipv4Parts(mapped[1]);
      if (inner) return isPrivateHost(inner.join("."));
      const hex = mapped[1].match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
      if (hex) {
        const hi = parseInt(hex[1], 16);
        const lo = parseInt(hex[2], 16);
        return isPrivateHost(`${(hi >>> 8) & 255}.${hi & 255}.${(lo >>> 8) & 255}.${lo & 255}`);
      }
    }
    if (host === "::1" || host === "::") return true;
    if (/^f[cd][0-9a-f]{0,2}:/.test(host)) return true;
    if (/^fe[89ab][0-9a-f]?:/.test(host)) return true;
  }
  return false;
}

if (urlArg) {
  let parsed = null;
  try { parsed = new URL(urlArg); }
  catch { parsed = null; }
  if (!parsed) {
    console.error(`Invalid --url value: ${urlArg}. Provide an absolute URL such as https://example.com.`);
    process.exit(2);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    console.error(`Unsupported URL scheme "${parsed.protocol}" in --url. Only http: and https: are accepted.`);
    process.exit(2);
  }
  if (!parsed.hostname) {
    console.error(`Invalid --url value: ${urlArg}. A host name is required.`);
    process.exit(2);
  }
  if (!allowPrivate && isPrivateHost(parsed.hostname)) {
    console.error(`Refusing to audit private or loopback host "${parsed.hostname}". Pass --allow-private to override.`);
    process.exit(2);
  }
}

const results = { generatedAt: new Date().toISOString(), mode: null, pages: [], site: {}, errors: 0, warnings: 0 };
const titleIndex = new Map();
results.site.errors = [];

function addSiteError(rule, detail) {
  results.errors++;
  results.site.errors.push({ rule, detail });
}

function stripTags(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Reads one attribute value from a tag. Accepts double-quoted, single-quoted
// and unquoted HTML5 values.
function attrValue(tag, name) {
  const safe = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:^|\\s)${safe}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, "i");
  const m = tag.match(re);
  if (!m) return null;
  return (m[1] ?? m[2] ?? m[3] ?? "").trim();
}

function metaTags(html) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
}
function metas(html, key, attr = "name") {
  const wanted = key.toLowerCase();
  return metaTags(html)
    .filter((tag) => (attrValue(tag, attr) || "").toLowerCase() === wanted)
    .map((tag) => attrValue(tag, "content") ?? "");
}
function meta(html, key, attr = "name") {
  const all = metas(html, key, attr);
  return all.length ? all[0] : null;
}
function links(html, rel) {
  const wanted = rel.toLowerCase();
  return [...html.matchAll(/<link\b[^>]*>/gi)]
    .filter((m) => (attrValue(m[0], "rel") || "").toLowerCase().split(/\s+/).includes(wanted))
    .map((m) => attrValue(m[0], "href") ?? "");
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

  // Read name/content regardless of attribute order and accept "none".
  const robotDirectives = [...metas(html, "robots"), ...metas(html, "googlebot")];
  const noindex = robotDirectives.some((content) => {
    const value = content.toLowerCase();
    return /\bnoindex\b/.test(value) || /\bnone\b/.test(value);
  });
  if (noindex) push("warning", "noindex", "Page declares noindex.");

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const noAlt = imgs.filter((t) => !/\balt=/.test(t)).length;
  if (noAlt) push("warning", "img-alt-missing", `${noAlt} of ${imgs.length} images lack alt.`);

  const body = stripTags(html.replace(/<head[\s\S]*?<\/head>/i, ""));
  if (body.length < 200) push("warning", "thin-content", `Rendered text is ${body.length} chars.`);
  return entry;
}

const MAX_BYTES = 2 * 1024 * 1024;
const CONCURRENCY = 4;

async function readLimited(res, limit) {
  if (!res.body) {
    const text = await res.text();
    return { text: text.slice(0, limit), truncated: false };
  }
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  let truncated = false;
  for (;;) {
    const step = await reader.read();
    if (step.done) break;
    const chunk = step.value;
    total += chunk.byteLength;
    if (total > limit) {
      const keep = chunk.byteLength - (total - limit);
      if (keep > 0) chunks.push(chunk.subarray(0, keep));
      truncated = true;
      try { await reader.cancel(); } catch { /* ignore */ }
      break;
    }
    chunks.push(chunk);
  }
  const buf = Buffer.concat(chunks.map((c) => Buffer.from(c.buffer, c.byteOffset, c.byteLength)));
  return { text: buf.toString("utf8"), truncated };
}

// htmlOnly gates on content-type so only HTML pages are parsed. robots.txt and
// sitemap.xml calls pass htmlOnly: false.
async function fetchText(url, { timeoutMs = 20000, htmlOnly = false, maxBytes = MAX_BYTES } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "user-agent": "webmaster-skill-seo-audit/0.1" } });
    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    const finalUrl = res.url || url;
    if (htmlOnly && contentType && !/text\/html|application\/xhtml\+xml/.test(contentType)) {
      try { await res.body?.cancel(); } catch { /* ignore */ }
      return { status: res.status, url: finalUrl, contentType, skipped: true, text: "", truncated: false };
    }
    const { text, truncated } = await readLimited(res, maxBytes);
    return { status: res.status, url: finalUrl, contentType, text, truncated, skipped: false };
  } finally {
    clearTimeout(timer);
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = next++;
      if (index >= items.length) return;
      out[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return out;
}

const SKIP_DIRS = new Set(["node_modules", ".git"]);

async function walk(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await walk(p, acc);
    } else if (entry.isFile() && [".html", ".htm"].includes(extname(p).toLowerCase())) {
      acc.push(p);
    }
  }
  return acc;
}

// Page identity: path plus query string. A trailing "index.html" is folded to
// "/" so /about/ and /about are the same page, but ?page=2 stays distinct.
function pageKey(url) {
  const path = url.pathname.replace(/\/index\.html?$/i, "/").replace(/\/+$/, "") || "/";
  return path + url.search;
}

function robotsRuleToRegex(rule) {
  let body = rule.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  body = body.replace(/\\\$$/, "$");
  return new RegExp(`^${body}`);
}

function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  let current = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (field === "sitemap") { sitemaps.push(value); continue; }
    if (!current) continue;
    if (field === "disallow" || field === "allow") current.rules.push({ type: field, path: value });
  }
  return { groups, sitemaps };
}

function robotsAllows(key, groups) {
  const applicable = groups.filter((g) => g.agents.some((a) => a === "*" || a.includes("webmaster-skill")));
  let best = null;
  for (const group of applicable) {
    for (const rule of group.rules) {
      if (!rule.path || !rule.path.startsWith("/")) continue;
      if (!robotsRuleToRegex(rule.path).test(key)) continue;
      const length = rule.path.replace(/\*/g, "").length;
      if (!best || length > best.length || (length === best.length && rule.type === "allow")) {
        best = { length, type: rule.type };
      }
    }
  }
  return !best || best.type === "allow";
}

async function runUrl(base) {
  results.mode = "url";
  let home;
  try { home = await fetchText(base, { htmlOnly: true }); }
  catch (e) { console.error(`Cannot reach ${base}: ${e.message}`); process.exit(2); }
  if (home.skipped) {
    console.error(`Cannot audit ${base}: content-type is ${home.contentType || "unknown"}, not text/html.`);
    process.exit(2);
  }

  const startUrl = home.url || base;
  const origin = new URL(startUrl).origin;

  // robots.txt is read before any crawl so Disallow rules apply to discovery.
  let robots = null;
  try {
    const r = await fetchText(origin + "/robots.txt", { maxBytes: 512 * 1024 });
    robots = parseRobots(r.text);
    const blocksAll = !robotsAllows("/", robots.groups);
    results.site.robots = { status: r.status, hasSitemap: robots.sitemaps.length > 0, blocksAll };
    if (r.status !== 200) addSiteError("robots-not-200", "robots.txt is not 200.");
    if (blocksAll) addSiteError("robots-blocks-all", "robots.txt disallows the whole site.");
  } catch (e) {
    results.site.robots = { error: e.message };
    addSiteError("robots-fetch-failed", e.message);
  }

  const homeEntry = auditHtml(home.text, startUrl, home.status);
  if (home.truncated) homeEntry.truncated = true;

  const hrefs = [...home.text.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
  const seen = new Set([pageKey(new URL(startUrl))]);
  const queue = [];
  for (const href of hrefs) {
    let abs;
    try { abs = new URL(href, startUrl); }
    catch { continue; }
    if (abs.origin !== origin) continue;
    if (abs.pathname.match(/\.(css|js|png|jpe?g|svg|webp|avif|ico|pdf|zip|xml|txt)$/i)) continue;
    const key = pageKey(abs);
    if (seen.has(key)) continue;
    seen.add(key);
    queue.push({ key, url: origin + key });
  }

  const allowed = robots ? queue.filter((item) => robotsAllows(item.key, robots.groups)) : queue;
  const skippedByRobots = queue.length - allowed.length;
  if (skippedByRobots > 0) results.site.robotsSkipped = skippedByRobots;

  const batch = allowed.slice(0, Math.max(0, maxPages - 1));
  results.site.linksDiscovered = queue.length + 1;
  results.site.truncated = allowed.length > batch.length;

  const fetched = await mapLimit(batch, CONCURRENCY, async (item) => {
    try { return { item, res: await fetchText(item.url, { htmlOnly: true }) }; }
    catch (e) { return { item, error: e }; }
  });

  for (const { item, res, error } of fetched) {
    if (error) {
      results.pages.push({ url: item.url, status: null, findings: [{ level: "error", rule: "fetch-failed", detail: error.message }] });
      results.errors++;
      continue;
    }
    if (res.skipped) {
      results.pages.push({ url: res.url || item.url, status: res.status, findings: [], skipped: `content-type: ${res.contentType || "unknown"}` });
      results.site.skipped = (results.site.skipped || 0) + 1;
      continue;
    }
    const entry = auditHtml(res.text, res.url || item.url, res.status);
    if (res.url && res.url !== item.url) entry.requestedUrl = item.url;
    if (res.truncated) entry.truncated = true;
  }

  try {
    const sm = await fetchText(origin + "/sitemap.xml", { maxBytes: 512 * 1024 });
    const locs = [...sm.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
    results.site.sitemap = { status: sm.status, urls: locs.length, absolute: locs.every((u) => /^https?:\/\//i.test(u)) };
    if (sm.status !== 200) addSiteError("sitemap-not-200", "sitemap.xml is not 200.");
    if (locs.length === 0) addSiteError("sitemap-empty", "sitemap.xml has no <loc> entries.");
  } catch (e) {
    results.site.sitemap = { error: e.message };
    addSiteError("sitemap-fetch-failed", e.message);
  }
}

async function runDir(dir) {
  results.mode = "dir";
  const root = resolve(dir);
  const files = await walk(root);
  if (!files.length) { console.error(`No HTML files under ${dir}.`); process.exit(2); }

  const relPath = (f) => relative(root, f).split("\\").join("/");
  const sorted = [...files].sort((a, b) => relPath(a).localeCompare(relPath(b)));
  const isIndex = (f) => /(^|\/)index\.html?$/i.test(relPath(f));
  const ordered = [...sorted.filter(isIndex), ...sorted.filter((f) => !isIndex(f))];
  const rels = ordered.slice(0, maxPages);

  for (const f of rels) {
    const html = await readFile(f, "utf8");
    auditHtml(html, "/" + relPath(f), 200);
  }
  results.site.filesTotal = files.length;
  results.site.truncated = files.length > rels.length;
}

async function writeReport(outPath, payload) {
  await mkdir(dirname(outPath), { recursive: true });
  const tmp = `${outPath}.tmp-${process.pid}-${Date.now()}`;
  try {
    await writeFile(tmp, payload, "utf8");
    await rename(tmp, outPath);
  } catch (e) {
    try { await unlink(tmp); } catch { /* ignore */ }
    throw e;
  }
}

const defaultOut = dirArg ? join(resolve(dirArg), "seo-audit.json") : resolve("seo-audit.json");
const outPath = outArg ? resolve(outArg) : defaultOut;

try {
  if (urlArg) await runUrl(urlArg);
  else await runDir(dirArg);

  const payload = JSON.stringify(results, null, 2);
  await writeReport(outPath, payload);
  console.log(`Pages: ${results.pages.length} | errors: ${results.errors} | warnings: ${results.warnings}`);
  if (results.site.skipped) console.log(`Skipped (non-HTML): ${results.site.skipped}`);
  if (results.site.robotsSkipped) console.log(`Skipped by robots.txt: ${results.site.robotsSkipped}`);
  console.log(`Report: ${outPath}${outGiven ? "" : " (default path)"}`);
  if (results.errors > 0) {
    console.log("Top errors:");
    for (const p of results.pages) {
      for (const f of p.findings.filter((x) => x.level === "error").slice(0, 3)) {
        console.log(`  ${p.url}: ${f.rule} — ${f.detail}`);
      }
    }
    for (const f of results.site.errors) console.log(`  site: ${f.rule} — ${f.detail}`);
    process.exit(1);
  }
} catch (e) {
  console.error(`Audit failed: ${e.message}`);
  process.exit(2);
}
