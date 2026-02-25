/**
 * Simple build / dev script.
 *
 * For now the extension is plain JS + CSS with no bundling required,
 * so this script just copies the necessary files into a `dist/` folder
 * that you can load as an unpacked extension in Chrome.
 *
 * Usage:
 *   npm run build          — one-off build
 *   npm run dev            — watch mode (rebuild on changes)
 */

import { watch } from "fs";
import { cp, mkdir, rm } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");

const COPY_TARGETS = [
  "manifest.json",
  "src",
  "icons",
];

async function build() {
  // Clean
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  // Copy files
  for (const target of COPY_TARGETS) {
    const src = join(ROOT, target);
    const dest = join(DIST, target);
    await cp(src, dest, { recursive: true });
  }

  console.log("✓ Build complete → dist/");
}

// --- Main ---
await build();

if (process.argv.includes("--watch")) {
  console.log("Watching for changes…");

  const dirsToWatch = ["src", "."];
  for (const dir of dirsToWatch) {
    watch(join(ROOT, dir), { recursive: dir === "src" }, async (event, filename) => {
      if (filename?.startsWith("dist")) return;
      if (filename?.startsWith(".")) return;
      console.log(`  ↻ ${filename} changed, rebuilding…`);
      await build();
    });
  }
}
