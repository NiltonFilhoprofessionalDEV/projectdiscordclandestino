# Salas Communities and Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one release that adds Supabase-backed accounts, persistent communities with text/voice channels, persistent chat, configurable UX sounds, individual audio controls, fullscreen screen share, collapsible voice chat, and a true full-viewport layout.

**Architecture:** Supabase Auth identifies users; PostgreSQL with RLS stores communities, membership, channels, messages, and invitations; Supabase Realtime distributes message inserts. Hono verifies bearer sessions and performs privileged transactions before issuing LiveKit tokens. LiveKit remains the only media transport, while React owns per-track audio elements and local preferences.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Hono 4, Vitest 3, Supabase CLI/PostgreSQL/Auth/Realtime, `@supabase/supabase-js` 2.116.0, LiveKit 2.

**Spec:** `docs/superpowers/specs/2026-09-09-salas-communities-media-design.md`

## Global Constraints

- One final user-facing release; internal tasks remain independently verified.
- Supabase local only; do not create or link a remote project.
- Never overwrite or commit `.env` files.
- Never expose Supabase secret/service-role credentials to `web/` or `VITE_*`.
- Keep LiveKit for media only; persistent chat uses Supabase.
- Keep message content at 500 characters and render it as text.
- Store invitation hashes, never raw invitation tokens.
- Validate authorization server-side before issuing a LiveKit token.
- Preserve `owner`, `admin`, and `member` roles.
- No mock users, messages, presence, or activity in production code.
- Do not add audio asset packages; use native Web Audio and Fullscreen APIs.
- Keep files below 300 lines of logic and functions below 50 lines.
- Support 360, 768, 1280, and 1440 px.
- Preserve the user's unrelated changes in `docker-compose.yml`, `shared/name.ts`, and `shared/rooms.json`.
- `@supabase/supabase-js` vetting: version 2.116.0, published 2026-09-07, MIT, built-in types, approximately 648 KB unpacked; run `npm audit` after installation.
- Supabase CLI package vetting: version 2.117.0, published 2026-09-08, MIT; install it as a pinned dev dependency.

---

### Task 1: Local Supabase foundation and typed schema

**Files:**
- Modify: `package.json`
- Modify: `web/package.json`
- Modify: `server/package.json`
- Create: `supabase/config.toml`
- Create: `supabase/migrations/20260909010000_communities.sql`
- Create: `supabase/seed.sql`
- Create: `supabase/tests/communities_rls.test.sql`
- Create: `shared/database.types.ts`

**Interfaces:**
- Produces enums `community_visibility`, `community_role`, `channel_type`.
- Produces RPCs `create_community`, `accept_invite`, `is_community_member`, and `can_manage_community`.
- Produces generated TypeScript `Database`.

- [ ] **Step 1: Create an isolated worktree and confirm the baseline**

Create branch `feat/communities-media` from current `master` using the worktree workflow. Run:

```powershell
npm install
npm test
npx tsc -p web/tsconfig.app.json --noEmit
npm run build -w web
```

Expected: 12 existing tests pass and the web build exits 0 before changes.

- [ ] **Step 2: Install the official SDK**

```powershell
npm install @supabase/supabase-js@2.116.0 -w web -w server
npm install --save-dev supabase@2.117.0
npm audit --omit=dev
```

Do not continue with a high/critical advisory affecting the SDK. Record moderate advisories and determine whether they are pre-existing.

- [ ] **Step 3: Initialize Supabase local**

```powershell
npx supabase init
npx supabase start
```

Keep generated local credentials out of tracked env files. Add scripts:

```json
"supabase:start": "supabase start",
"supabase:stop": "supabase stop",
"supabase:reset": "supabase db reset",
"supabase:test": "supabase test db",
"supabase:types": "supabase gen types typescript --local > shared/database.types.ts"
```

- [ ] **Step 4: Write the core migration**

Create enums and tables exactly from the spec. Include deletion behavior:

```sql
create type public.community_visibility as enum ('public', 'private');
create type public.community_role as enum ('owner', 'admin', 'member');
create type public.channel_type as enum ('text', 'voice');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 32),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null check (char_length(name) between 2 and 48),
  slug text not null unique,
  visibility public.community_visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.community_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 48),
  type public.channel_type not null,
  position integer not null check (position >= 0),
  companion_text_channel_id uuid references public.channels(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (community_id, type, name)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  content text not null check (char_length(content) between 1 and 500),
  client_nonce uuid not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  unique (author_id, client_nonce)
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  token_hash text not null unique,
  expires_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  use_count integer not null default 0 check (use_count >= 0),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
```

Add indexes on every foreign key used by RLS and pagination:

```sql
create index community_members_user_id_idx on public.community_members(user_id);
create index channels_community_position_idx on public.channels(community_id, type, position);
create index messages_channel_cursor_idx on public.messages(channel_id, created_at desc, id desc);
create index invites_community_id_idx on public.invites(community_id);
```

- [ ] **Step 5: Add profile trigger and transactional community creation**

Implement `handle_new_user()` with fixed `search_path`, then
`create_community(name, slug, visibility)` as a security-definer function. It must create:

1. community;
2. owner membership;
3. text channel `geral`;
4. voice channel `Geral`;
5. companion text channel `chat-geral`;
6. relation from voice to companion channel.

Revoke public execution and grant only to `authenticated`.

- [ ] **Step 6: Add RLS policies**

Enable RLS on every table. Implement helper functions:

```sql
create function public.is_community_member(target uuid)
returns boolean language sql stable security definer
set search_path = public
as $$ select exists (
  select 1 from community_members
  where community_id = target and user_id = auth.uid()
) $$;

create function public.can_manage_community(target uuid)
returns boolean language sql stable security definer
set search_path = public
as $$ select exists (
  select 1 from community_members
  where community_id = target
    and user_id = auth.uid()
    and role in ('owner', 'admin')
) $$;
```

Policies must enforce the matrix in the spec. Message insert policy must verify the channel is `text` and the author equals `auth.uid()`.

- [ ] **Step 7: Add RLS database tests**

Use pgTAP to create two users and test:

- anonymous reads public communities but not private communities;
- non-member cannot read private channels/messages;
- member can read/post;
- member cannot create channels;
- admin creates channels but cannot change owner;
- owner can manage roles;
- `create_community` creates exactly one owner and three default channel rows.

Run:

```powershell
npx supabase db reset
npx supabase test db
npm run supabase:types
```

Expected: all pgTAP assertions pass and `shared/database.types.ts` is regenerated.

- [ ] **Step 8: Commit foundation**

```powershell
git add package.json package-lock.json web/package.json server/package.json supabase shared/database.types.ts
git commit -m "feat: add Supabase communities schema and RLS"
```

---

### Task 2: Shared contracts and validation

**Files:**
- Create: `shared/community.ts`
- Create: `shared/community.test.ts`
- Create: `shared/api.ts`
- Modify: `shared/chat.ts`
- Modify: `shared/vitest.config.ts`

**Interfaces:**
- Produces `CommunityId`, `ChannelId`, `CommunityRole`, `ChannelType`.
- Produces parsers `parseCommunityName`, `parseChannelName`, `parseMessageText`.
- Produces `ApiResult<T>` and request payload types.

- [ ] **Step 1: Write failing parser tests**

Cover trimming, repeated whitespace, accents, minimum/maximum lengths, control characters, `<`/`>`, and empty values:

```ts
expect(parseCommunityName("  Minha   Turma ")).toEqual({ ok: true, value: "Minha Turma" });
expect(parseChannelName("dev front")).toEqual({ ok: true, value: "dev-front" });
expect(parseCommunityName("<script>")).toEqual({
  ok: false,
  error: "O nome contém caracteres inválidos.",
});
```

Run `npm run test -w shared`; expected failure because parsers do not exist.

- [ ] **Step 2: Implement branded IDs and parsers**

Use:

```ts
export type CommunityId = string & { readonly __brand: "CommunityId" };
export type ChannelId = string & { readonly __brand: "ChannelId" };
export type CommunityRole = "owner" | "admin" | "member";
export type ChannelType = "text" | "voice";
```

Keep validation pure and dependency-free. Replace `parseChatText` with the exported `parseMessageText` while retaining a compatibility export until all consumers migrate.

- [ ] **Step 3: Define API results**

```ts
export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ApiErrorCode; message: string } };
```

Define exact DTOs for community/channel creation, invites, and LiveKit token response.

- [ ] **Step 4: Run and commit**

Run `npm run test -w shared`; expected all tests pass.

```powershell
git add shared
git commit -m "feat: add community and channel contracts"
```

---

### Task 3: Supabase clients and authentication

**Files:**
- Create: `web/src/services/supabase.ts`
- Create: `server/src/supabase.ts`
- Create: `web/src/auth/AuthProvider.tsx`
- Create: `web/src/auth/useAuth.ts`
- Create: `web/src/pages/AuthPage.tsx`
- Create: `web/src/components/auth/AuthForm.tsx`
- Create: `web/src/components/auth/GoogleButton.tsx`
- Modify: `web/src/App.tsx`
- Modify: `server/src/config.ts`
- Create: `web/.env.example`
- Create: `server/.env.example`

**Interfaces:**
- Produces `AuthContextValue { session, user, profile, loading, signOut }`.
- Produces browser `supabase` typed with `Database`.
- Produces `requireUser(authorizationHeader): Promise<AuthResult>`.

- [ ] **Step 1: Create environment guards and typed clients**

Browser client:

```ts
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Supabase público não configurado.");

export const supabase = createClient<Database>(url, key, {
  auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true },
});
```

Server client reads `SUPABASE_URL` and `SUPABASE_SECRET_KEY`; never use a
`VITE_` variable server-side.

- [ ] **Step 2: Test server bearer authentication**

Mock only the Supabase client boundary. Cover missing bearer, malformed bearer,
invalid token, and valid user. `requireUser` must call
`supabase.auth.getUser(accessToken)`, not trust decoded JWT payload alone.

- [ ] **Step 3: Implement `AuthProvider`**

On mount call `getSession()`, subscribe to `onAuthStateChange`, load profile
when a user exists, and unsubscribe on cleanup. Expose explicit loading/error
states; do not render protected surfaces before resolution.

- [ ] **Step 4: Build e-mail/password and Google flows**

Implement sign-up/sign-in mode, validation, and:

```ts
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: `${window.location.origin}/` },
});
```

When Google provider is not configured, show a specific non-destructive error.
Never log credentials or Supabase error objects containing request metadata.

- [ ] **Step 5: Replace NameGate routing**

`App` renders `AuthPage` without a session and `Home` with `{ user, profile }`
when authenticated. Remove display-name identity from `localStorage`; retain
only device and UI preferences.

- [ ] **Step 6: Verify and commit**

Run server tests, TypeScript, and build. Manually verify local e-mail signup,
sign-in, reload session, and sign-out.

```powershell
git add web/src/auth web/src/components/auth web/src/pages/AuthPage.tsx web/src/services/supabase.ts web/src/App.tsx server/src/supabase.ts server/src/config.ts server/src server/.env.example web/.env.example
git commit -m "feat: add Supabase authentication"
```

---

### Task 4: Authorized communities, channels, invites, and LiveKit tokens

**Files:**
- Create: `server/src/http/auth.ts`
- Create: `server/src/http/communities.ts`
- Create: `server/src/http/channels.ts`
- Create: `server/src/http/invites.ts`
- Create: `server/src/http/livekit-token.ts`
- Create: `server/src/repositories/communityRepository.ts`
- Modify: `server/src/app.ts`
- Modify: `server/src/http-handlers.ts`
- Modify: `server/src/rateLimit.ts`
- Modify: `server/src/livekit.ts`
- Modify: `server/src/app.test.ts`
- Modify: `api/[[...route]].ts`

**Interfaces:**
- Consumes bearer access token and shared DTOs.
- Produces the API routes listed in the spec.
- Produces LiveKit room key `community:<uuid>:voice:<uuid>`.

- [ ] **Step 1: Write failing route contract tests**

Add tests for:

- unauthenticated create returns `401 UNAUTHENTICATED`;
- member attempting channel creation returns `403 FORBIDDEN`;
- invalid names return `400 VALIDATION`;
- duplicate names return `409 CONFLICT`;
- private community hidden from non-member returns `404 NOT_FOUND`;
- token endpoint rejects text channel and non-member;
- accepted invite adds membership exactly once.

Use repository and auth stubs, not a mocked Hono response.

- [ ] **Step 2: Add authenticated middleware**

Read `Authorization: Bearer <token>`, call `requireUser`, and attach the user to
Hono context. CORS must allow `Authorization` and methods
`GET, POST, PATCH, DELETE, OPTIONS`.

- [ ] **Step 3: Implement repository boundaries**

Repository methods return `ApiResult<T>`:

```ts
listCommunities(userId: string): Promise<ApiResult<CommunitySummary[]>>
createCommunity(userId: string, input: CreateCommunityInput): Promise<ApiResult<Community>>
createChannel(userId: string, communityId: string, input: CreateChannelInput): Promise<ApiResult<Channel>>
acceptInvite(userId: string, rawToken: string): Promise<ApiResult<CommunityMembership>>
canJoinVoice(userId: string, channelId: string): Promise<ApiResult<VoiceAccess>>
```

Expected Postgres errors are mapped once in the repository; unexpected errors
are logged without user data and return a generic failure.

- [ ] **Step 4: Implement invite hashing**

Generate 32 random bytes with `crypto.randomBytes`, encode base64url, hash with
SHA-256, store only the hash, and return the raw token once. Accept/revoke uses
RPC transactions.

- [ ] **Step 5: Replace static LiveKit token input**

Request:

```ts
type LiveKitTokenInput = { channelId: ChannelId };
```

After `canJoinVoice`, create the token using authenticated profile display
name and `community:${communityId}:voice:${channelId}`. Remove trust in a
client-supplied display name.

- [ ] **Step 6: Expand rate limiting**

Use named limiters for community creation, channel creation, invites,
messages, and LiveKit tokens. Keep IP plus user ID as key when authenticated.
Return `Retry-After`.

- [ ] **Step 7: Run and commit**

Run server tests; expected all route and existing health tests pass.

```powershell
git add server api shared
git commit -m "feat: add authorized community and channel APIs"
```

---

### Task 5: Full-viewport community and channel shell

**Files:**
- Create: `web/src/hooks/useCommunities.ts`
- Create: `web/src/hooks/useChannels.ts`
- Create: `web/src/components/communities/CommunityRail.tsx`
- Create: `web/src/components/communities/CreateCommunityDialog.tsx`
- Create: `web/src/components/channels/ChannelSidebar.tsx`
- Create: `web/src/components/channels/CreateChannelDialog.tsx`
- Create: `web/src/components/members/MemberPanel.tsx`
- Modify: `web/src/services/api.ts`
- Modify: `web/src/pages/Home.tsx`
- Modify: `web/src/index.css`
- Modify: `web/src/components/explore/ExploreView.tsx`
- Delete: `web/src/components/shell/NavigationPanel.tsx`
- Delete: `web/src/components/shell/ServerRail.tsx`

**Interfaces:**
- Produces separate `activeVoiceChannelId` and `activeTextChannelId`.
- `useCommunities()` returns `{ communities, selectedId, select, create, status }`.
- `useChannels(communityId)` returns grouped text/voice channels.

- [ ] **Step 1: Add authenticated API client**

Centralize bearer headers:

```ts
async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const response = await fetch(path, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  return response.json() as Promise<ApiResult<T>>;
}
```

Do not duplicate auth/header logic in hooks.

- [ ] **Step 2: Build community and channel hooks**

Use request IDs or `AbortController` to prevent stale community/channel
responses from replacing newer selections. Expose expected errors as values,
not thrown exceptions.

- [ ] **Step 3: Build dialogs**

Community dialog fields: name and visibility. Channel dialog fields: name and
type. Owner/admin sees create controls; members do not. On success, select the
new resource and restore focus to the trigger on close.

- [ ] **Step 4: Replace the shell**

Use:

```tsx
<div className="grid h-dvh w-dvw overflow-hidden bg-night text-cloud md:grid-cols-[76px_256px_minmax(0,1fr)] xl:grid-cols-[76px_256px_minmax(0,1fr)_288px]">
```

Remove `max-w-[1600px]`, outer padding, rounded desktop frame, and duplicate
profile card. The member panel hides below `xl`; rail/sidebar become drawers
below `md`.

- [ ] **Step 5: Adapt Explore to persistent public communities**

Replace fixed room cards in `ExploreView` with `CommunitySummary[]` from
`useCommunities`. Show joined communities first and searchable public
communities second. Private communities never appear unless the current user
is a member; empty and API-error states keep an explicit retry action.

- [ ] **Step 6: Preserve voice while browsing text**

Selecting text updates only `activeTextChannelId`. Selecting voice updates
`activeVoiceChannelId` and connects LiveKit. Leaving voice clears only voice
state. Header always shows selected community and current center surface.

- [ ] **Step 7: Verify and commit**

Test 360/768/1280/1440, create public/private community, create text/voice
channels, permission-hidden controls, and no horizontal overflow.

```powershell
git add web/src
git commit -m "feat: add full-viewport community channel shell"
```

---

### Task 6: Persistent realtime chat and collapsible voice chat

**Files:**
- Rewrite: `web/src/hooks/useChat.ts`
- Create: `web/src/components/chat/MessageList.tsx`
- Create: `web/src/components/chat/MessageComposer.tsx`
- Create: `web/src/components/chat/VoiceChatDrawer.tsx`
- Modify: `web/src/components/chat/ChatPanel.tsx`
- Modify: `web/src/lib/storage.ts`
- Modify: `web/src/pages/Home.tsx`

**Interfaces:**
- `useChat(channelId: ChannelId | null)` returns:

```ts
{
  messages: ChatMessage[];
  status: "idle" | "loading" | "ready" | "error";
  hasMore: boolean;
  loadOlder(): Promise<void>;
  send(text: string): Promise<ApiResult<void>>;
  retry(clientNonce: string): Promise<ApiResult<void>>;
}
```

- [ ] **Step 1: Implement paginated initial load**

Fetch 50 newest non-deleted messages ordered by `created_at desc, id desc`,
then reverse for rendering. Older pages use both cursor fields to avoid
duplicates at equal timestamps.

- [ ] **Step 2: Implement realtime subscription**

Subscribe to `postgres_changes` INSERT filtered by `channel_id`. Deduplicate
with a `Map` keyed by message ID and unsubscribe using
`supabase.removeChannel(channel)` on channel change/unmount.

- [ ] **Step 3: Implement optimistic send and retry**

Create one `clientNonce` before insert. Optimistic messages transition
`sending → sent|failed`. Retry reuses the same nonce so the database unique
constraint prevents duplication.

- [ ] **Step 4: Split rendering and composer**

`MessageList` handles history/loading/empty/error. `MessageComposer` validates
with `parseMessageText`, submits, and exposes retry. Neither component knows
about LiveKit.

- [ ] **Step 5: Add accessible collapsible voice drawer**

Persist `voiceChatOpen` in localStorage, default `false`. Trigger uses
`aria-expanded` and `aria-controls`. Open moves focus to the drawer heading;
close restores focus to trigger. Track unseen realtime messages while closed.

- [ ] **Step 6: Verify and commit**

Verify persistence after reload, two-browser realtime, retry after forced
network failure, channel switching cleanup, and drawer preference.

```powershell
git add web/src/components/chat web/src/hooks/useChat.ts web/src/lib/storage.ts web/src/pages/Home.tsx
git commit -m "feat: add persistent realtime channel chat"
```

---

### Task 7: UX SoundEngine

**Files:**
- Create: `web/src/services/soundEngine.ts`
- Create: `web/src/services/soundEngine.test.ts`
- Create: `web/src/hooks/useRoomSounds.ts`
- Create: `web/src/components/controls/SoundSettings.tsx`
- Modify: `web/src/lib/storage.ts`
- Modify: `web/src/hooks/useRoom.ts`
- Modify: `web/package.json`

**Interfaces:**
- Produces `SoundEvent = "selfJoin" | "selfLeave" | "participantJoin" | "participantLeave" | "screenShareStart"`.
- Produces singleton methods `unlock`, `play`, `setVolume`, `setMuted`, `dispose`.

- [ ] **Step 1: Add a frontend Vitest config**

Add Vitest as a dev dependency and a `test` script. Use a Node environment;
mock only `AudioContext`, oscillators, gain, and timers.

- [ ] **Step 2: Write failing SoundEngine tests**

Verify no sound before unlock, no-op without Web Audio, gain never exceeds
`0.12`, mute prevents play, volume clamps `0..1`, and duplicate identity/event
within 800 ms plays once.

- [ ] **Step 3: Implement original tones**

Each event uses two short oscillators and a gain envelope. Maximum duration is
400 ms. `selfJoin` rises, `selfLeave` falls, participant events use quieter
variants, and screen share uses a neutral two-note pulse.

- [ ] **Step 4: Bind LiveKit events**

`useRoomSounds` snapshots existing participant identities before registering
join/leave handlers. It listens for `ParticipantConnected`,
`ParticipantDisconnected`, and first `ScreenShare` publication. Reconnect does
not replay the initial set.

- [ ] **Step 5: Add settings**

Expose effects mute and a 0–100 slider. Persist locally. Call `unlock()` from
the first explicit enter-room action, not on page load.

- [ ] **Step 6: Run and commit**

```powershell
npm run test -w web
git add web/src/services/soundEngine.ts web/src/services/soundEngine.test.ts web/src/hooks/useRoomSounds.ts web/src/components/controls/SoundSettings.tsx web/src/lib/storage.ts web/src/hooks/useRoom.ts web/package.json package-lock.json
git commit -m "feat: add configurable room event sounds"
```

---

### Task 8: Per-participant audio and fullscreen screen-share player

**Files:**
- Create: `web/src/components/media/RemoteAudioTrack.tsx`
- Create: `web/src/components/media/ParticipantAudioControl.tsx`
- Create: `web/src/components/media/ScreenSharePlayer.tsx`
- Create: `web/src/hooks/useAudioPreferences.ts`
- Modify: `web/src/services/livekit.ts`
- Modify: `web/src/hooks/useRoom.ts`
- Modify: `web/src/hooks/useParticipants.ts`
- Modify: `web/src/components/participants/ParticipantList.tsx`
- Modify: `web/src/pages/Home.tsx`

**Interfaces:**
- `RemoteAudioTrackProps { publication, identity, volume, muted }`.
- `ScreenSharePlayerProps { videoPublication, audioPublication, ownerName }`.
- `useAudioPreferences(identity)` returns volume/muted setters with local persistence.

- [ ] **Step 1: Remove global remote-audio attachment**

Delete `attachRemoteAudio`/`detachTrack` calls from `useRoom`. Keep video track
attachment in media components. Ensure no hidden global audio elements remain.

- [ ] **Step 2: Implement controlled microphone audio**

Attach publication track to a dedicated `<audio>` in `useEffect`; set
`element.volume = clamp(volume, 0, 1)` and `element.muted = muted`; detach on
cleanup. Render one instance per remote microphone publication.

- [ ] **Step 3: Add participant controls**

Each remote participant row gets mute and range slider. Local participant does
not show a remote-volume control. Persist by stable LiveKit identity.

- [ ] **Step 4: Implement screen-share player**

The container owns a video element and optional audio element. Implement:

```ts
async function enterFullscreen() {
  if (!containerRef.current?.requestFullscreen) {
    return { ok: false, error: "Tela cheia não está disponível neste navegador." };
  }
  await containerRef.current.requestFullscreen();
  return { ok: true };
}
```

Listen for `fullscreenchange`, expose a 0–100 audio slider and mute button, and
display “Esta transmissão não contém áudio” when no ScreenShareAudio exists.

- [ ] **Step 5: Prevent duplicate screen-share audio**

Exclude `Track.Source.ScreenShareAudio` from participant microphone controls.
Only `ScreenSharePlayer` attaches it. Switching owners detaches both old tracks.

- [ ] **Step 6: Verify and commit**

Use two browser contexts to verify participant volume/mute, screen audio
volume/mute, fullscreen enter/exit, no-audio state, owner switch, and cleanup.

```powershell
git add web/src/components/media web/src/components/participants web/src/hooks web/src/services/livekit.ts web/src/pages/Home.tsx
git commit -m "feat: add controlled audio and fullscreen screen sharing"
```

---

### Task 9: Integrated security, accessibility, and release verification

**Files:**
- Modify only files with defects observed during this task.
- Update: `README.md`
- Update: `.env.example` files only; never `.env`.

**Interfaces:**
- No new public interfaces.

- [ ] **Step 1: Run database and unit suites**

```powershell
npx supabase db reset
npx supabase test db
npm test
npm run test -w web
npm run build -w server
npx tsc -p web/tsconfig.app.json --noEmit
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 2: Run dependency and database checks**

```powershell
npm audit
npx supabase db lint --local
```

Stop for high/critical vulnerabilities, exposed service credentials, unsafe
security-definer search paths, or RLS-disabled public tables.

- [ ] **Step 3: Verify complete user journeys**

In two browser contexts:

1. create two e-mail accounts;
2. create public and private communities;
3. create text and voice channels;
4. join private community via invitation;
5. verify member/admin/owner controls;
6. exchange realtime messages and reload history;
7. remain in voice while switching text channels;
8. expand/collapse voice chat and reload preference;
9. hear deduplicated join/leave/share sounds;
10. adjust participant and stream volume/mute;
11. enter/exit fullscreen;
12. leave voice without leaving the community.

- [ ] **Step 4: Verify layouts and accessibility**

At 360, 768, 1280, and 1440 px confirm:

- viewport has no outer margins or horizontal overflow;
- drawers close with Escape and restore focus;
- dialogs trap focus and have labels/descriptions;
- controls are at least 44 px;
- sliders have accessible names and current values;
- keyboard focus is visible;
- reduced motion disables nonessential animation;
- chat and media remain usable at 200% zoom.

- [ ] **Step 5: Update setup documentation**

Document Node 22, Docker, Supabase CLI commands, generated local keys, server
and web env variable names, e-mail flow, optional Google provider setup, and
LiveKit credentials. Do not include real keys.

- [ ] **Step 6: Final security checklist**

Confirm:

- no secret in frontend bundle or logs;
- RLS on every public table;
- server checks membership for LiveKit;
- raw invitation tokens are not stored;
- message content is rendered as text;
- rate limits cover public mutation endpoints;
- no PII/token appears in logs.

- [ ] **Step 7: Commit release hardening**

```powershell
git add README.md web server shared supabase web/.env.example server/.env.example
git commit -m "docs: finalize communities and media release"
```

Run `git status --short`; expected clean working tree.
