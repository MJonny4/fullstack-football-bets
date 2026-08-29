import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    sequence: { concurrent: false },
  },
});
