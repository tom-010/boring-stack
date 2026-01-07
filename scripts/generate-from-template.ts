/**
 * Template Code Generator
 *
 * This script generates TypeScript/React code from Nunjucks templates.
 * Designed for LLM usage - takes structured JSON config and produces route files.
 *
 * Usage:
 *   npx tsx scripts/generate-from-template.ts <template> <config.json> [output]
 *
 * Arguments:
 *   template    - Path to .njk template file (e.g., templates/table-list-view.njk)
 *   config.json - Path to JSON config file with template variables
 *   output      - Target path for generated file, or "-" for stdout
 *                 If omitted, prints to stdout (same as "-")
 *
 * Examples:
 *   # Write to file
 *   npx tsx scripts/generate-from-template.ts \
 *     templates/table-list-view.njk \
 *     templates/configs/my-todos2.json \
 *     app/routes/my-todos2.tsx
 *
 *   # Print to stdout (for copy-paste)
 *   npx tsx scripts/generate-from-template.ts \
 *     templates/table-only.njk \
 *     templates/configs/user-table.json
 *
 *   # Explicit stdout
 *   npx tsx scripts/generate-from-template.ts \
 *     templates/table-only.njk \
 *     templates/configs/user-table.json \
 *     -
 *
 * See templates/README.md for available templates and config schemas.
 */

import * as fs from "fs";
import * as path from "path";
import nunjucks from "nunjucks";

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2 || args.length > 3) {
    console.error("Usage: npx tsx scripts/generate-from-template.ts <template> <config.json> [output]");
    console.error("");
    console.error("Arguments:");
    console.error("  template    - Path to .njk template file");
    console.error("  config.json - Path to JSON config file");
    console.error("  output      - Target path, or \"-\" / omit for stdout");
    console.error("");
    console.error("Examples:");
    console.error("  # Write to file");
    console.error("  npx tsx scripts/generate-from-template.ts \\");
    console.error("    templates/table-list-view.njk \\");
    console.error("    templates/configs/my-todos2.json \\");
    console.error("    app/routes/my-todos2.tsx");
    console.error("");
    console.error("  # Print to stdout (for copy-paste)");
    console.error("  npx tsx scripts/generate-from-template.ts \\");
    console.error("    templates/table-only.njk \\");
    console.error("    templates/configs/user-table.json");
    process.exit(1);
  }

  const [templatePath, configPath, outputPath] = args;
  const writeToStdout = !outputPath || outputPath === "-";

  // Validate template exists
  if (!fs.existsSync(templatePath)) {
    console.error(`Template not found: ${templatePath}`);
    process.exit(1);
  }

  // Validate config exists
  if (!fs.existsSync(configPath)) {
    console.error(`Config not found: ${configPath}`);
    process.exit(1);
  }

  // Read and parse config
  let config: Record<string, unknown>;
  try {
    const configContent = fs.readFileSync(configPath, "utf-8");
    config = JSON.parse(configContent);
  } catch (e) {
    console.error(`Failed to parse config JSON: ${e}`);
    process.exit(1);
  }

  // Configure nunjucks
  const templateDir = path.dirname(templatePath);
  const templateFile = path.basename(templatePath);
  const env = nunjucks.configure(templateDir, {
    autoescape: false,
    trimBlocks: true,
    lstripBlocks: true,
  });

  // Add custom filters to match Jinja2
  // map(attribute='name') - extract attribute from each item
  // map('dump') - apply dump filter to each item
  env.addFilter("map", (arr: unknown[], arg: string | Record<string, string>) => {
    if (!Array.isArray(arr)) return [];

    // map('dump') - apply filter to each element
    if (typeof arg === "string") {
      if (arg === "dump") {
        return arr.map((item) => JSON.stringify(item));
      }
      // Treat as attribute name for backwards compat
      return arr.map((item) => (item as Record<string, unknown>)[arg]);
    }

    // map(attribute='name') - extract attribute
    if (arg && typeof arg === "object" && "attribute" in arg) {
      const attr = arg.attribute;
      return arr.map((item) => (item as Record<string, unknown>)[attr]);
    }

    return arr;
  });

  env.addFilter("dump", (value: unknown) => JSON.stringify(value));

  env.addFilter("capitalize", (str: string) => {
    if (typeof str !== "string") return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  // Render template
  let output: string;
  try {
    output = env.render(templateFile, config);
  } catch (e) {
    console.error(`Template rendering failed: ${e}`);
    process.exit(1);
  }

  // Output: stdout or file
  if (writeToStdout) {
    // Print directly to stdout (no extra messages)
    console.log(output);
  } else {
    // Write to file
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, output);

    console.log(`Generated: ${outputPath}`);
    console.log("");
    console.log("=".repeat(70));
    console.log("IMPORTANT: This is a NON-FUNCTIONAL starting point.");
    console.log("=".repeat(70));
    console.log("");
    console.log("The generated code is intentionally minimal and incomplete.");
    console.log("It exists only to provide a consistent UI skeleton.");
    console.log("");
    console.log("You are expected to:");
    console.log("  - Think about how the UI should actually look");
    console.log("  - Remove non-sensical or irrelevant parts");
    console.log("  - Add your own logic, fields, and features");
    console.log("  - Change everything as needed");
    console.log("");
    console.log("This is a canvas, not a finished product.");
    console.log("The time saved here should go into ACTUAL features.");
    console.log("");
    console.log("See templates/README.md for more details.");
    console.log("=".repeat(70));
  }
}

main();
