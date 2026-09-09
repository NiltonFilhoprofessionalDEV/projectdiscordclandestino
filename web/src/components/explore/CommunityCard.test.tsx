// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommunityCard, communityCardKind } from "./CommunityCard.tsx";

describe("communityCardKind", () => {
  it("maps membership and visibility", () => {
    expect(communityCardKind(true, "public")).toBe("joined");
    expect(communityCardKind(true, "private")).toBe("private");
    expect(communityCardKind(false, "public")).toBe("public");
  });
});

describe("CommunityCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders status, slug and open action for a joined community", () => {
    const onOpen = vi.fn();
    render(
      <CommunityCard
        title="Gamers de cria"
        slug="gamers-de-cria"
        kind="joined"
        image="cover.png"
        avatarUrl="avatar.png"
        actionLabel="Abrir"
        onOpen={onOpen}
      />,
    );

    expect(screen.getByRole("button", { name: "Abrir Gamers de cria" })).toBeTruthy();
    expect(screen.getByText("Você participa")).toBeTruthy();
    expect(screen.getByText("/gamers-de-cria")).toBeTruthy();
    expect(document.querySelector('img[src="avatar.png"]')).toBeTruthy();
    screen.getByRole("button").click();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("marks public discovery cards as preview", () => {
    render(
      <CommunityCard
        title="Arena"
        slug="arena"
        kind="public"
        image="cover.png"
        actionLabel="Ver"
        onOpen={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "Ver Arena, você não é membro" })).toBeTruthy();
    expect(screen.getByText("Comunidade pública")).toBeTruthy();
  });
});
