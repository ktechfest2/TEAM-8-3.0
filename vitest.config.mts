import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname) } },
  // PGlite (embedded Postgres) needs a few seconds to boot per test file.
  test: { environment: "node", include: ["tests/**/*.test.ts"], testTimeout: 30_000 },
});
