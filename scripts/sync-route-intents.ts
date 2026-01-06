#!/usr/bin/env npx tsx
/**
 * Syncs intent metadata from route files into routes.ts as inline comments.
 *
 * Usage:
 *   npx tsx scripts/sync-route-intents.ts
 *
 * For each route in routes.ts, reads the file's front matter and adds/updates
 * an inline comment: // intent: <description>
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { parse } from "smol-toml";
import { join } from "path";

const ROUTES_FILE = "app/routes.ts";
const APP_DIR = "app";

const FRONTMATTER_START = "/*+++";
const FRONTMATTER_END = "+++*/";

function extractIntent(filepath: string): string | null {
  const fullPath = join(APP_DIR, filepath);

  if (!existsSync(fullPath)) {
    return null;
  }

  const content = readFileSync(fullPath, "utf-8");

  if (!content.startsWith(FRONTMATTER_START)) {
    return null;
  }

  const endIndex = content.indexOf(FRONTMATTER_END);
  if (endIndex === -1) {
    return null;
  }

  const tomlContent = content.slice(FRONTMATTER_START.length + 1, endIndex);

  try {
    const frontmatter = parse(tomlContent);
    return typeof frontmatter.intent === "string" ? frontmatter.intent : null;
  } catch {
    return null;
  }
}

function processLine(line: string): string {
  // Match route patterns: route("...", "routes/file.tsx"), index("routes/file.tsx"), layout("routes/file.tsx", ...)
  const routeMatch = line.match(/(?:route|index|layout)\s*\(\s*(?:"[^"]*"\s*,\s*)?"(routes\/[^"]+)"/);

  if (!routeMatch) {
    return line;
  }

  const filePath = routeMatch[1];
  const intent = extractIntent(filePath);

  if (!intent) {
    return line;
  }

  // Remove existing intent comment if present
  const lineWithoutIntent = line.replace(/\s*\/\/\s*intent:.*$/, "");

  // Remove trailing comma temporarily to add comment before it
  const hasTrailingComma = lineWithoutIntent.trimEnd().endsWith(",");
  const lineBase = hasTrailingComma
    ? lineWithoutIntent.trimEnd().slice(0, -1)
    : lineWithoutIntent.trimEnd();

  // Add the intent comment
  const newLine = `${lineBase}, // intent: ${intent}`;

  return newLine;
}

function main(): void {
  const content = readFileSync(ROUTES_FILE, "utf-8");
  const lines = content.split("\n");

  const newLines = lines.map(processLine);
  const newContent = newLines.join("\n");

  if (newContent !== content) {
    writeFileSync(ROUTES_FILE, newContent);
    console.log("Updated routes.ts with intent comments");
  } else {
    console.log("No changes needed");
  }
}

main();
