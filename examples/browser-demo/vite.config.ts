import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 4000,
  },
  resolve: {
    alias: {
      "@filearchitect/core/browser": resolve(
        __dirname,
        "../../packages/core/src/browser.ts"
      ),
    },
  },
  optimizeDeps: {
    exclude: [
      "@filearchitect/core",
      "console-table-printer",
      "simple-wcswidth",
    ],
  },
  build: {
    target: "esnext",
    sourcemap: true,
  },
});
