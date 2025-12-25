import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { exec } from "child_process";
import { debounce } from "./app/lib/utils";

// Feature flags: set via env vars at build time, defaults to true (all enabled in dev)
const featureFlags = {
  __ENABLE_DASHBOARD__: JSON.stringify(process.env.ENABLE_DASHBOARD !== "false"),
};

function pythonSyncPlugin(): Plugin {
  const runSync = () => {
    exec("./scripts/sync-py.sh", (error, stdout, stderr) => {
      if (error) {
        console.error("❌ sync-py.sh failed:", stderr);
      } else {
        console.log(stdout);
      }
    });
  };

  return {
    name: "python-sync",
    configureServer(server) {
      // Run on dev server start
      runSync();

      // Watch for changes
      const debouncedSync = debounce(() => runSync(), 300);
      server.watcher.add("py/**/*.py");
      server.watcher.on("change", (path) => {
        if (path.endsWith(".py") && path.includes("py/")) {
          debouncedSync();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), pythonSyncPlugin()],
  define: featureFlags,
});
