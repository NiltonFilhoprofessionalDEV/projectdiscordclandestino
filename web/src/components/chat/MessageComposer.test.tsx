// @vitest-environment happy-dom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MessageComposer } from "./MessageComposer.tsx";

describe("MessageComposer", () => {
  afterEach(() => {
    cleanup();
  });

  it("opens the emoji picker without scroll overflow classes", async () => {
    render(
      <MessageComposer
        onSend={async () => ({ ok: true, data: undefined })}
        onRetry={async () => ({ ok: true, data: undefined })}
        failedNonce={null}
      />,
    );

    await act(async () => {
      screen.getByRole("button", { name: "Abrir emojis" }).click();
    });

    const picker = screen.getByRole("listbox", { name: "Emojis" });
    expect(picker.className).toContain("overflow-hidden");
    expect(picker.className).not.toContain("overflow-y-auto");
    expect(picker.className).not.toContain("overflow-x-auto");
    expect(picker.querySelector(".overflow-y-auto")).toBeNull();
    expect(screen.getByRole("button", { name: "Fechar emojis" })).toBeTruthy();
  });
});
