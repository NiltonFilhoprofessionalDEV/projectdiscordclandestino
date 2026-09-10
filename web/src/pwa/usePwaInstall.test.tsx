// @vitest-environment happy-dom
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BeforeInstallPromptLike } from "./installPrompt.ts";
import { usePwaInstall } from "./usePwaInstall.ts";

function memoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

function Probe({ storage }: { storage: Pick<Storage, "getItem" | "setItem"> }) {
  const pwa = usePwaInstall(storage);
  return (
    <div>
      <span data-testid="can">{String(pwa.canInstall)}</span>
      <span data-testid="hint">{String(pwa.showHint)}</span>
      <button type="button" onClick={() => void pwa.install()}>
        install
      </button>
      <button type="button" onClick={pwa.dismissHint}>
        dismiss
      </button>
    </div>
  );
}

function dispatchInstallPrompt() {
  const event = new Event("beforeinstallprompt") as BeforeInstallPromptLike;
  event.prompt = vi.fn(async () => undefined);
  event.userChoice = Promise.resolve({ outcome: "accepted" });
  window.dispatchEvent(event);
  return event;
}

describe("usePwaInstall", () => {
  afterEach(() => {
    cleanup();
  });

  it("offers install after the browser prompt event and hides the hint when dismissed", async () => {
    const storage = memoryStorage();
    render(<Probe storage={storage} />);
    expect(document.querySelector("[data-testid=can]")?.textContent).toBe("false");

    dispatchInstallPrompt();
    await waitFor(() => {
      expect(document.querySelector("[data-testid=can]")?.textContent).toBe("true");
      expect(document.querySelector("[data-testid=hint]")?.textContent).toBe("true");
    });

    document.querySelector("button:last-child")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await waitFor(() => {
      expect(document.querySelector("[data-testid=hint]")?.textContent).toBe("false");
      expect(document.querySelector("[data-testid=can]")?.textContent).toBe("true");
    });
  });

  it("calls the native prompt when installing", async () => {
    const storage = memoryStorage();
    render(<Probe storage={storage} />);
    const event = dispatchInstallPrompt();
    await waitFor(() => {
      expect(document.querySelector("[data-testid=can]")?.textContent).toBe("true");
    });
    document.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await waitFor(() => {
      expect(event.prompt).toHaveBeenCalledTimes(1);
    });
  });
});
