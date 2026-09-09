import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
const supabaseStub = path.resolve(root, "src/test/supabase.stub.ts").replaceAll("\\", "/");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /[/\\]src[/\\]services[/\\]supabase\.ts$/,
        replacement: supabaseStub,
      },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/setup.ts"],
    pool: "forks",
  },
});
