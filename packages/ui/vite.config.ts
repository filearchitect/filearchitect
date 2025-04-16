import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Vite config for the UI package as an Application/Demo
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  build: {
    target: "esnext", // Keep target for browser compatibility
    sourcemap: true,
    outDir: "dist", // Standard output directory for apps
  },
  server: {
    // Optional: Define server port if needed
    port: 4000,
  },
});
