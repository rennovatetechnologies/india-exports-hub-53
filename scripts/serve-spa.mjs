#!/usr/bin/env node
/**
 * Serve dist/ after applying the runtime Razorpay key.
 * Vite inlines VITE_* at build time. Railway has been serving a previously
 * committed dist/ even when a newer source commit deployed, so startup
 * rebuilds whenever dist/.source-stamp does not match this source tree.
 */
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sourceDigest } from "./source-digest.mjs";

const key = String(process.env.VITE_RAZORPAY_KEY_ID || "").trim();
const dist = "dist";
const stampPath = join(dist, ".source-stamp");

function stampedDigest() {
  try {
    return readFileSync(stampPath, "utf8").trim();
  } catch {
    return "";
  }
}

function bundleIsCurrent() {
  const stamped = stampedDigest();
  return Boolean(stamped) && stamped === sourceDigest();
}

function ensureFreshBundle() {
  if (bundleIsCurrent()) {
    console.log("[serve-spa] dist matches source");
    return;
  }
  console.log("[serve-spa] dist is stale. Building from source before serving.");
  const result = spawnSync("npm", ["run", "build"], { stdio: "inherit", env: process.env });
  if ((result.status ?? 1) !== 0 || !bundleIsCurrent()) {
    console.error("[serve-spa] Refusing to serve a stale bundle.");
    process.exit(result.status || 1);
  }
}

function patchBakedKey() {
  if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(key)) return;
  const dir = join(dist, "assets");
  let files = [];
  try {
    files = readdirSync(dir);
  } catch {
    return;
  }
  for (const file of files) {
    if (!file.endsWith(".js")) continue;
    const path = join(dir, file);
    const source = readFileSync(path, "utf8");
    const next = source.replace(/rzp_(?:test|live)_[A-Za-z0-9]+/g, key);
    if (next !== source) {
      writeFileSync(path, next);
      console.log(`[serve-spa] Patched Razorpay key in ${file}`);
    }
  }
}

function injectHtml() {
  const path = join(dist, "index.html");
  let html;
  try {
    html = readFileSync(path, "utf8");
  } catch {
    return;
  }
  const snippet = `<script>window.__VIRASTRA_RAZORPAY_KEY_ID=${JSON.stringify(key)};</script>`;
  if (html.includes("__VIRASTRA_RAZORPAY_KEY_ID")) {
    html = html.replace(/<script>window\.__VIRASTRA_RAZORPAY_KEY_ID=.*?<\/script>/, snippet);
  } else {
    html = html.replace("</head>", `${snippet}</head>`);
  }
  writeFileSync(path, html);
}

ensureFreshBundle();
patchBakedKey();
injectHtml();
if (key) console.log(`[serve-spa] VITE_RAZORPAY_KEY_ID=${key.slice(0, 12)}…`);
try {
  const html = readFileSync(join(dist, "index.html"), "utf8");
  const asset = html.match(/\/assets\/index-[^"]+\.js/)?.[0];
  if (asset) console.log(`[serve-spa] bundle ${asset}`);
} catch {
  /* index is checked again by the static server */
}

const port = process.env.PORT || "4173";
const child = spawn("npx", ["serve", "-s", dist, "-l", `tcp://0.0.0.0:${port}`], {
  stdio: "inherit",
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
