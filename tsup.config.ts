import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  jsx: "react-jsx",
  target: "es2020",
  external: [
    "react",
    "react/jsx-runtime",
    "react-dom",
    "@assistant-ui/react",
    "@timbal-ai/timbal-sdk",
  ],
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".esm.js" : ".cjs",
    };
  },
});
