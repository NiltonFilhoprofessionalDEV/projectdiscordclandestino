# Voice Rooms — Design Spec

Date: 2026-09-08  
Status: draft pending user review  
Audience: friends-only web app (no accounts)

## Problem

A small group needs Discord-like voice rooms: open the site, pick a name, click a permanent room, talk immediately. Quality of audio, low latency, stable connection, and readable screen share matter more than extra social features.

Out of scope: signup, login, email, passwords, profiles, admin roles, meeting creation, invite links, scheduling, message history, room CRUD UI, access codes.

## Goals

1. High-quality voice (Opus via WebRTC, AEC/NS/AGC when the browser supports them)
2. Stable connection with automatic reconnect
3. Screen share with sharp text and a single highlighted share per room
4. Extremely simple UX
5. Secrets never in the frontend

Success looks like: two or three people join Geral, speak with low delay, one shares a screen, others see it, mute works, leave works, closing a tab updates presence, a brief network drop reconnects without a refresh.

## Architecture

Recommended path: **LiveKit Cloud (SFU) + tiny token API + Vite React SPA**.

```
Browser (React)
  → GET /api/rooms          occupancy
  → POST /api/token         { displayName, roomId }
  → LiveKit Cloud           WebRTC + signaling (audio/video/screen/data)
```

| Piece | Role |
| --- | --- |
| `web/` | Vite, React, TypeScript, Tailwind, shadcn/ui, Lucide, `livekit-client` |
| `server/` | Hono (Node): rooms list, occupancy, JWT minting |
| LiveKit Cloud | SFU, TURN, reconnect, track subscribe |

Audio, video, and screen never travel through the app WebSocket or any database. Chat uses LiveKit data packets (ephemeral). Presence is LiveKit participants.

Repo layout: single git repo with `web/` and `server/`, plus a root README for env vars. Optional later: Docker Compose for a self-hosted LiveKit; not required for the Cloud MVP.

### Environment (server only)

- `LIVEKIT_URL` — WebSocket URL of the Cloud project (also returned to the client with the token; it is not a secret)
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `APP_ORIGIN` — allowed CORS origin
- `PORT`

Frontend may know a public `VITE_API_BASE_URL` pointing at the token server.

## Rooms

Permanent, config-driven, no create-meeting flow:

| id | label |
| --- | --- |
| `geral` | Geral |
| `jogos` | Jogos |
| `reuniao` | Reunião |
| `desenvolvimento` | Desenvolvimento |

Unknown `roomId` → HTTP 400. Rooms exist even when empty; LiveKit creates the SFU room on first join. Occupancy 0 when `listRooms` does not return that name.

Switching rooms: disconnect current LiveKit room, request a new token, connect to the other id.

## Identity (no accounts)

- Prompt on first visit: “Qual é o seu nome?”
- Persist `displayName` in `localStorage`
- Reuse on later visits; allow rename in the sidebar footer
- Validation (client and server): trim, length 2–32, reject empty, reject `<` `>` and other markup characters, reject control characters
- LiveKit `identity`: sanitized slug of the name + short random suffix so two “Nilton”s do not collide
- LiveKit `name`: the display name shown in the UI

Rename while in a room: disconnect and reconnect with a new token (simplest consistent presence).

## Frontend structure

```
web/src/
  pages/          Home (name gate + lobby + room shell)
  components/
    rooms/        room list, occupancy
    participants/ presence list, video tiles
    controls/     mic, camera, screen, devices, leave, connection badge
    chat/         room chat
  hooks/          useRoom, useParticipants, useMedia, useConnectionQuality, useChat
  services/       api client, livekit connect helpers
  lib/            name validation, storage, room config mirror
  types/
```

Routing: no public meeting URLs. State is local: not named → name screen; named, not in a room → lobby; in a room → room layout. Clicking a room is immediate join.

## UI

Dark theme, original visual language (not Discord’s brand). Desktop-first.

- **Sidebar:** room list with occupancy (“3 pessoas” / “1 pessoa”); current user name at the bottom
- **Main:** room title; optional large screen-share stage; video grid of camera subscribers; participant list with speaking/mute
- **Chat:** desktop right column; mobile sheet/tab
- **Control bar:** mic, camera, screen share, device settings, leave
- **Connection:** Conectado / Reconectando… / Desconectado
- **Quality (when connected):** Excelente / Instável / Ruim, plus approximate RTT when the SDK provides it

Mobile: sidebar in a drawer; large tap targets; screen share only if `getDisplayMedia` exists.

## Media

### Audio

- Publish microphone on join (unless user preference `micMuted` in `localStorage` is true)
- Constraints: `echoCancellation`, `noiseSuppression`, `autoGainControl`
- Mute = pause/mute the published track, not a full device teardown on every click
- Device pickers: input always; output via `HTMLMediaElement.setSinkId` when supported
- Speaking indicator from LiveKit audio levels

### Video

- Camera starts unpublished
- User toggle publishes/unpublishes camera
- Simulcast on; adaptive stream on subscribe; dynacast on

### Screen share

- LiveKit screen share (`getDisplayMedia` under the hood)
- Capture hint aimed at sharp text (content hint `detail`), up to 1080p, moderate FPS, bitrate biased to clarity over webcam defaults
- Exactly one highlighted share: if any remote (or local) screen track is already active, refuse a second publish and toast: “{name} já está compartilhando a tela.”
- Stop via control bar or browser “stop sharing”

### Connection

- Use LiveKit client auto-reconnect
- On Leave and `pagehide`/`beforeunload`: `room.disconnect()`
- Denied mic/camera/screen: stay in the room, show a toast, allow listen-only

## Chat

- Optional UI, per LiveKit room
- Send JSON over data channel: `{ type: "chat", text, displayName }`
- Max text length 500; strip/ignore HTML
- No persistence, no edit/delete, no DMs, no attachments

## Backend API

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/health` | liveness |
| GET | `/api/rooms` | configured rooms + occupancy from RoomService |
| POST | `/api/token` | body `{ displayName, roomId }` → `{ token, url, roomId }` |

Token grants: `roomJoin` for that room only; `canPublish`, `canSubscribe`, `canPublishData`; TTL 1–2 hours.

Occupancy: `RoomServiceClient.listParticipants(roomName)` or room participant count from `listRooms`. Poll from lobby every few seconds and on window focus. Live presence inside a room comes from the SDK, not this poll.

Rate limit `POST /api/token` (per IP). CORS allowlist `APP_ORIGIN`.

## Security

- API key/secret only on the server
- Validate `roomId` against the allowlist
- Validate display name as above
- No auth cookies, no user database
- Friends-only threat model: anyone with the site URL can join; acceptable for MVP
- Access code explicitly deferred

## Quality settings (LiveKit client)

Connect with:

- `adaptiveStream: true`
- `dynacast: true`
- audio capture defaults with AEC/NS/AGC
- video simulcast
- screen share preset/options favoring resolution and `detail` content hint

Do not treat “audio attached” as done. Evaluate delay, clipping, CPU, bandwidth, screen-text sharpness, and behavior on a degraded network.

## Testing (manual, required)

Two browsers minimum (e.g. Chrome + Firefox or Chrome + Edge).

1. Two users in the same room  
2. Three users in the same room  
3. Late joiner hears/sees existing members  
4. Leave updates others’ presence  
5. Mute  
6. Camera on  
7. Screen share  
8. Stop share  
9. Close tab  
10. Temporary network loss  
11. Auto reconnect  
12. Mic permission denied  
13. Camera permission denied  

Automated tests for the MVP: name validation unit tests; token endpoint validation (invalid name, unknown room) if the server is easy to boot in CI. Full WebRTC E2E is manual.

## Phased delivery

| Phase | Deliverable |
| --- | --- |
| 1 | Name gate, lobby, join/leave shell (token + empty LiveKit room) |
| 2 | Audio, mute, presence, reconnect |
| 3 | Camera, screen share + single-share rule |
| 4 | Chat |
| 5 | Quality badge, device picker, mobile layout polish |

## Explicit non-goals (MVP)

Room admin UI, persistent chat, recordings, bots, roles, friends list, notifications, PWA install, self-hosted LiveKit as the default, mesh P2P.

## Open decisions (closed)

- Hosting: LiveKit Cloud  
- Chat storage: none (data channel only)  
- Occupancy outside a room: server polls RoomService  
- Second screen share: blocked with named toast  
- Rename in-room: reconnect with new token  
