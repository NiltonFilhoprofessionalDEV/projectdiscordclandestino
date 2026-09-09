import { build } from "esbuild";
import { mkdirSync } from "node:fs";

mkdirSync("api", { recursive: true });

await build({
  entryPoints: ["server/src/vercel-entry.ts"],
  outfile: "api/gateway.js",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  packages: "bundle",
  logLevel: "info",
  // Vercel CJS functions expect module.exports = handler, not exports.default
  footer: {
    js: "module.exports = module.exports.default;",
  },
});

await build({
  entryPoints: ["scripts/mini-entry.ts"],
  outfile: "api/mini.js",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  packages: "bundle",
  logLevel: "info",
  footer: {
    js: "module.exports = module.exports.default;",
  },
});

console.log("api/gateway.js + api/mini.js ready");
