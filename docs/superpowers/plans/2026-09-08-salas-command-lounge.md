# Salas Command Lounge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the existing Salas voice-room interface as the responsive Command Lounge visual system without changing its LiveKit, API, room, chat, or persistence behavior.

**Architecture:** Keep the existing React state and hooks as the source of truth. Replace the magenta glass-heavy presentation with shared Command Lounge tokens, split the oversized `Home` composition into focused shell components, and let each product surface consume the same semantic variants. Verify visual behavior in the browser because this repository has no frontend component-test harness.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, class-variance-authority, Lucide React, LiveKit.

**Spec:** `docs/superpowers/specs/2026-09-08-salas-command-lounge-design.md`

## Global Constraints

- Keep the brand name exactly `Salas`.
- Do not alter server, API, LiveKit, room identifiers, chat contracts, or storage behavior.
- Use `Night #171B3A`, `Abyss #10142E`, `Deck #20264C`, `Electric #5D7CFF`, `Pulse #8A4DFF`, `Coral #FF5D73`, `Cloud #F4F6FF`, and `Haze #9BA5CA`.
- Use Syne 700 only for brand, screen titles, and display values; use Figtree 400/500/600 elsewhere.
- Reserve glassmorphism for the top bar and floating call controls; sidebars and cards use solid surfaces.
- Keep all interactive targets at least 44 px and preserve visible keyboard focus.
- Respect `prefers-reduced-motion`.
- Support 360 px, 768 px, 1280 px, and 1440 px widths.
- Do not add dependencies.
- Do not stage or modify the pre-existing changes in `package.json`, `package-lock.json`, or `web/package.json`.

---

### Task 1: Command Lounge tokens and UI primitives

**Files:**
- Modify: `web/src/index.css`
- Modify: `web/src/components/ui/button.tsx`
- Modify: `web/src/components/ui/input.tsx`

**Interfaces:**
- Consumes: existing Tailwind theme names used throughout the app.
- Produces: semantic color utilities `night`, `abyss`, `deck`, `electric`, `pulse`, `coral`, `cloud`, and `haze`; surface classes `surface`, `surface-raised`, `glass-bar`; focus behavior shared by `Button` and `Input`.

- [ ] **Step 1: Capture the existing visual baseline**

Run the app with `npm run dev:web`, open `http://localhost:5173`, and capture the NameGate or Explore screen at 1440×900. Record that the current theme uses `#160f29` and `#ff4ec8`, so the later visual comparison can prove the rebrand occurred.

- [ ] **Step 2: Replace the global theme tokens**

Replace the `@theme` color and shadow section in `web/src/index.css` with:

```css
  --color-night: #171b3a;
  --color-abyss: #10142e;
  --color-deck: #20264c;
  --color-electric: #5d7cff;
  --color-pulse: #8a4dff;
  --color-coral: #ff5d73;
  --color-cloud: #f4f6ff;
  --color-haze: #9ba5ca;
  --color-ink: #171b3a;
  --color-panel: #20264c;
  --color-void: #10142e;
  --color-fog: #f4f6ff;
  --color-mist: #9ba5ca;
  --color-copper: #8a4dff;
  --color-copper-bright: #a06cff;
  --color-led: #5d7cff;
  --shadow-glow: 0 18px 48px rgba(12, 16, 43, 0.36);
  --shadow-halo: 0 0 0 3px rgba(93, 124, 255, 0.2);
```

Use compatibility aliases for the existing color names during this task so intermediate commits still build.

- [ ] **Step 3: Replace decorative glass helpers with semantic surfaces**

Add these classes and remove the old magenta halo:

```css
.surface {
  background: rgba(32, 38, 76, 0.96);
  border: 1px solid rgba(155, 165, 202, 0.12);
}

.surface-raised {
  background: #252c57;
  border: 1px solid rgba(155, 165, 202, 0.14);
  box-shadow: var(--shadow-glow);
}

.glass-bar {
  background: rgba(27, 32, 67, 0.78);
  border: 1px solid rgba(155, 165, 202, 0.13);
  backdrop-filter: blur(18px);
}

.focus-ring:focus-visible {
  outline: 2px solid var(--color-electric);
  outline-offset: 3px;
}
```

Set the body background to `Night` with one restrained radial wash:

```css
background:
  radial-gradient(900px 540px at 74% -18%, rgba(93, 124, 255, 0.2), transparent 62%),
  var(--color-night);
```

- [ ] **Step 4: Implement the pulse-line motion primitive**

Replace `.wave-bar` animation with a reusable line:

```css
.pulse-line {
  background: linear-gradient(90deg, transparent, #5d7cff 38%, #8a4dff 67%, #ff5d73);
  background-size: 180% 100%;
  animation: pulse-travel 3.8s ease-in-out infinite;
}

@keyframes pulse-travel {
  0%, 100% { background-position: 0% 50%; opacity: 0.45; }
  50% { background-position: 100% 50%; opacity: 0.9; }
}

@media (prefers-reduced-motion: reduce) {
  .pulse-line { animation: none; background-position: 50% 50%; }
}
```

- [ ] **Step 5: Update button and input semantic variants**

Use these exact variant meanings in `button.tsx`:

```ts
solid: "bg-electric text-white shadow-[0_10px_24px_rgba(93,124,255,0.24)] hover:bg-[#718cff]",
ghost: "bg-white/5 text-cloud hover:bg-white/9",
danger: "bg-coral text-white hover:bg-[#ff7487]",
live: "bg-electric/16 text-[#9fb1ff] ring-1 ring-electric/30 hover:bg-electric/22",
mute: "bg-coral/14 text-[#ff9cab] ring-1 ring-coral/24 hover:bg-coral/20",
```

Change the shared focus class to `focus-visible:ring-electric/70`. In `input.tsx`, use an Abyss background, Haze placeholder, and Electric focus border/ring.

- [ ] **Step 6: Verify compilation**

Run:

```powershell
npx tsc -p web/tsconfig.app.json --noEmit
npm run build -w web
```

Expected: both commands exit 0; no missing Tailwind token errors.

- [ ] **Step 7: Commit only Task 1 files**

```powershell
git add web/src/index.css web/src/components/ui/button.tsx web/src/components/ui/input.tsx
git commit -m "feat: establish Command Lounge design tokens"
```

---

### Task 2: Responsive shell and pulse signature

**Files:**
- Create: `web/src/components/shell/NavigationPanel.tsx`
- Create: `web/src/components/shell/PulseLine.tsx`
- Modify: `web/src/components/shell/ServerRail.tsx`
- Modify: `web/src/components/shell/ProfilePanel.tsx`
- Delete: `web/src/components/shell/Waveform.tsx`
- Modify: `web/src/pages/Home.tsx`

**Interfaces:**
- Consumes: `RoomOccupancy[]`, `RoomId | null`, `ParticipantView[]`, `displayName`, and existing callbacks.
- Produces:
  - `NavigationPanelProps`: rooms, activeRoomId, draftName, occupancyError, onExplore, onSelect, onDraftName, onCommitName.
  - `PulseLineProps`: `{ active: boolean; className?: string }`.
  - `ServerRail` gains `roomActive: boolean` only if `activeRoomId` is not sufficient internally.

- [ ] **Step 1: Create the pulse signature component**

Create `PulseLine.tsx`:

```tsx
import { cn } from "../../lib/utils.ts";

type PulseLineProps = {
  active: boolean;
  className?: string;
};

export function PulseLine({ active, className }: PulseLineProps) {
  return (
    <span
      className={cn(
        "pulse-line block h-px rounded-full",
        active ? "opacity-100" : "opacity-55",
        className,
      )}
      aria-hidden
    />
  );
}
```

- [ ] **Step 2: Extract navigation from `Home`**

Create `NavigationPanel.tsx` with the existing Explore button, `RoomList`, occupancy error, and rename `Input`. Use a solid `surface` panel. The component owns no state and receives:

```ts
type NavigationPanelProps = {
  rooms: RoomOccupancy[];
  activeRoomId: RoomId | null;
  draftName: string;
  occupancyError: string | null;
  onExplore: () => void;
  onSelect: (id: RoomId) => void;
  onDraftName: (name: string) => void;
  onCommitName: () => void;
};
```

- [ ] **Step 3: Rebuild the rail around the Salas brand**

Replace the generic home circle at the top of `ServerRail` with a 48 px brand mark containing an `S`, Electric/Pulse gradient, and accessible label “Explorar Salas”. Use solid buttons, a 3 px active indicator on the left, and `PulseLine` above the compact user badge. Do not animate individual room buttons.

- [ ] **Step 4: Restyle the presence panel**

In `ProfilePanel.tsx`, use a `surface` panel spanning the available height. Replace the glowing avatar ring with:

```tsx
<span className="flex size-20 items-center justify-center rounded-[1.4rem] bg-linear-to-br from-electric to-pulse font-display text-xl text-white shadow-[0_14px_28px_rgba(93,124,255,0.24)]">
  {initials(displayName)}
</span>
```

Keep real participants and live rooms only. Add `aria-label` to room activity buttons.

- [ ] **Step 5: Simplify `Home` to shell composition**

Remove inline sidebar JSX and render `NavigationPanel`. Use this responsive hierarchy:

```tsx
<div className="min-h-dvh bg-night p-0 text-cloud md:p-3">
  <div className="mx-auto flex min-h-dvh max-w-[1600px] overflow-hidden bg-night md:min-h-[calc(100dvh-1.5rem)] md:rounded-[1.75rem] md:border md:border-white/8 md:shadow-glow">
    <ServerRail />
    <NavigationPanel />
    <section className="flex min-w-0 flex-1 flex-col" />
    <ProfilePanel />
  </div>
</div>
```

The mobile drawer continues to call `setSidebarOpen(false)` after Explore or room selection.

- [ ] **Step 6: Remove the obsolete waveform**

Delete `Waveform.tsx` and confirm no import or class reference remains:

```powershell
rg "Waveform|wave-bar" web/src
```

Expected: no matches.

- [ ] **Step 7: Verify shell behavior**

Run TypeScript and build commands from Task 1. In the browser verify:

- 1440 px: rail, navigation, center, and profile all visible.
- 768 px: profile hidden, rail and navigation visible.
- 360 px: rail and navigation hidden until the menu button opens the drawer.
- Explore selection closes the mobile drawer.

- [ ] **Step 8: Commit Task 2**

```powershell
git add web/src/components/shell web/src/pages/Home.tsx
git commit -m "feat: rebuild responsive Command Lounge shell"
```

---

### Task 3: Discovery experience

**Files:**
- Modify: `web/src/components/explore/ExploreView.tsx`
- Modify: `web/src/components/rooms/RoomList.tsx`

**Interfaces:**
- Consumes: unchanged `ExploreViewProps` and `RoomListProps`.
- Produces: derived `liveRooms` and `allRooms`; no new persisted state.

- [ ] **Step 1: Define category presentation without mock data**

Replace `ROOM_ART` with:

```ts
const ROOM_PRESENTATION: Record<RoomId, {
  eyebrow: string;
  description: string;
  accent: string;
}> = {
  geral: {
    eyebrow: "Conversa aberta",
    description: "Assuntos do dia e encontros espontâneos.",
    accent: "from-electric to-[#49b8ff]",
  },
  jogos: {
    eyebrow: "Squad online",
    description: "Monte o time e entre na partida.",
    accent: "from-pulse to-[#c05cff]",
  },
  reuniao: {
    eyebrow: "Ponto de encontro",
    description: "Alinhe ideias com áudio claro e direto.",
    accent: "from-[#ff8a66] to-coral",
  },
  desenvolvimento: {
    eyebrow: "Build em conjunto",
    description: "Código, produto e decisões técnicas.",
    accent: "from-[#39c6b4] to-electric",
  },
};
```

This is fixed interface copy, not mock occupancy or participant data.

- [ ] **Step 2: Rebuild the hero to reveal content above the fold**

Use a compact two-column hero with the headline “Encontre sua próxima conversa.”, supporting copy, an abstract pulse-line composition, and a small real room count derived from `rooms.length`. Keep height below 250 px at desktop and below 280 px at mobile.

- [ ] **Step 3: Split real rooms into useful sections**

Derive:

```ts
const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
const matchingRooms = rooms.filter((room) =>
  room.label.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
);
const liveRooms = matchingRooms.filter((room) => room.occupantCount > 0);
```

Render “Ao vivo agora” only when `liveRooms.length > 0`, then “Todas as salas” with all matches. Do not duplicate live rooms in the first section when the search has only one result.

- [ ] **Step 4: Build explicit room cards**

Each card displays the fixed eyebrow/description, real occupancy, and a visible “Entrar” action. The whole card remains a button with an accessible name:

```tsx
aria-label={`Entrar na sala ${room.label}, ${occupancyLabel(room.occupantCount)}`}
```

Use solid Deck surfaces and a colored accent block rather than full-card gradients.

- [ ] **Step 5: Improve search and empty state**

Change placeholder to “Buscar uma sala” and empty copy to:

```tsx
<p>Nenhuma sala encontrada.</p>
<button type="button" onClick={() => onQuery("")}>Limpar busca</button>
```

Focus must return to the search input after clearing; implement a `useRef<HTMLInputElement>` and call `searchRef.current?.focus()`.

- [ ] **Step 6: Align `RoomList` with the new semantics**

Use Electric for the active indicator, keep occupancy visible, and add:

```tsx
aria-current={active ? "page" : undefined}
```

- [ ] **Step 7: Verify discovery**

At 1440 px confirm at least the first row of cards appears without scrolling. Search “jog” and confirm only Jogos appears; clear the query and confirm focus returns to search. Enter Jogos from the card and confirm the active room changes.

- [ ] **Step 8: Commit Task 3**

```powershell
git add web/src/components/explore/ExploreView.tsx web/src/components/rooms/RoomList.tsx
git commit -m "feat: redesign Salas discovery experience"
```

---

### Task 4: Entry and active-room surfaces

**Files:**
- Modify: `web/src/pages/NameGate.tsx`
- Modify: `web/src/components/chat/ChatPanel.tsx`
- Modify: `web/src/components/controls/ControlBar.tsx`
- Modify: `web/src/components/controls/DeviceSettings.tsx`
- Modify: `web/src/components/controls/ConnectionBadge.tsx`
- Modify: `web/src/components/participants/MediaTile.tsx`
- Modify: `web/src/components/participants/ParticipantList.tsx`
- Modify: `web/src/components/participants/VideoGrid.tsx`

**Interfaces:**
- Consumes and preserves all existing component props.
- Produces no API or state contract changes.

- [ ] **Step 1: Recompose the NameGate**

Use a split card at desktop and a single-column card at mobile. The content column contains:

```tsx
<p className="text-sm font-semibold text-electric">SALAS</p>
<h1 className="font-display text-4xl text-cloud sm:text-5xl">
  Entre. Fale. Fique à vontade.
</h1>
<p className="text-haze">
  Escolha um nome para entrar nas salas. Sem cadastro.
</p>
```

The visual column contains only the abstract `PulseLine` and three static room-shape tiles; it must be `aria-hidden`. Preserve parsing, error placement, autocomplete, autofocus, and submit behavior.

- [ ] **Step 2: Rebuild chat hierarchy**

Use a solid Deck panel, title “Conversa”, and empty copy “Ninguém escreveu ainda. Comece a conversa.” Render each message as a compact block with author in Electric and body in Cloud. Keep the same `onSend` handling.

- [ ] **Step 3: Update call-control semantics**

Use `glass-bar` only on `ControlBar`. Active microphone/camera/screen controls use `live`; inactive media uses `ghost` or `mute`; leaving uses `danger`. Add a subtle divider before the leave button without changing callback behavior.

- [ ] **Step 4: Restyle participants and media**

Use solid surfaces. A speaking participant gets both a Coral dot and:

```tsx
className={cn(
  "surface flex min-h-11 items-center gap-3 rounded-xl px-3",
  participant.isSpeaking && "ring-1 ring-coral/55",
)}
```

Keep participant mic icons and video attachment behavior unchanged. Media captions use `glass-bar`.

- [ ] **Step 5: Clarify connection states**

Map healthy connection to Electric, reconnecting to amber, unstable to Coral, and disconnected to Coral. Preserve all current labels and RTT display.

- [ ] **Step 6: Make device settings a proper dialog**

Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="device-settings-title"`. Use solid Deck, Electric focus on selects, and a secondary “Fechar” button. Preserve device enumeration and switching.

- [ ] **Step 7: Verify active-room paths**

Enter a room and confirm:

- connection label and participant appear;
- mic, camera, screen share, settings, and leave buttons retain accessible names;
- modal opens and closes;
- a chat message can be submitted;
- leaving returns to Explore;
- no new console errors appear.

- [ ] **Step 8: Run compilation and commit**

Run TypeScript and Vite build commands, then:

```powershell
git add web/src/pages/NameGate.tsx web/src/components/chat web/src/components/controls web/src/components/participants
git commit -m "feat: rebrand entry and active room surfaces"
```

---

### Task 5: Responsive and accessibility finish

**Files:**
- Modify only files from Tasks 1–4 where browser inspection finds a concrete defect.

**Interfaces:**
- No interface changes.

- [ ] **Step 1: Check desktop and tablet in one browser pass**

At 1440×900, 1280×800, and 768×1024 inspect NameGate, Explore, active room, chat, and device dialog. Record defects for clipping, overflow, unreadable contrast, excessive empty space, and controls below the viewport.

- [ ] **Step 2: Check mobile in the same pass**

At 360×800 inspect the same surfaces plus drawer open/close, search clear/focus, and call controls. Confirm no horizontal scrollbar exists:

```js
document.documentElement.scrollWidth === document.documentElement.clientWidth
```

Expected: `true`.

- [ ] **Step 3: Verify reduced motion and keyboard focus**

Emulate `prefers-reduced-motion: reduce`; confirm the pulse line is static. Navigate buttons, search, room cards, rename input, chat input, and modal controls using Tab and Shift+Tab; each focused control must have a visible Electric outline.

- [ ] **Step 4: Fix all observed defects in one batch**

Limit changes to exact issues observed in Steps 1–3. Do not add new decoration, data, interactions, or dependencies. Re-run the same viewport set once after the batch.

- [ ] **Step 5: Run final verification**

```powershell
npx tsc -p web/tsconfig.app.json --noEmit
npm run build -w web
git diff --check
```

Expected: all exit 0. The Vite chunk-size warning is acceptable because LiveKit already produces the large client chunk and code splitting is outside this rebrand.

- [ ] **Step 6: Confirm unrelated files remain untouched**

```powershell
git status --short
```

Expected: the pre-existing modifications to `package.json`, `package-lock.json`, and `web/package.json` remain unstaged and are not included in rebranding commits.

- [ ] **Step 7: Commit finish fixes if any**

```powershell
git add web/src
git commit -m "fix: polish Command Lounge responsive UI"
```

Skip this commit when Step 4 required no source changes.
