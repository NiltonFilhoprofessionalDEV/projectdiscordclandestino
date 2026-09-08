import { describe, expect, it } from "vitest";
import { app } from "./app.ts";

describe("API", () => {
  it("health is ok", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("lists configured rooms", async () => {
    const res = await app.request("/api/rooms");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rooms: { id: string }[] };
    expect(body.rooms.map((room) => room.id)).toEqual([
      "geral",
      "jogos",
      "reuniao",
      "desenvolvimento",
    ]);
  });

  it("rejects unknown rooms", async () => {
    const res = await app.request("/api/token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: "Nilton", roomId: "secreta" }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects invalid names", async () => {
    const res = await app.request("/api/token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: "<x>", roomId: "geral" }),
    });
    expect(res.status).toBe(400);
  });
});
