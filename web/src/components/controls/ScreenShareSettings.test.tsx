// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultScreenShareConfig } from "../../voice/screenShare.ts";
import { ScreenShareSettings } from "./ScreenShareSettings.tsx";

describe("ScreenShareSettings", () => {
  afterEach(() => {
    cleanup();
  });

  it("does not stop the share when the user keeps transmitting", () => {
    const onStop = vi.fn();
    const onClose = vi.fn();
    render(
      <ScreenShareSettings
        open
        config={defaultScreenShareConfig}
        onClose={onClose}
        onChangeWindow={vi.fn()}
        onStop={onStop}
      />,
    );

    screen.getByRole("button", { name: "Continuar transmitindo" }).click();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onStop).not.toHaveBeenCalled();
  });

  it("applies the selected type when changing the window", () => {
    const onChangeWindow = vi.fn();
    render(
      <ScreenShareSettings
        open
        config={defaultScreenShareConfig}
        onClose={vi.fn()}
        onChangeWindow={onChangeWindow}
        onStop={vi.fn()}
      />,
    );

    screen.getByRole("radio", { name: /Janela/ }).click();
    screen.getByRole("button", { name: "Trocar janela" }).click();
    expect(onChangeWindow).toHaveBeenCalledWith({
      ...defaultScreenShareConfig,
      surface: "window",
    });
  });

  it("stops only from Encerrar transmissão", async () => {
    const onStop = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <ScreenShareSettings
        open
        config={defaultScreenShareConfig}
        onClose={onClose}
        onChangeWindow={vi.fn()}
        onStop={onStop}
      />,
    );

    screen.getByRole("button", { name: "Encerrar transmissão" }).click();
    await vi.waitFor(() => {
      expect(onStop).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
