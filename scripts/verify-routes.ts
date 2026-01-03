import fs from "node:fs";
import path from "node:path";

const ROUTES_FILE = path.join(process.cwd(), "app/routes.ts");
const ROUTE_BASE_DIR = path.join(process.cwd(), "app");

function verifyRoutes() {
  if (!fs.existsSync(ROUTES_FILE)) {
    console.error(`error: ${ROUTES_FILE} not found`);
    process.exit(1);
  }

  const content = fs.readFileSync(ROUTES_FILE, "utf-8");
  const errors: string[] = [];
  let checkCount = 0;

  const routePattern = /route\s*\(\s*(["']).*?\1\s*,\s*(["'])(.*?)\2/g;
  const layoutIndexPattern = /(?:layout|index)\s*\(\s*(["'])(.*?)\1/g;

  const checkFile = (relativeFilePath: string) => {
    checkCount++;
    const fullPath = path.resolve(ROUTE_BASE_DIR, relativeFilePath);
    if (!fs.existsSync(fullPath)) {
      errors.push(relativeFilePath);
    }
  };

  let match;
  while ((match = routePattern.exec(content)) !== null) {
    checkFile(match[3]);
  }
  while ((match = layoutIndexPattern.exec(content)) !== null) {
    checkFile(match[2]);
  }

  if (errors.length > 0) {
    errors.forEach((err) => console.error(`missing: ${err}`));
    process.exit(1);
  }
}

verifyRoutes();
