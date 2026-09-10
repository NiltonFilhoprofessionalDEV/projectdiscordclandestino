import { describe, expect, it } from "vitest";
import {
  installLabel,
  readHintDismissed,
  writeHintDismissed,
} from "./installPrompt.ts";

function memoryStorage(initial: Record<string, string> = {}): Pick<Storage, "getItem" | "setItem"> {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe("installLabel", () => {
  it("names the Windows install action", () => {
    expect(installLabel("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("Instalar no Windows");
  });

  it("falls back to a generic label off Windows", () => {
    expect(installLabel("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)")).toBe("Instalar app");
  });
});

describe("install hint dismissal", () => {
  it("starts visible and persists dismiss", () => {
    const storage = memoryStorage();
    expect(readHintDismissed(storage)).toBe(false);
    writeHintDismissed(storage);
    expect(readHintDismissed(storage)).toBe(true);
  });
});
