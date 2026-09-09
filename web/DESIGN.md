# Gamers de cria — Design System

Visual contract only. Product behavior is unchanged.

## World

Premium dark gaming community: Discord-like density with restrained neon purple/pink accents. Feels native, mature, high-contrast — never toyish or template-loud.

## Palette

| Hex | Role |
|-----|------|
| `#08090F` | Main background (`night`) |
| `#0D0E16` | Secondary surface (`abyss`) |
| `#10111A` | Sidebar (`panel`) |
| `#12131D` | Cards (`deck`) |
| `#151622` | Secondary cards |
| `#0A0B11` | Inputs (`ink`) |
| `#7C3AED` | Primary purple (`electric`) |
| `#9333EA` | Secondary purple (`pulse`) |
| `#EC4899` | Pink accent / danger (`coral`) |
| `#3B82F6` | Blue accent |
| `#22C55E` | Online / speaking (`signal`) |
| `#F8FAFC` | Primary text (`cloud`) |
| `#94A3B8` | Secondary text (`haze`) |
| `#64748B` | Discrete text (`muted`) |

Borders: `rgba(255,255,255,0.07)` · hover purple `rgba(139,92,246,0.35)`.

## Typography

- **Inter** — UI, body, messages
- **Manrope** — titles / display (`font-display`)

## Chrome

- Four columns: server rail · channels · content · members/friends
- Active channel: purple wash + 2px left accent
- Speaking / online: emerald ring, not cyan glow spam
- Modals: `#10111A`, blur backdrop, 18px radius
- Primary CTA: subtle purple → pink gradient

## Motion

150–200ms `ease-out`. Pulse line restrained. Respect `prefers-reduced-motion`. Active press: `scale(0.98)`.

## Controls

One interactive system. Tokens live in `web/src/index.css`. Components: `Button`, `IconButton`, `Icon` (Lucide, stroke 1.9), `Input`, `Select`, `Radio`, `Checkbox`, `Tooltip`, `Loading`.

| Token | Value |
|-------|-------|
| `--radius-control-sm` | 10px (small buttons) |
| `--radius-control` | 12px (buttons, inputs, icon buttons) |
| `--radius-card` | 16px |
| `--radius-modal` | 20px |
| `--button-height-sm/md/lg` | 40 / 44 / 48px |
| `--icon-size-sm/md/lg` | 16 / 20 / 24px |

**Button variants:** `primary` (purple→pink CTA + glow) · `secondary` (dark fill + hover purple) · `ghost` (transparent) · `danger` (dark rose, leave/delete) · `live` / `mute` (voice) · `send` (composer).

**Icons:** Lucide only. Sizes: 16 / 18 / 20 / 22 / 24. Active nav: `#A78BFA` wash + 2px left bar. Glow only on CTA, send, and active rail.

**Modals:** Cancel = ghost · Confirm = primary · Delete = danger.

