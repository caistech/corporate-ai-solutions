#!/usr/bin/env node
/**
 * Generate src/content/methodology-doc.ts — a BUNDLED snapshot of the canonical
 * cais-shared-services/product-factory/PRODUCT_FACTORY_METHODOLOGY.md.
 *
 * Why: /admin/methodology used to fs.readFileSync the sibling repo at runtime, which does NOT
 * exist in the Vercel bundle — so the page always errored in prod (and leaked the FS path).
 * Bundling the content as a TS module guarantees it ships with the deploy.
 *
 * Run: npm run gen:methodology   (re-run when the canonical doc changes)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, "..", "..", "cais-shared-services", "product-factory", "PRODUCT_FACTORY_METHODOLOGY.md");
const OUT = resolve(HERE, "..", "src", "content", "methodology-doc.ts");

let content;
try {
  content = readFileSync(SRC, "utf8");
} catch {
  console.error(`[gen:methodology] source not found at ${SRC} — keeping the existing snapshot.`);
  process.exit(0); // non-fatal: CI without the sibling repo keeps the committed snapshot
}

mkdirSync(dirname(OUT), { recursive: true });
const banner =
  `// AUTO-GENERATED — do not edit by hand.\n` +
  `// Snapshot of cais-shared-services/product-factory/PRODUCT_FACTORY_METHODOLOGY.md\n` +
  `// Regenerate: npm run gen:methodology\n`;
writeFileSync(OUT, `${banner}export const METHODOLOGY_DOC = ${JSON.stringify(content)}\n`);
console.log(`[gen:methodology] wrote ${OUT} (${content.length} chars)`);
