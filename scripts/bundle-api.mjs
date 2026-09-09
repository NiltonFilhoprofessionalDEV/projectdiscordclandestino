import { build } from "esbuild";
import { mkdirSync } from "node:fs";

mkdirSync("api", { recursive: true });

await build({
  entryPoints: ["server/src/vercel-entry.ts"],
  outfile: "api/gateway.mjs",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  packages: "bundle",
  logLevel: "info",
});

console.log("api/gateway.mjs ready");
