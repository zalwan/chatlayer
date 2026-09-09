import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const coreSrc = fileURLToPath(new URL("../core/src/index.ts", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@chatlayer/core": coreSrc,
    },
    conditions: ["browser"],
  },
  plugins: [svelte()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    deps: {
      inline: [/svelte/],
    },
  },
});
