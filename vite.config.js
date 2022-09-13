/* eslint-env node */

import path from "path";
import { defineConfig } from "vite";
import excludeDependenciesFromBundle from "rollup-plugin-exclude-dependencies-from-bundle";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    build: {
      lib: {
        entry: path.resolve(__dirname, "src/index.ts"),
        fileName: "sync-player",
        formats: ["es", "cjs"],
      },
      outDir: "dist",
      sourcemap: isProd ? true : "inline",
      minify: false,
    },
    plugins: [excludeDependenciesFromBundle()],
  };
});
