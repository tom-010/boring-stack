#!/usr/bin/env npx tsx
/**
 * Route health checker for CI/model feedback.
 *
 * Crawls all routes, follows links to parameterized routes, expects 200s.
 * Only tests loaders (GET), not actions. Errors written to route-check-errors/.
 *
 * Usage: npx tsx check-routes.ts [-p|--progress] [-v|--verbose]
 */

import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// --- CLI Args ---
const args = process.argv.slice(2);
const VERBOSE = args.includes("--verbose") || args.includes("-v");
const PROGRESS = args.includes("--progress") || args.includes("-p");
const OUTPUT_DIR = path.join(process.cwd(), "route-check-errors");
const MAX_CONCURRENT = 10;

// --- Configuration ---
const CONFIG = {
  baseUrl: "http://localhost:5173",
  routesFile: path.join(process.cwd(), "app/routes.ts"),
  curlScript: "./scripts/curl-auth.sh",
  ignorePatterns: [/\*/, /^api\//, /^login$/],
};

// --- Types ---
interface RouteDef {
  template: string;
  paramNames: string[];
  matcher: RegExp;
}

interface CheckResult {
  url: string;
  template: string | null;
  status: number;
  body: string;
}

// --- State ---
const routeRegistry = new Map<string, RouteDef>();
const visited = new Set<string>();
const pending = new Set<string>();
let errorCount = 0;
let totalChecked = 0;

// --- Logging ---
function log(message: string) {
  if (VERBOSE) {
    console.log(message);
  }
}

function logProgress() {
  if (PROGRESS || VERBOSE) {
    process.stdout.write(`\rchecked: ${totalChecked}, errors: ${errorCount}, pending: ${pending.size}    `);
  }
}

function clearProgress() {
  if (PROGRESS || VERBOSE) {
    process.stdout.write("\r" + " ".repeat(60) + "\r");
  }
}

// --- Route Parsing ---
function parseRouteTemplate(template: string): RouteDef {
  const normalized = template.startsWith("/") ? template : `/${template}`;
  const paramNames: string[] = [];
  const paramRegex = /:([a-zA-Z0-9_]+)/g;
  let match;
  while ((match = paramRegex.exec(normalized)) !== null) {
    paramNames.push(match[1]);
  }
  let regexStr = normalized.replace(/\//g, "\\/");
  regexStr = regexStr.replace(/:[a-zA-Z0-9_]+/g, "[^\\/]+");
  return {
    template: normalized,
    paramNames,
    matcher: new RegExp(`^${regexStr}\\/?$`),
  };
}

function initializeRoutes(filePath: string): string[] {
  if (!fs.existsSync(filePath)) {
    console.error(`error: routes file not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const rawRoutes = new Set<string>();
  const regexes = [
    /route\(\s*["']([^"']+)["']/g,
    /path:\s*["']([^"']+)["']/g,
  ];

  regexes.forEach((rx) => {
    let m;
    while ((m = rx.exec(content)) !== null) rawRoutes.add(m[1]);
  });

  if (/index\s*\(/.test(content)) rawRoutes.add("/");

  const seedUrls: string[] = [];
  rawRoutes.forEach((raw) => {
    if (CONFIG.ignorePatterns.some((p) => p.test(raw))) return;
    const def = parseRouteTemplate(raw);
    routeRegistry.set(def.template, def);
    if (def.paramNames.length === 0) {
      seedUrls.push(def.template);
    }
  });

  log(`initialized ${routeRegistry.size} routes`);
  return seedUrls;
}

function matchUrlToTemplate(url: string): string | null {
  for (const [template, def] of routeRegistry) {
    if (def.matcher.test(url)) {
      return template;
    }
  }
  return null;
}

// --- Output ---
function setupOutputDir() {
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function writeErrorFile(result: CheckResult): string {
  const safeName = result.url.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 100);
  const filename = `${safeName}.html`;
  const filepath = path.join(OUTPUT_DIR, filename);
  const relativePath = path.relative(process.cwd(), filepath);

  // Extract <body> content if valid HTML, otherwise dump everything
  let content = result.body;
  const bodyMatch = result.body.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    content = bodyMatch[1];
  }

  const header = `URL: ${result.url}
Template: ${result.template || "unknown"}
Status: ${result.status}
Time: ${new Date().toISOString()}
================================================================================

`;

  fs.writeFileSync(filepath, header + content);
  return relativePath;
}

function cleanupOutputDir() {
  if (fs.existsSync(OUTPUT_DIR)) {
    const files = fs.readdirSync(OUTPUT_DIR);
    if (files.length === 0) {
      fs.rmSync(OUTPUT_DIR, { recursive: true });
    }
  }
}

// --- URL Processing ---
async function processUrl(urlPath: string): Promise<{ result: CheckResult | null; discoveredUrls: string[] }> {
  const fullUrl = `${CONFIG.baseUrl}${urlPath}`;
  const template = matchUrlToTemplate(urlPath);
  const discoveredUrls: string[] = [];

  try {
    const { stdout, stderr } = await execFileAsync(CONFIG.curlScript, [
      "-s", "-L", "-w", "\nHTTP_CODE:%{http_code}", fullUrl,
    ]);

    if (stderr) {
      return {
        result: { url: urlPath, template, status: 0, body: `curl error: ${stderr.trim()}` },
        discoveredUrls,
      };
    }

    const sepIndex = stdout.lastIndexOf("\nHTTP_CODE:");
    if (sepIndex === -1) {
      return {
        result: { url: urlPath, template, status: 0, body: "failed to parse curl response" },
        discoveredUrls,
      };
    }

    const body = stdout.substring(0, sepIndex);
    const status = parseInt(stdout.substring(sepIndex + 11).trim(), 10);

    if (status >= 400) {
      return {
        result: { url: urlPath, template, status, body },
        discoveredUrls,
      };
    }

    // Harvest links
    const hrefRegex = /href=["']([^"']+)["']/g;
    let match;
    while ((match = hrefRegex.exec(body)) !== null) {
      let link = match[1];
      if (link.startsWith("http") && !link.startsWith(CONFIG.baseUrl)) continue;
      if (link.startsWith(CONFIG.baseUrl)) {
        link = link.replace(CONFIG.baseUrl, "");
      }
      link = link.split("?")[0].split("#")[0];
      if (!link) continue;
      const cleanLink = link.startsWith("/") ? link : `/${link}`;
      if (!visited.has(cleanLink) && !pending.has(cleanLink) && matchUrlToTemplate(cleanLink)) {
        discoveredUrls.push(cleanLink);
      }
    }

    return { result: null, discoveredUrls };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      result: { url: urlPath, template, status: 0, body: `exception: ${msg}` },
      discoveredUrls,
    };
  }
}

// --- Main ---
async function run() {
  setupOutputDir();

  const seedUrls = initializeRoutes(CONFIG.routesFile);
  if (seedUrls.length === 0) {
    console.error("error: no routes to check");
    process.exit(1);
  }

  log(`starting crawl on ${CONFIG.baseUrl}`);

  // Initialize queue
  const queue: string[] = [...seedUrls];
  seedUrls.forEach((u) => pending.add(u));

  // Process with parallelism
  const inFlight = new Map<string, Promise<void>>();

  async function processOne(url: string) {
    const { result, discoveredUrls } = await processUrl(url);

    pending.delete(url);
    visited.add(url);
    totalChecked++;

    if (result) {
      errorCount++;
      const errorFile = writeErrorFile(result);
      console.error(`[${result.status}] ${result.url} -> ${errorFile}`);
    } else {
      log(`ok ${url}`);
    }

    // Add discovered URLs to queue
    for (const discovered of discoveredUrls) {
      if (!visited.has(discovered) && !pending.has(discovered)) {
        pending.add(discovered);
        queue.push(discovered);
      }
    }

    logProgress();
  }

  while (queue.length > 0 || inFlight.size > 0) {
    // Fill up to MAX_CONCURRENT
    while (queue.length > 0 && inFlight.size < MAX_CONCURRENT) {
      const url = queue.shift()!;
      if (visited.has(url)) continue;

      const promise = processOne(url).finally(() => {
        inFlight.delete(url);
      });
      inFlight.set(url, promise);
    }

    // Wait for at least one to complete
    if (inFlight.size > 0) {
      await Promise.race(inFlight.values());
    }
  }

  clearProgress();
  cleanupOutputDir();

  if (errorCount > 0) {
    console.error(`${errorCount} error(s), see ${OUTPUT_DIR}/`);
    process.exit(1);
  }

  if (VERBOSE) {
    console.log(`checked ${totalChecked} routes, all ok`);
  }
}

run();
