/**
 * Simple build / dev script.
 *
 * For now the extension is plain JS + CSS with no bundling required,
 * so this script just copies the necessary files into a `dist/` folder
 * that you can load as an unpacked extension in Chrome.
 *
 * Usage:
 *   bun run build          — one-off build
 *   bun run dev             — watch mode (rebuild on changes)
 */

import { watch } from "fs";
import { cp, mkdir, rm } from "fs/promises";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");
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
