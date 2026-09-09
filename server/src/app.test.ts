import type { User } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import type { ApiResult } from "../../shared/api.ts";
import type { ChannelId, CommunityId } from "../../shared/community.ts";
import { app, createApp } from "./app.ts";
import type { CommunityRepository } from "./repositories/communityRepository.ts";
import { requireUser } from "./supabase.ts";

const OWNER_ID = "11111111-1111-1111-1111-111111111111";
const MEMBER_ID = "22222222-2222-2222-2222-222222222222";
const COMMUNITY_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" as CommunityId;
const TEXT_CHANNEL_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" as ChannelId;
const VOICE_CHANNEL_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc" as ChannelId;

const owner = { id: OWNER_ID, email: "owner@example.test" } as User;
const member = { id: MEMBER_ID, email: "member@example.test" } as User;

function jsonHeaders(userToken = "access-token") {
  return {
    authorization: `Bearer ${userToken}`,
    "content-type": "application/json",
  };
}

function alwaysAllow() {
  return { allowed: true as const };
}

function stubAuth(user: User) {
  return vi.fn<typeof requireUser>().mockResolvedValue({ ok: true, user });
}

function stubRepo(
  overrides: Partial<CommunityRepository> = {},
): CommunityRepository {
  const missing = async <T>(): Promise<ApiResult<T>> => ({
    ok: false,
    error: { code: "NOT_FOUND", message: "not stubbed" },
  });

  return {
    listCommunities: missing,
    createCommunity: missing,
    getCommunity: missing,
    createChannel: missing,
    updateChannel: missing,
    deleteChannel: missing,
    createInvite: missing,
    revokeInvite: missing,
    acceptInvite: missing,
    canJoinVoice: missing,
    ...overrides,
  };
}

function testApp(options: {
  user?: User;
  repository?: Partial<CommunityRepository>;
  requireUser?: typeof requireUser;
  issueLiveKitToken?: (displayName: string, roomName: string) => Promise<string>;
  allowRequest?: () => { allowed: true } | { allowed: false; retryAfterSeconds: number };
}) {
  return createApp({
    requireUser: options.requireUser ?? stubAuth(options.user ?? owner),
    getRepository: () => stubRepo(options.repository),
    issueLiveKitToken:
      options.issueLiveKitToken ?? (async () => "livekit-jwt"),
    hasLiveKitCredentials: () => true,
    livekitUrl: "wss://livekit.example.test",
    allowRequest: options.allowRequest ?? alwaysAllow,
  });
}

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

  it("allows Authorization on CORS preflight", async () => {
    const res = await app.request("/api/communities", {
      method: "OPTIONS",
      headers: {
        origin: "http://localhost:5173",
        "access-control-request-method": "POST",
        "access-control-request-headers": "authorization,content-type",
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-headers")).toMatch(
      /authorization/i,
    );
    expect(res.headers.get("access-control-allow-methods")).toMatch(/PATCH/i);
    expect(res.headers.get("access-control-allow-methods")).toMatch(/DELETE/i);
  });
});

describe("authorized community routes", () => {
  it("unauthenticated create returns 401 UNAUTHENTICATED", async () => {
    const api = testApp({ requireUser });
    const res = await api.request("/api/communities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Turma", visibility: "public" }),
    });

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "Sessão inválida ou expirada." },
    });
  });

  it("member attempting channel creation returns 403 FORBIDDEN", async () => {
    const createChannel = vi.fn().mockResolvedValue({
      ok: false,
      error: { code: "FORBIDDEN", message: "Sem permissão para criar canais." },
    });
    const api = testApp({
      user: member,
      repository: { createChannel },
    });

    const res = await api.request(`/api/communities/${COMMUNITY_ID}/channels`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ name: "dev", type: "text" }),
    });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: { code: "FORBIDDEN", message: "Sem permissão para criar canais." },
    });
    expect(createChannel).toHaveBeenCalledWith(MEMBER_ID, COMMUNITY_ID, {
      name: "dev",
      type: "text",
    });
  });

  it("invalid names return 400 VALIDATION", async () => {
    const createCommunity = vi.fn();
    const api = testApp({ repository: { createCommunity } });

    const res = await api.request("/api/communities", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ name: "<script>", visibility: "public" }),
    });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "VALIDATION",
        message: "O nome contém caracteres inválidos.",
      },
    });
    expect(createCommunity).not.toHaveBeenCalled();
  });

  it("duplicate names return 409 CONFLICT", async () => {
    const createCommunity = vi.fn().mockResolvedValue({
      ok: false,
      error: { code: "CONFLICT", message: "Já existe uma comunidade com esse nome." },
    });
    const api = testApp({ repository: { createCommunity } });

    const res = await api.request("/api/communities", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ name: "Salas", visibility: "public" }),
    });

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "CONFLICT",
        message: "Já existe uma comunidade com esse nome.",
      },
    });
    expect(createCommunity).toHaveBeenCalledWith(OWNER_ID, {
      name: "Salas",
      visibility: "public",
    });
  });

  it("private community hidden from non-member returns 404 NOT_FOUND", async () => {
    const getCommunity = vi.fn().mockResolvedValue({
      ok: false,
      error: { code: "NOT_FOUND", message: "Comunidade não encontrada." },
    });
    const api = testApp({
      user: member,
      repository: { getCommunity },
    });

    const res = await api.request(`/api/communities/${COMMUNITY_ID}`, {
      headers: jsonHeaders(),
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: "Comunidade não encontrada." },
    });
    expect(getCommunity).toHaveBeenCalledWith(MEMBER_ID, COMMUNITY_ID);
  });

  it("token endpoint rejects a text channel", async () => {
    const canJoinVoice = vi.fn().mockResolvedValue({
      ok: false,
      error: { code: "FORBIDDEN", message: "Canal de voz inválido." },
    });
    const issueLiveKitToken = vi.fn();
    const api = testApp({
      repository: { canJoinVoice },
      issueLiveKitToken,
    });

    const res = await api.request("/api/livekit/token", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        channelId: TEXT_CHANNEL_ID,
        displayName: "Hacker",
      }),
    });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: { code: "FORBIDDEN", message: "Canal de voz inválido." },
    });
    expect(canJoinVoice).toHaveBeenCalledWith(OWNER_ID, TEXT_CHANNEL_ID);
    expect(issueLiveKitToken).not.toHaveBeenCalled();
  });

  it("token endpoint rejects a non-member", async () => {
    const canJoinVoice = vi.fn().mockResolvedValue({
      ok: false,
      error: { code: "NOT_FOUND", message: "Canal não encontrado." },
    });
    const api = testApp({
      user: member,
      repository: { canJoinVoice },
    });

    const res = await api.request("/api/livekit/token", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ channelId: VOICE_CHANNEL_ID }),
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: "Canal não encontrado." },
    });
    expect(canJoinVoice).toHaveBeenCalledWith(MEMBER_ID, VOICE_CHANNEL_ID);
  });

  it("issues a LiveKit token from the profile name and voice room key", async () => {
    const canJoinVoice = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        communityId: COMMUNITY_ID,
        channelId: VOICE_CHANNEL_ID,
        displayName: "Nilton",
      },
    });
    const issueLiveKitToken = vi.fn().mockResolvedValue("livekit-jwt");
    const api = testApp({
      repository: { canJoinVoice },
      issueLiveKitToken,
    });

    const res = await api.request("/api/livekit/token", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        channelId: VOICE_CHANNEL_ID,
        displayName: "Hacker",
      }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      data: {
        token: "livekit-jwt",
        url: "wss://livekit.example.test",
        roomName: `community:${COMMUNITY_ID}:voice:${VOICE_CHANNEL_ID}`,
      },
    });
    expect(issueLiveKitToken).toHaveBeenCalledWith(
      "Nilton",
      `community:${COMMUNITY_ID}:voice:${VOICE_CHANNEL_ID}`,
    );
  });

  it("accepted invite adds membership exactly once", async () => {
    const memberships = new Map<
      string,
      { communityId: CommunityId; userId: string; role: "member" }
    >();
    const acceptInvite = vi.fn(async (userId: string, _token: string) => {
      const key = `${userId}:${COMMUNITY_ID}`;
      const current = memberships.get(key) ?? {
        communityId: COMMUNITY_ID,
        userId,
        role: "member" as const,
      };
      memberships.set(key, current);
      return { ok: true as const, data: current };
    });
    const api = testApp({
      user: member,
      repository: { acceptInvite },
    });

    const first = await api.request("/api/invites/raw-token/accept", {
      method: "POST",
      headers: jsonHeaders(),
    });
    const second = await api.request("/api/invites/raw-token/accept", {
      method: "POST",
      headers: jsonHeaders(),
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(memberships.size).toBe(1);
    expect(memberships.get(`${MEMBER_ID}:${COMMUNITY_ID}`)).toEqual({
      communityId: COMMUNITY_ID,
      userId: MEMBER_ID,
      role: "member",
    });
    expect(acceptInvite).toHaveBeenCalledTimes(2);
    expect(acceptInvite).toHaveBeenNthCalledWith(1, MEMBER_ID, "raw-token");
  });

  it("returns 429 RATE_LIMITED with Retry-After", async () => {
    const api = testApp({
      allowRequest: () => ({ allowed: false, retryAfterSeconds: 17 }),
    });

    const res = await api.request("/api/communities", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ name: "Turma", visibility: "public" }),
    });

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("17");
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: "Muitas tentativas. Espere um momento.",
      },
    });
  });
});
