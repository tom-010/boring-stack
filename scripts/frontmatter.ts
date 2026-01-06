#!/usr/bin/env npx tsx
/**
 * Manage TOML front matter in TSX files.
 *
 * Usage:
 *   npx tsx scripts/frontmatter.ts <file> get [key]      # Get all or specific key
 *   npx tsx scripts/frontmatter.ts <file> set <key> <value>
 *   npx tsx scripts/frontmatter.ts <file> delete <key>
 *
 * Examples:
 *   npx tsx scripts/frontmatter.ts app/routes/foo.tsx get
 *   npx tsx scripts/frontmatter.ts app/routes/foo.tsx get intent
 *   npx tsx scripts/frontmatter.ts app/routes/foo.tsx set intent "create-user"
 *   npx tsx scripts/frontmatter.ts app/routes/foo.tsx delete intent
 */

import { readFileSync, writeFileSync } from "fs";
import { parse, stringify } from "smol-toml";

const FRONTMATTER_START = "/*+++";
const FRONTMATTER_END = "+++*/";

interface ParsedFile {
  frontmatter: Record<string, unknown>;
  restOfFile: string;
  hasFrontmatter: boolean;
}

function parseFile(filepath: string): ParsedFile {
  const content = readFileSync(filepath, "utf-8");

  if (!content.startsWith(FRONTMATTER_START)) {
    return {
      frontmatter: {},
      restOfFile: content,
      hasFrontmatter: false,
    };
  }

  const endIndex = content.indexOf(FRONTMATTER_END);
  if (endIndex === -1) {
    throw new Error(`Malformed front matter: missing closing ${FRONTMATTER_END}`);
  }

  const tomlContent = content.slice(FRONTMATTER_START.length + 1, endIndex);
  const restOfFile = content.slice(endIndex + FRONTMATTER_END.length);

  const frontmatter = parse(tomlContent);

  return { frontmatter, restOfFile, hasFrontmatter: true };
}

function writeFile(filepath: string, parsed: ParsedFile): void {
  const { frontmatter, restOfFile } = parsed;

  const keys = Object.keys(frontmatter);
  if (keys.length === 0) {
    // Remove front matter entirely if empty
    const trimmedRest = restOfFile.replace(/^\n/, "");
    writeFileSync(filepath, trimmedRest);
    return;
  }

  const tomlStr = stringify(frontmatter);
  const newContent = `${FRONTMATTER_START}\n${tomlStr}${FRONTMATTER_END}${restOfFile}`;
  writeFileSync(filepath, newContent);
}

function get(filepath: string, key?: string): void {
  const { frontmatter, hasFrontmatter } = parseFile(filepath);

  if (!hasFrontmatter) {
    if (key) {
      process.exit(1); // Key not found
    }
    console.log("{}");
    return;
  }

  if (key) {
    if (key in frontmatter) {
      console.log(frontmatter[key]);
    } else {
      process.exit(1); // Key not found
    }
  } else {
    console.log(JSON.stringify(frontmatter, null, 2));
  }
}

function set(filepath: string, key: string, value: string): void {
  const parsed = parseFile(filepath);

  // Parse the value (try JSON first for complex types)
  let parsedValue: unknown = value;
  try {
    parsedValue = JSON.parse(value);
  } catch {
    // Keep as string
  }

  parsed.frontmatter[key] = parsedValue;

  if (!parsed.hasFrontmatter) {
    // Prepend newline to rest if it doesn't start with one
    if (!parsed.restOfFile.startsWith("\n")) {
      parsed.restOfFile = "\n" + parsed.restOfFile;
    }
  }

  writeFile(filepath, parsed);
  console.log(`Set ${key}=${value}`);
}

function del(filepath: string, key: string): void {
  const parsed = parseFile(filepath);

  if (!parsed.hasFrontmatter) {
    console.error(`No front matter in ${filepath}`);
    process.exit(1);
  }

  if (!(key in parsed.frontmatter)) {
    console.error(`Key "${key}" not found`);
    process.exit(1);
  }

  delete parsed.frontmatter[key];
  writeFile(filepath, parsed);
  console.log(`Deleted ${key}`);
}

function main(): void {
  const [, , filepath, command, ...args] = process.argv;

  if (!filepath || !command) {
    console.error(`Usage:
  npx tsx scripts/frontmatter.ts <file> get [key]
  npx tsx scripts/frontmatter.ts <file> set <key> <value>
  npx tsx scripts/frontmatter.ts <file> delete <key>`);
    process.exit(1);
  }

  switch (command) {
    case "get":
      get(filepath, args[0]);
      break;
    case "set":
      if (args.length < 2) {
        console.error("set requires <key> <value>");
        process.exit(1);
      }
      set(filepath, args[0], args.slice(1).join(" "));
      break;
    case "delete":
    case "del":
      if (!args[0]) {
        console.error("delete requires <key>");
        process.exit(1);
      }
      del(filepath, args[0]);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main();
