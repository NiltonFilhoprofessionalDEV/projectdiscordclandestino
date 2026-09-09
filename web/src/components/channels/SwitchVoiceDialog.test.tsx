// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SwitchVoiceDialog } from "./SwitchVoiceDialog.tsx";

describe("SwitchVoiceDialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("confirms the room change", () => {
    const onAccept = vi.fn();
    const onCancel = vi.fn();
    render(
      <SwitchVoiceDialog
        open
        fromName="WARZONE"
        toName="Estudos"
        onCancel={onCancel}
        onAccept={onAccept}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Mudar de sala?" })).toBeTruthy();
    screen.getByRole("button", { name: "Aceitar" }).click();
    expect(onAccept).toHaveBeenCalledTimes(1);
    screen.getByRole("button", { name: "Cancelar" }).click();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
