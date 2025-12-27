import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["app/**/*.test.{ts,tsx}", "prisma/**/*.test.ts"],
    exclude: ["tests/**", "node_modules/**"],
  },
});
