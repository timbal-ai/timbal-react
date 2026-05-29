import { stat } from "node:fs/promises";
import { resolve } from "node:path";

const dist = resolve("dist");
const budgets = {
  "index.esm.js": 450 * 1024,
  "chat.esm.js": 320 * 1024,
  "studio.esm.js": 280 * 1024,
  "ui.esm.js": 80 * 1024,
  "app.esm.js": 60 * 1024,
};

let failed = false;

for (const [file, max] of Object.entries(budgets)) {
  const path = resolve(dist, file);
  try {
    const { size } = await stat(path);
    if (size > max) {
      console.error(
        `Bundle budget exceeded: ${file} is ${(size / 1024).toFixed(1)} KiB (max ${(max / 1024).toFixed(0)} KiB)`,
      );
      failed = true;
    } else {
      console.log(`OK ${file}: ${(size / 1024).toFixed(1)} KiB`);
    }
  } catch {
    console.error(`Missing ${file} — run bun run build first`);
    failed = true;
  }
}

if (failed) process.exit(1);
