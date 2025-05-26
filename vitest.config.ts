import path from "path"; // Import path module for resolving aliases
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true, // Optional: to use jest-dom matchers without importing expect everywhere
    environment: "jsdom", // Crucial for React component testing
    include: [
      "packages/*/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "packages/ui/src/components/**/*.test.{ts,tsx}", // Added to include UI tests
    ],
    setupFiles: ["./vitest.setup.ts"], // Reference the setup file
  },
  resolve: {
    alias: [
      {
        find: "@/",
        replacement: path.resolve(__dirname, "./packages/ui/src/") + "/", // Ensure trailing slash
      },
      {
        find: "@filearchitect/core",
        replacement: path.resolve(__dirname, "./packages/core/src/"),
      },
    ],
  },
});
