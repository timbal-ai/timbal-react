#!/usr/bin/env node
/**
 * Run `bun run build:watch` in timbal-react, then a consumer dev server.
 *
 * Usage:
 *   node scripts/dev-linked.mjs [consumerDir] [devCommand ...]
 *
 * Examples:
 *   node scripts/dev-linked.mjs vite
 *   node scripts/dev-linked.mjs examples/app-kit vite
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const timbalReactRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const args = process.argv.slice(2);
let consumerDir = process.cwd();
let devArgs = args;

if (args[0]) {
  const candidate = path.resolve(timbalReactRoot, args[0]);
  if (existsSync(path.join(candidate, "package.json"))) {
    consumerDir = candidate;
    devArgs = args.slice(1);
  }
}

const devCmd = devArgs[0] ?? "vite";
const devCmdArgs = devArgs.slice(1);

function run(cmd, args, opts) {
  return spawn(cmd, args, {
    cwd: opts.cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
}

console.log("[timbal-react] building + watching dist…");
const watch = run("bun", ["run", "build:watch"], { cwd: timbalReactRoot });

console.log(`[consumer] (${consumerDir}) ${devCmd} ${devCmdArgs.join(" ")}`.trim());
const app = run(devCmd, devCmdArgs, { cwd: consumerDir });

let exiting = false;
function shutdown(code = 0) {
  if (exiting) return;
  exiting = true;
  watch.kill("SIGTERM");
  app.kill("SIGTERM");
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
watch.on("exit", (code) => {
  if (code) shutdown(code);
});
app.on("exit", (code) => shutdown(code ?? 0));
