import { createHash, randomUUID } from 'crypto';
import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync, mkdirSync } from 'fs';
import { resolve, join, basename } from 'path';

// --- Data Structure ---

export interface LineSpan {
  start: number;
  end: number;
}

export interface Feature {
  category: string;
  name: string;
  id: string;
  content: string;
  hash: string;
  lineSpan: LineSpan;
}

export interface TestFileHeader {
  id: string;
  category: string;
  name: string;
  hash: string;
  content: string;
  filePath: string;
}

export type SyncAction =
  | { type: 'create'; feature: Feature }
  | { type: 'update'; feature: Feature; oldHash: string; filePath: string }
  | { type: 'delete'; testFile: TestFileHeader };

class FeatureItem implements Feature {
  category: string;
  name: string;
  id: string;
  content: string;
  hash: string;
  lineSpan: LineSpan;

  constructor(category: string, name: string, content: string, lineSpan: LineSpan, id?: string) {
    this.category = category;
    this.name = name;
    this.id = id || randomUUID();
    this.lineSpan = lineSpan;
    this.content = content.trim();
    this.hash = this.calculateHash();
  }

  private calculateHash(): string {
    const normalized = this.content.toLowerCase().replace(/\s+/g, '');
    return createHash('md5').update(normalized).digest('hex');
  }
}

// --- Parser ---

export function parseFeatureText(text: string): Feature[] {
  const lines = text.split('\n');
  const features: Feature[] = [];

  let currentCategory: string | null = null;
  let currentName: string | null = null;
  let currentStartLine: number = 0;
  let contentBuffer: string[] = [];

  const commitFeature = (triggerLineIndex: number) => {
    if (currentName && currentCategory) {
      let id: string | undefined;

      let startIndex = 0;
      while (startIndex < contentBuffer.length && contentBuffer[startIndex].trim() === '') {
        startIndex++;
      }

      if (startIndex < contentBuffer.length) {
        const firstLine = contentBuffer[startIndex].trim();
        const idMatch = firstLine.match(/^id:\s*(.+)$/i);

        if (idMatch) {
          id = idMatch[1];
          contentBuffer.splice(startIndex, 1);
        }
      }

      const finalContent = contentBuffer.join('\n');
      const endLine = triggerLineIndex;

      features.push(
        new FeatureItem(currentCategory, currentName, finalContent, { start: currentStartLine, end: endLine }, id)
      );
    }
    contentBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    if (line.startsWith('# ')) {
      commitFeature(i);
      currentCategory = line.substring(2).trim();
      currentName = null;
    } else if (line.startsWith('## ')) {
      commitFeature(i);
      currentName = line.substring(3).trim();
      currentStartLine = lineNumber;
    } else {
      if (currentCategory && currentName) {
        contentBuffer.push(line);
      }
    }
  }

  commitFeature(lines.length);

  return features;
}

// --- Test File Header Parser ---

export function parseTestFileHeader(filePath: string): TestFileHeader | null {
  let text: string;
  try {
    text = readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }

  // Match /*feature: ... */ block at the start
  const headerMatch = text.match(/^\/\*\s*feature:\s*\n([\s\S]*?)\*\//);
  if (!headerMatch) return null;

  const yamlContent = headerMatch[1];

  // Simple YAML-like parsing
  const idMatch = yamlContent.match(/^\s*id:\s*(.+)$/m);
  const categoryMatch = yamlContent.match(/^\s*category:\s*(.+)$/m);
  const nameMatch = yamlContent.match(/^\s*name:\s*(.+)$/m);
  const hashMatch = yamlContent.match(/^\s*hash:\s*(.+)$/m);

  // Parse multiline content
  const contentMatch = yamlContent.match(/^\s*content:\s*\|\s*\n([\s\S]*?)(?=\n\s*\w+:|$)/m);
  let content = '';
  if (contentMatch) {
    content = contentMatch[1]
      .split('\n')
      .map((line) => line.replace(/^\s{4}/, ''))
      .join('\n')
      .trim();
  }

  if (!idMatch) return null;

  return {
    id: idMatch[1].trim(),
    category: categoryMatch?.[1].trim() || '',
    name: nameMatch?.[1].trim() || '',
    hash: hashMatch?.[1].trim() || '',
    content,
    filePath,
  };
}

// --- Scan Test Directory ---

export function scanTestFiles(testsDir: string): TestFileHeader[] {
  if (!existsSync(testsDir)) return [];

  const files = readdirSync(testsDir);
  const headers: TestFileHeader[] = [];

  for (const file of files) {
    if (file.startsWith('feature-') && file.endsWith('.spec.ts')) {
      const filePath = join(testsDir, file);
      const header = parseTestFileHeader(filePath);
      if (header) {
        headers.push(header);
      }
    }
  }

  return headers;
}

// --- Diff / Sync Logic ---

export function computeSyncActions(features: Feature[], testFiles: TestFileHeader[]): SyncAction[] {
  const actions: SyncAction[] = [];
  const featureById = new Map(features.map((f) => [f.id, f]));
  const testFileById = new Map(testFiles.map((t) => [t.id, t]));

  // Check for creates and updates
  for (const feature of features) {
    const testFile = testFileById.get(feature.id);
    if (!testFile) {
      actions.push({ type: 'create', feature });
    } else if (testFile.hash !== feature.hash) {
      actions.push({ type: 'update', feature, oldHash: testFile.hash, filePath: testFile.filePath });
    }
  }

  // Check for deletes (test files with no matching feature)
  for (const testFile of testFiles) {
    if (!featureById.has(testFile.id)) {
      actions.push({ type: 'delete', testFile });
    }
  }

  return actions;
}

// --- Generate Test File Header ---

export function generateTestFileHeader(feature: Feature): string {
  const contentLines = feature.content
    .split('\n')
    .map((line) => '    ' + line)
    .join('\n');

  return `/*feature:
  id: ${feature.id}
  category: ${feature.category}
  name: ${feature.name}
  hash: ${feature.hash}
  content: |
${contentLines}
*/`;
}

// --- Pretty Printer (Markdown) ---

export function stringifyFeatures(features: Feature[]): string {
  let output = '';
  let lastCategory: string | null = null;

  features.forEach((feature) => {
    if (feature.category !== lastCategory) {
      if (lastCategory !== null) output += '\n';
      output += `# ${feature.category}\n\n`;
      lastCategory = feature.category;
    }

    output += `## ${feature.name}\n`;
    output += `id: ${feature.id}\n\n`;
    output += `${feature.content}\n\n`;
  });

  return output.trim() + '\n';
}

// --- YAML Output ---

function escapeYamlString(str: string): string {
  if (str.includes('\n') || str.includes(':') || str.includes('#') || str.startsWith(' ')) {
    return `|\n${str
      .split('\n')
      .map((line) => '    ' + line)
      .join('\n')}`;
  }
  return str;
}

export function stringifyFeaturesYaml(features: Feature[]): string {
  let output = 'features:\n';

  features.forEach((feature) => {
    output += `  - id: ${feature.id}\n`;
    output += `    category: ${feature.category}\n`;
    output += `    name: ${feature.name}\n`;
    output += `    hash: ${feature.hash}\n`;
    output += `    lineSpan:\n`;
    output += `      start: ${feature.lineSpan.start}\n`;
    output += `      end: ${feature.lineSpan.end}\n`;
    output += `    content: ${escapeYamlString(feature.content)}\n`;
  });

  return output;
}

// --- CLI ---

function printUsage() {
  console.log(`Usage: npx tsx scripts/parse-features.ts [command] [options]

Commands:
  (default)       Parse and pretty-print features.md
  diff            Compare features.md with tests/ and show required actions

Options:
  --yaml          Output as YAML instead of Markdown
  --write         Write back to the source file (Markdown only)
  --output <file> Write output to specified file
  --tests <dir>   Tests directory (default: tests/)
  --create        Create empty test files for missing features (diff mode)
  --delete        Delete orphaned test files (diff mode)
  --max <n>       Limit output to n actions (diff mode)
  -h, --help      Show this help

Arguments:
  file            Path to features file (default: features.md)

Examples:
  npx tsx scripts/parse-features.ts                    # Pretty print
  npx tsx scripts/parse-features.ts --yaml             # Output as YAML
  npx tsx scripts/parse-features.ts diff               # Show sync actions
  npx tsx scripts/parse-features.ts diff --yaml        # Actions as YAML
  npx tsx scripts/parse-features.ts diff --create      # Create missing test files
  npx tsx scripts/parse-features.ts diff --delete      # Delete orphaned test files
  npx tsx scripts/parse-features.ts diff --max 5       # Show only 5 actions`);
}

function generateEmptyTestFile(feature: Feature): string {
  const header = generateTestFileHeader(feature);
  return `${header}

import { test, expect } from '@playwright/test';

test.describe('${feature.name}', () => {
  test('placeholder', async ({ page }) => {
    // TODO: implement test for: ${feature.name}
  });
});
`;
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  const isDiffMode = args.includes('diff');
  const yamlMode = args.includes('--yaml');
  const writeBack = args.includes('--write');
  const doCreate = args.includes('--create');
  const doDelete = args.includes('--delete');

  let maxActions: number | null = null;
  const maxIndex = args.indexOf('--max');
  if (maxIndex !== -1 && args[maxIndex + 1]) {
    maxActions = parseInt(args[maxIndex + 1], 10);
    if (isNaN(maxActions)) maxActions = null;
  }

  let outputFile: string | null = null;
  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    outputFile = args[outputIndex + 1];
  }

  let testsDir = resolve(process.cwd(), 'tests');
  const testsIndex = args.indexOf('--tests');
  if (testsIndex !== -1 && args[testsIndex + 1]) {
    testsDir = resolve(process.cwd(), args[testsIndex + 1]);
  }

  // Find input file
  const skipArgs = new Set([
    'diff',
    '--yaml',
    '--write',
    '--create',
    '--delete',
    '--output',
    outputFile,
    '--tests',
    testsDir,
    '--max',
    args[maxIndex + 1],
  ]);
  const inputFile =
    args.find((arg) => !arg.startsWith('--') && !skipArgs.has(arg)) || resolve(process.cwd(), 'features.md');

  const filePath = resolve(process.cwd(), inputFile);

  let text: string;
  try {
    text = readFileSync(filePath, 'utf-8');
  } catch {
    console.error(`Error reading file: ${filePath}`);
    process.exit(1);
  }

  const features = parseFeatureText(text);

  if (isDiffMode) {
    const testFiles = scanTestFiles(testsDir);
    let actions = computeSyncActions(features, testFiles);
    const totalActions = actions.length;

    // Apply --max limit
    if (maxActions !== null && actions.length > maxActions) {
      actions = actions.slice(0, maxActions);
    }

    // Execute --create and --delete actions
    let createdCount = 0;
    let deletedCount = 0;

    if (doCreate || doDelete) {
      // Ensure tests directory exists
      if (doCreate && !existsSync(testsDir)) {
        mkdirSync(testsDir, { recursive: true });
      }

      for (const action of actions) {
        if (action.type === 'create' && doCreate) {
          const testFilePath = join(testsDir, `feature-${action.feature.id}.spec.ts`);
          writeFileSync(testFilePath, generateEmptyTestFile(action.feature));
          createdCount++;
        } else if (action.type === 'delete' && doDelete) {
          unlinkSync(action.testFile.filePath);
          deletedCount++;
        }
      }
    }

    if (yamlMode) {
      let output = 'actions:\n';
      if (actions.length === 0) {
        output += '  # No actions needed - tests are in sync\n';
      }
      for (const action of actions) {
        if (action.type === 'create') {
          output += `  - type: create\n`;
          output += `    id: ${action.feature.id}\n`;
          output += `    name: ${action.feature.name}\n`;
          output += `    category: ${action.feature.category}\n`;
          output += `    file: tests/feature-${action.feature.id}.spec.ts\n`;
          if (doCreate) {
            output += `    executed: true\n`;
          } else {
            // Include the template code for copy & paste
            const template = generateEmptyTestFile(action.feature);
            const indentedTemplate = template
              .split('\n')
              .map((line) => '      ' + line)
              .join('\n');
            output += `    code: |\n${indentedTemplate}\n`;
          }
        } else if (action.type === 'update') {
          output += `  - type: update\n`;
          output += `    id: ${action.feature.id}\n`;
          output += `    name: ${action.feature.name}\n`;
          output += `    file: ${action.filePath}\n`;
          output += `    oldHash: ${action.oldHash}\n`;
          output += `    newHash: ${action.feature.hash}\n`;
          // Include updated header for copy & paste
          const newHeader = generateTestFileHeader(action.feature);
          const indentedHeader = newHeader
            .split('\n')
            .map((line) => '      ' + line)
            .join('\n');
          output += `    newHeader: |\n${indentedHeader}\n`;
        } else if (action.type === 'delete') {
          output += `  - type: delete\n`;
          output += `    id: ${action.testFile.id}\n`;
          output += `    name: ${action.testFile.name}\n`;
          output += `    file: ${action.testFile.filePath}\n`;
          if (doDelete) output += `    executed: true\n`;
        }
      }
      if (maxActions !== null && totalActions > maxActions) {
        output += `  # ... and ${totalActions - maxActions} more action(s)\n`;
      }
      console.log(output);
    } else {
      if (actions.length === 0) {
        console.log('No actions needed - tests are in sync with features.md');
      } else {
        const limitNote = maxActions !== null && totalActions > maxActions ? ` (showing ${maxActions})` : '';
        console.log(`Found ${totalActions} action(s)${limitNote}:\n`);
        for (const action of actions) {
          if (action.type === 'create') {
            const status = doCreate ? ' [CREATED]' : '';
            console.log(`CREATE  ${action.feature.name}${status}`);
            console.log(`        id: ${action.feature.id}`);
            console.log(`        file: tests/feature-${action.feature.id}.spec.ts`);
            if (!doCreate) {
              console.log();
              console.log('--- begin code ---');
              console.log(generateEmptyTestFile(action.feature));
              console.log('--- end code ---');
            }
            console.log();
          } else if (action.type === 'update') {
            console.log(`UPDATE  ${action.feature.name}`);
            console.log(`        id: ${action.feature.id}`);
            console.log(`        file: ${basename(action.filePath)}`);
            console.log(`        hash: ${action.oldHash} -> ${action.feature.hash}`);
            console.log();
            console.log('--- new header ---');
            console.log(generateTestFileHeader(action.feature));
            console.log('--- end header ---');
            console.log();
          } else if (action.type === 'delete') {
            const status = doDelete ? ' [DELETED]' : '';
            console.log(`DELETE  ${action.testFile.name}${status}`);
            console.log(`        id: ${action.testFile.id}`);
            console.log(`        file: ${basename(action.testFile.filePath)}`);
            console.log();
          }
        }
        if (maxActions !== null && totalActions > maxActions) {
          console.log(`... and ${totalActions - maxActions} more action(s)`);
        }
      }

      // Summary for executed actions
      if (createdCount > 0 || deletedCount > 0) {
        console.log('---');
        if (createdCount > 0) console.log(`Created ${createdCount} test file(s)`);
        if (deletedCount > 0) console.log(`Deleted ${deletedCount} test file(s)`);
      }
    }
  } else {
    const output = yamlMode ? stringifyFeaturesYaml(features) : stringifyFeatures(features);

    if (writeBack && !yamlMode) {
      writeFileSync(filePath, output);
      console.error(`Written to ${filePath}`);
    } else if (outputFile) {
      writeFileSync(resolve(process.cwd(), outputFile), output);
      console.error(`Written to ${outputFile}`);
    } else {
      console.log(output);
    }
  }
}

main();
