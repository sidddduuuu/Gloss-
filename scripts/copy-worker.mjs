// Copies the pdf.js worker from the installed pdfjs-dist into /public so the served
// worker ALWAYS matches the installed API version. Runs on predev/prebuild — this
// removes the class of "works on my machine" bugs caused by a stale committed worker.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function find() {
  const pkg = path.dirname(require.resolve("pdfjs-dist/package.json"));
  for (const name of ["pdf.worker.min.mjs", "pdf.worker.mjs"]) {
    const p = path.join(pkg, "build", name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const src = find();
const dest = path.join(process.cwd(), "public", "pdf.worker.min.mjs");
if (!src) {
  console.error("[copy-worker] could not locate pdfjs-dist worker — is pdfjs-dist installed?");
  process.exit(0); // don't hard-fail dev/build
}
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
const version = require("pdfjs-dist/package.json").version;
console.log(`[copy-worker] pdf.js worker v${version} → public/pdf.worker.min.mjs`);
