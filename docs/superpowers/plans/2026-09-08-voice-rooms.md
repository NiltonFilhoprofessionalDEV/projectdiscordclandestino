# Voice Rooms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a friends-only voice-room SPA: pick a local name, click a permanent room, talk with LiveKit Cloud SFU (audio, camera, one screen share, ephemeral chat).

**Architecture:** `shared/` validation and room catalog; `server/` Hono API mints LiveKit JWTs and reports occupancy; `web/` Vite React app connects with `livekit-client`. Media never leaves WebRTC.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Lucide, livekit-client, Hono, livekit-server-sdk, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-08-voice-rooms-design.md`

## Global Constraints

- No signup, login, email, passwords, meeting links, or admin UI.
- LiveKit API key/secret only on the server.
- Display name: trim, 2–32 chars, no `<>` or control characters.
- Rooms: `geral`, `jogos`, `reuniao`, `desenvolvimento`.
- Portuguese (Brazil) UI copy.
- Dark theme, original (not Discord blurple). Desktop-first, large mobile controls.
- Commits only if the user asks.

## File map

```
shared/rooms.ts
shared/displayName.ts
shared/chat.ts
server/src/index.ts          Hono app
server/src/config.ts
server/src/livekit.ts
server/src/rateLimit.ts
server/src/index.test.ts
web/src/pages/AppShell.tsx
web/src/components/rooms/*
web/src/components/participants/*
web/src/components/controls/*
web/src/components/chat/*
web/src/hooks/useRoom.ts useParticipants.ts useMedia.ts useChat.ts useConnectionQuality.ts useOccupancy.ts
web/src/services/api.ts livekit.ts
web/src/lib/storage.ts
```

---

### Task 1: Shared rooms + display name

**Files:**
- Create: `shared/rooms.ts`, `shared/displayName.ts`, `shared/chat.ts`, `shared/displayName.test.ts`
- Create: `package.json` (workspaces), `shared/package.json`

**Interfaces:**
- Produces: `ROOMS`, `isKnownRoomId(id: string): boolean`, `parseDisplayName(raw: string): { ok: true; value: string } | { ok: false; error: string }`, `slugIdentity(name: string): string`, `parseChatText(raw: string): { ok: true; value: string } | { ok: false; error: string }`

- [ ] **Step 1:** Add workspace root and Vitest tests for name/chat validation (reject empty, `<>`, too long; accept “Nilton”).
- [ ] **Step 2:** Implement `parseDisplayName`, `ROOMS`, `parseChatText` (max 500).
- [ ] **Step 3:** Run `npx vitest run` — expect PASS.

---

### Task 2: Token + occupancy server

**Files:**
- Create: `server/package.json`, `server/tsconfig.json`, `server/src/*`, `server/.env.example`

**Interfaces:**
- Consumes: shared rooms + `parseDisplayName`
- Produces:
  - `GET /api/health` → `{ ok: true }`
  - `GET /api/rooms` → `{ rooms: { id, label, occupantCount }[] }`
  - `POST /api/token` body `{ displayName, roomId }` → `{ token, url, roomId }` or 400
- LiveKit: `AccessToken` with `roomJoin`, `canPublish`, `canSubscribe`, `canPublishData`, ttl `2h`. Identity = slug + 6 random chars.
- Occupancy: `RoomServiceClient.listRooms()`; missing room → 0. Convert `wss://` → `https://` for the HTTP API host.
- Rate limit POST /api/token: 20/min/IP in memory.
- CORS: `APP_ORIGIN` (default `http://localhost:5173`).

- [ ] **Step 1:** Test invalid name and unknown roomId return 400.
- [ ] **Step 2:** Implement Hono routes; if LiveKit env missing, `/api/rooms` still returns catalog with 0; `/api/token` returns 503 with a clear message.
- [ ] **Step 3:** Run server tests — PASS.

---

### Task 3: Web scaffold + name gate + lobby

**Files:** `web/` Vite React TS Tailwind shadcn (Button, Input, ScrollArea, Tooltip, Sheet, Sonner)

**Visual:** charcoal `#12141a`, surface `#1a2030`, copper accent `#c4a07a`, LED amber `#e8b84a` for speaking, Figtree + Syne. Not Discord blurple.

- [ ] **Step 1:** Scaffold Vite app, proxy `/api` → `8787`.
- [ ] **Step 2:** Name screen (“Qual é o seu nome?”), persist `displayName` in localStorage.
- [ ] **Step 3:** Lobby lists four rooms + occupancy poll every 5s.

---

### Task 4: Join LiveKit + audio + presence + leave

**Files:** hooks + RoomView + control bar

- Connect with `adaptiveStream`, `dynacast`, AEC/NS/AGC, `disconnectOnPageLeave`.
- Publish mic unless `micMuted` in localStorage.
- Mute via `setMicrophoneEnabled`.
- Presence from participants; speaking via `isSpeaking`.
- Connection: Connecting / Connected / Reconnecting / Disconnected.
- Leave disconnects and returns to lobby.
- Denied mic: toast, stay in room listen-only.

---

### Task 5: Camera + single screen share

- Camera off by default; `setCameraEnabled`.
- Screen: `setScreenShareEnabled` with `ScreenSharePresets.h1080fps15` and `contentHint: 'detail'`.
- If any participant already has `Track.Source.ScreenShare`, toast `"{name} já está compartilhando a tela."` and do not publish.
- Large stage for the active share; camera grid below.

---

### Task 6: Chat, devices, quality, mobile

- Data packets `{ type: "chat", text, displayName }`.
- Device picker (mic in, speaker out via `setSinkId` when present).
- Quality: Excellent/Good → Excelente; Poor → Instável; Lost → Ruim; show RTT if `localParticipant` engine stats available, else omit number.
- Mobile drawer for rooms; 44px+ controls.

---

## Manual test checklist

Spec items 1–13; Chrome + a second browser. Requires LiveKit Cloud env on the server.
