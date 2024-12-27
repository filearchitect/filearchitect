import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true, // Use global test functions (e.g., `describe`, `it`)
    environment: "node", // Set test environment to Node.js
    clearMocks: true,
  },
});
