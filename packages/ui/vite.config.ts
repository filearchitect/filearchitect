import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path"; // Import path module
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Vite config for the UI package as an Application/Demo
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  build: {
    emptyOutDir: false, // Ensure Vite doesn't clear the dist dir
    // If you are building a library, uncomment and configure the following:
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"), // Your library's entry point
      name: "FileArchitectUI", // Global variable name for UMD build (optional)
      fileName: (format) => `index.${format === "es" ? "mjs" : "js"}`, // Output file names (e.g., index.mjs, index.js)
      formats: ["es", "cjs"], // Output formats
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      // into your library (e.g., react, react-dom)
      external: ["react", "react-dom", "@filearchitect/core", "lucide-react"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps (optional)
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "@filearchitect/core": "FileArchitectCore",
          "lucide-react": "LucideReact",
        },
      },
    },
    sourcemap: true, // Generate source maps for debugging
    // outDir: "dist", // This is often set by the library mode automatically or can be kept
    // target: "esnext", // Already specified or handled by library mode defaults
  },
  server: {
    // Optional: Define server port if needed
    port: 4000,
  },
});
