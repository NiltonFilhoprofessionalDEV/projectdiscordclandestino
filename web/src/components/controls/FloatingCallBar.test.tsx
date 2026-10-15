// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FloatingCallBar } from "./FloatingCallBar.tsx";

describe("FloatingCallBar", () => {
  afterEach(() => {
    cleanup();
  });

  it("toggles mute, screen share and hang up", () => {
    const onToggleMic = vi.fn();
    const onToggleScreen = vi.fn();
    const onLeave = vi.fn();
    render(
      <FloatingCallBar
        micOn
        screenOn={false}
        canScreenShare
        onToggleMic={onToggleMic}
        onToggleScreen={onToggleScreen}
        onLeave={onLeave}
      />,
    );

    screen.getByRole("button", { name: "Mutar microfone" }).click();
    screen.getByRole("button", { name: "Compartilhar tela" }).click();
    screen.getByRole("button", { name: "Sair da chamada" }).click();

    expect(onToggleMic).toHaveBeenCalledTimes(1);
    expect(onToggleScreen).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("labels unmute and stop share from the current state", () => {
    render(
      <FloatingCallBar
        micOn={false}
        screenOn
        canScreenShare
        onToggleMic={vi.fn()}
        onToggleScreen={vi.fn()}
        onLeave={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Desmutar microfone" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Parar transmissão" })).toBeTruthy();
  });
});
