import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // You can specify test files here, e.g.,
    // include: ['src/**/*.test.ts'],
  },
}); 