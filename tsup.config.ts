import { defineConfig } from "tsup";
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/chat.ts",
    "src/studio.ts",
    "src/ui.ts",
    "src/app.ts",
    "src/site.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  jsx: "react-jsx",
  target: "es2020",
  external: [
    "react",
    "react/jsx-runtime",
    "react-dom",
    "react-is",
    "recharts",
    "@assistant-ui/react",
    "@timbal-ai/timbal-sdk",
    "@dnd-kit/core",
    "@dnd-kit/sortable",
    "@dnd-kit/utilities",
  ],
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".esm.js" : ".cjs",
    };
  },
  async onSuccess() {
    // Ship the optional companion stylesheet alongside the JS bundle.
    const src = resolve("src/styles.css");
    const dest = resolve("dist/styles.css");
    await mkdir(dirname(dest), { recursive: true });
    await copyFile(src, dest);
  },
});
