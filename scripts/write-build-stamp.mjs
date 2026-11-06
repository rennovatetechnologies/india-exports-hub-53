import { writeFileSync } from "node:fs";
import { sourceDigest } from "./source-digest.mjs";

const digest = sourceDigest();
writeFileSync("dist/.source-stamp", `${digest}\n`);
console.log(`[build] source stamp ${digest.slice(0, 12)}`);
