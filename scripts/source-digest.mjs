import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** Inputs that change the files Vite emits into dist/. */
const ROOTS = ["src", "public", "index.html", "vite.config.js", "package-lock.json"];

function collect(path, out) {
  let info;
  try {
    info = statSync(path);
  } catch {
    return;
  }
  if (info.isDirectory()) {
    for (const name of readdirSync(path)) {
      if (name === "node_modules" || name === "dist" || name === ".source-stamp") continue;
      collect(join(path, name), out);
    }
    return;
  }
  if (info.isFile()) out.push(path);
}

/** Stable hash of the source that a production bundle is built from. */
export function sourceDigest(root = process.cwd()) {
  const files = [];
  for (const entry of ROOTS) collect(join(root, entry), files);
  files.sort();
  const hash = createHash("sha256");
  for (const file of files) {
    const rel = relative(root, file).split(sep).join("/");
    hash.update(rel);
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}
