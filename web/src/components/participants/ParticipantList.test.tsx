// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { ParticipantList } from "./ParticipantList.tsx";

function person(overrides: Partial<ParticipantView>): ParticipantView {
  return {
    identity: "user-1",
    name: "Breno",
    isLocal: false,
    isSpeaking: false,
    micOn: true,
    avatarUrl: null,
    cameraPublication: null,
    screenPublication: null,
    ...overrides,
  };
}

describe("ParticipantList", () => {
  afterEach(() => {
    cleanup();
  });

  it("lets you add a stranger in the call by name", () => {
    const onAddFriend = vi.fn();
    render(
      <ParticipantList
        participants={[person({})]}
        relationFor={() => ({ kind: "none" })}
        onAddFriend={onAddFriend}
      />,
    );
    screen.getByRole("button", { name: "Adicionar Breno como amigo" }).click();
    expect(onAddFriend).toHaveBeenCalledWith("user-1", "Breno");
  });

  it("does not offer add for the local user", () => {
    render(
      <ParticipantList
        participants={[person({ isLocal: true, name: "Nilton" })]}
        relationFor={() => ({ kind: "self" })}
        onAddFriend={() => undefined}
      />,
    );
    expect(screen.queryByRole("button", { name: /Adicionar/ })).toBeNull();
    expect(screen.getByText("Nilton (você)")).toBeTruthy();
  });

  it("accepts an incoming request from someone in the call", () => {
    const onAcceptFriend = vi.fn();
    render(
      <ParticipantList
        participants={[person({})]}
        relationFor={() => ({ kind: "incoming", friendshipId: "f1" })}
        onAcceptFriend={onAcceptFriend}
      />,
    );
    screen.getByRole("button", { name: "Aceitar" }).click();
    expect(onAcceptFriend).toHaveBeenCalledWith("f1");
  });
});
