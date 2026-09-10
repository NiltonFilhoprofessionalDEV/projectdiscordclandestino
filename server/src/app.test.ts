import type { User } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import type { ApiResult } from "../../shared/api.ts";
import type { ChannelId, CommunityId } from "../../shared/community.ts";
import { app, createApp } from "./app.ts";
import type { AppDeps } from "./http/deps.ts";
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
    updateCommunity: missing,
    createChannel: missing,
    updateChannel: missing,
    deleteChannel: missing,
    createInvite: missing,
    revokeInvite: missing,
    acceptInvite: missing,
    canJoinVoice: missing,
    listMemberVoiceChannels: missing,
    ...overrides,
  };
}

function testApp(options: {
  user?: User;
  repository?: Partial<CommunityRepository>;
  requireUser?: typeof requireUser;
  issueLiveKitToken?: (
    identity: string,
    displayName: string,
    roomName: string,
  ) => Promise<string>;
  listVoiceOccupants?: (
    communityId: string,
    channelIds: readonly string[],
  ) => Promise<Record<string, { identity: string; name: string }[]>>;
  listExploreActivity?: AppDeps["listExploreActivity"];
  allowRequest?: () => { allowed: true } | { allowed: false; retryAfterSeconds: number };
  getRepository?: () => CommunityRepository;
}) {
  return createApp({
    requireUser: options.requireUser ?? stubAuth(options.user ?? owner),
    getRepository:
      options.getRepository ?? (() => stubRepo(options.repository)),
    issueLiveKitToken:
      options.issueLiveKitToken ?? (async () => "livekit-jwt"),
    listVoiceOccupants:
      options.listVoiceOccupants ??
      (async (_communityId, channelIds) =>
        Object.fromEntries(channelIds.map((id) => [id, []]))),
    listExploreActivity:
      options.listExploreActivity ??
      (async () => ({ ok: true, data: { members: [], voiceChannels: [] } })),
    hasLiveKitCredentials: () => true,
    livekitUrl: "wss://livekit.example.test",
    allowRequest: options.allowRequest ?? alwaysAllow,
  });
}

describe("API", () => {
  it("health is ok", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      livekit: expect.any(Boolean),
      supabaseUrl: expect.any(Boolean),
      supabasePublishableKey: expect.any(Boolean),
      supabaseSecretKey: expect.any(Boolean),
    });
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
  it("lists communities with online counts and occupied voice rooms", async () => {
    const listCommunities = vi.fn().mockResolvedValue({
      ok: true,
      data: [
        {
          id: COMMUNITY_ID,
          name: "Salas",
          slug: "salas",
          visibility: "public",
          role: "owner",
          avatarUrl: null,
          onlineCount: 0,
          activeRooms: [],
        },
      ],
    });
    const api = testApp({
      repository: { listCommunities },
      listExploreActivity: async () => ({
        ok: true,
        data: {
          members: [
            {
              communityId: COMMUNITY_ID,
              userId: "a",
              presence: "online",
              lastSeenAt: new Date().toISOString(),
            },
          ],
          voiceChannels: [
            { communityId: COMMUNITY_ID, channelId: VOICE_CHANNEL_ID, name: "WARZONE" },
          ],
        },
      }),
      listVoiceOccupants: async () => ({
        [VOICE_CHANNEL_ID]: [{ identity: "a", name: "A" }],
      }),
    });

    const res = await api.request("/api/communities", { headers: jsonHeaders() });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      data: [
        {
          id: COMMUNITY_ID,
          name: "Salas",
          slug: "salas",
          visibility: "public",
          role: "owner",
          avatarUrl: null,
          onlineCount: 1,
          activeRooms: [{ name: "WARZONE", occupantCount: 1 }],
        },
      ],
    });
  });

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

  it("updates community avatar for the owner", async () => {
    const updateCommunity = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        id: COMMUNITY_ID,
        ownerId: OWNER_ID,
        name: "Salas",
        slug: "salas",
        visibility: "public",
        avatarUrl: "https://cdn.example/icon.png",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    const api = testApp({ repository: { updateCommunity } });

    const res = await api.request(`/api/communities/${COMMUNITY_ID}`, {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ avatarUrl: "https://cdn.example/icon.png" }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      data: expect.objectContaining({
        avatarUrl: "https://cdn.example/icon.png",
      }),
    });
    expect(updateCommunity).toHaveBeenCalledWith(OWNER_ID, COMMUNITY_ID, {
      avatarUrl: "https://cdn.example/icon.png",
    });
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

  it("lists voice occupants for community members without joining", async () => {
    const listMemberVoiceChannels = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        communityId: COMMUNITY_ID,
        channelIds: [VOICE_CHANNEL_ID],
      },
    });
    const listVoiceOccupants = vi.fn().mockResolvedValue({
      [VOICE_CHANNEL_ID]: [{ identity: MEMBER_ID, name: "Cesar" }],
    });
    const api = testApp({
      repository: { listMemberVoiceChannels },
      listVoiceOccupants,
    });

    const res = await api.request(
      `/api/communities/${COMMUNITY_ID}/voice-occupancy`,
      { headers: jsonHeaders() },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      data: {
        channels: [
          {
            channelId: VOICE_CHANNEL_ID,
            occupants: [{ identity: MEMBER_ID, name: "Cesar" }],
          },
        ],
      },
    });
    expect(listMemberVoiceChannels).toHaveBeenCalledWith(OWNER_ID, COMMUNITY_ID);
    expect(listVoiceOccupants).toHaveBeenCalledWith(COMMUNITY_ID, [VOICE_CHANNEL_ID]);
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
      OWNER_ID,
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

  it("unexpected repository failures return 500 INTERNAL", async () => {
    const createCommunity = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Não foi possível concluir a operação.",
      },
    });
    const api = testApp({ repository: { createCommunity } });

    const res = await api.request("/api/communities", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ name: "Turma", visibility: "public" }),
    });

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Não foi possível concluir a operação.",
      },
    });
  });

  it("maps unhandled throws to 500 INTERNAL", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const api = testApp({
      getRepository: () => {
        throw new Error("Supabase público do servidor não configurado.");
      },
    });

    const res = await api.request("/api/communities", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ name: "Turma", visibility: "public" }),
    });

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "INTERNAL",
        message:
          "Configure SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY e SUPABASE_SECRET_KEY na Vercel e faça Redeploy.",
      },
    });
  });

  it("maps LiveKit issuer throws to 500 INTERNAL", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const api = testApp({
      repository: {
        canJoinVoice: async () => ({
          ok: true,
          data: {
            communityId: COMMUNITY_ID,
            channelId: VOICE_CHANNEL_ID,
            displayName: "Nilton",
          },
        }),
      },
      issueLiveKitToken: async () => {
        throw new Error("livekit down");
      },
    });

    const res = await api.request("/api/livekit/token", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ channelId: VOICE_CHANNEL_ID }),
    });

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Não foi possível concluir a operação.",
      },
    });
  });

  it("creates an invite without a JSON body", async () => {
    const createInvite = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        id: "invite-1",
        token: "raw-token",
        expiresAt: null,
        maxUses: null,
      },
    });
    const api = testApp({ repository: { createInvite } });

    const res = await api.request(`/api/communities/${COMMUNITY_ID}/invites`, {
      method: "POST",
      headers: { authorization: "Bearer access-token" },
    });

    expect(res.status).toBe(201);
    expect(createInvite).toHaveBeenCalledWith(OWNER_ID, COMMUNITY_ID, {});
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
