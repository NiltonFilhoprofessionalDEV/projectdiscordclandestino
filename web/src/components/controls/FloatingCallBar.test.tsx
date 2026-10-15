// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FloatingCallBar } from "./FloatingCallBar.tsx";

const baseProps = {
  micOn: true,
  screenOn: false,
  outputVolume: 1,
  outputMuted: false,
  onToggleMic: vi.fn(),
  onToggleScreen: vi.fn(),
  onOutputVolume: vi.fn(),
  onToggleOutputMute: vi.fn(),
  onLeave: vi.fn(),
};

describe("FloatingCallBar", () => {
  afterEach(() => {
    cleanup();
  });

  it("toggles mute, screen share, volume and hang up", () => {
    const onToggleMic = vi.fn();
    const onToggleScreen = vi.fn();
    const onToggleOutputMute = vi.fn();
    const onLeave = vi.fn();
    render(
      <FloatingCallBar
        {...baseProps}
        onToggleMic={onToggleMic}
        onToggleScreen={onToggleScreen}
        onToggleOutputMute={onToggleOutputMute}
        onLeave={onLeave}
      />,
    );

    screen.getByRole("button", { name: "Mutar microfone" }).click();
    screen.getByRole("button", { name: "Compartilhar tela" }).click();
    screen.getByRole("button", { name: "Mutar áudio da sala" }).click();
    screen.getByRole("button", { name: "Sair da chamada" }).click();

    expect(onToggleMic).toHaveBeenCalledTimes(1);
    expect(onToggleScreen).toHaveBeenCalledTimes(1);
    expect(onToggleOutputMute).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("lowers room volume from the slider and unmutes if needed", () => {
    const onOutputVolume = vi.fn();
    const onToggleOutputMute = vi.fn();
    render(
      <FloatingCallBar
        {...baseProps}
        outputMuted
        onOutputVolume={onOutputVolume}
        onToggleOutputMute={onToggleOutputMute}
      />,
    );

    fireEvent.change(screen.getByRole("slider", { name: "Volume da sala" }), {
      target: { value: "40" },
    });

    expect(onOutputVolume).toHaveBeenCalledWith(0.4);
    expect(onToggleOutputMute).toHaveBeenCalledTimes(1);
  });
});
