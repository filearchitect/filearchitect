import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
export default defineConfig({
  server: {
    port: 4000,
  },
  plugins: [tailwindcss()],
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
