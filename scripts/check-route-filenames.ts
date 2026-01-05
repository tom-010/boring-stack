#!/usr/bin/env npx tsx
/**
 * Checks that route file paths only use [a-z0-9_-] characters.
 * Prints to stderr if violations found.
 */

import fs from "node:fs";
import path from "node:path";

const ROUTES_FILE = path.join(process.cwd(), "app/routes.ts");
const VALID_PATTERN = /^[a-z0-9_-]+$/;

function extractFilePaths(content: string): string[] {
  const paths: string[] = [];
  // Match route file paths like "routes/foo.tsx" or "routes/bar.ts"
  const regex = /["']routes\/([^"']+)["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    paths.push(match[1]);
  }
  return paths;
}

function checkFilename(filename: string): string | null {
  // Remove extension and get just the filename (not subdirs)
  const base = filename.replace(/\.(tsx?|js)$/, "");
  const name = base.split("/").pop()!;
  if (!VALID_PATTERN.test(name)) {
    return name;
  }
  return null;
}

function run() {
  if (!fs.existsSync(ROUTES_FILE)) {
    console.error(`routes file not found: ${ROUTES_FILE}`);
    process.exit(1);
  }

  const content = fs.readFileSync(ROUTES_FILE, "utf-8");
  const filePaths = extractFilePaths(content);
  let hasErrors = false;

  for (const filePath of filePaths) {
    const badSegment = checkFilename(filePath);
    if (badSegment) {
      hasErrors = true;
      console.error(`invalid route filename: routes/${filePath}`);
      console.error(`  segment "${badSegment}" contains invalid characters`);
      console.error(`  use only: a-z 0-9 - _`);
      console.error(`  note: filenames don't have to mimic the URL, just communicate intent`);
      console.error("");
    }
  }

  if (hasErrors) {
    process.exit(1);
  }
}

run();
