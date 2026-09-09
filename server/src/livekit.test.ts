import { describe, expect, it, vi } from "vitest";

const constructed: Array<{ identity?: string; name?: string }> = [];

vi.mock("livekit-server-sdk", () => ({
  AccessToken: class {
    constructor(
      _key: string,
      _secret: string,
      opts: { identity?: string; name?: string },
    ) {
      constructed.push(opts);
    }
    addGrant() {}
    toJwt() {
      return Promise.resolve("jwt");
    }
  },
  RoomServiceClient: class {},
}));

const { createToken } = await import("./livekit.ts");

describe("createToken", () => {
  it("uses the user id as identity and the profile display name", async () => {
    constructed.length = 0;
    await createToken(
      "11111111-1111-1111-1111-111111111111",
      "Nilton",
      "community:aaaa:voice:bbbb",
    );

    expect(constructed[0]).toEqual({
      identity: "11111111-1111-1111-1111-111111111111",
      name: "Nilton",
      ttl: "2h",
    });
    expect(constructed[0]?.identity).not.toMatch(/nilton-/i);
  });
});
