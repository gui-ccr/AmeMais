import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Os testes de integração precisam do Supabase local: rodam só com `yarn test:integration`.
    exclude: [...configDefaults.exclude, "tests-integration/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
