import path from "node:path";
import { defineConfig } from "vitest/config";

/** Testes contra o Supabase local (`supabase start`). Ver docs/testes-integracao-e2e.md. */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests-integration/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
