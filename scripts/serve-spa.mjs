#!/usr/bin/env node
/**
 * Serve dist/ after applying the runtime Razorpay key.
 * Vite inlines VITE_* at build time; Railway env changes do not rebuild the SPA.
 */
import { spawn } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const key = String(process.env.VITE_RAZORPAY_KEY_ID || "").trim();
const dist = "dist";

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

patchBakedKey();
injectHtml();
if (key) console.log(`[serve-spa] VITE_RAZORPAY_KEY_ID=${key.slice(0, 12)}…`);

const port = process.env.PORT || "4173";
const child = spawn("npx", ["serve", "-s", dist, "-l", `tcp://0.0.0.0:${port}`], {
  stdio: "inherit",
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
