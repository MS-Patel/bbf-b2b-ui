
The user wants a fresh, unique theme that's lighter and better matches the BuyBestFin brand (blue→green gradient logo). Current dark sidebar (`oklch(0.22 0.08 245)` — deep navy) feels heavy. Let me design something distinctive.

## Design direction

**Concept: "Coastal Wealth"** — a light, airy fintech palette inspired by sea-glass and emerald, with the logo's blue→green gradient as the signature accent. Moves away from the standard navy-sidebar fintech look.

### Key shifts from current theme

| Token | Current | New |
|---|---|---|
| Background | Cool off-white `0.985 0.006 230` | Warm pearl `0.99 0.008 180` (subtle mint tint) |
| Primary | Deep blue `0.5 0.17 245` | Teal-emerald `0.55 0.13 185` (sits between brand blue & green) |
| Accent | Green `0.68 0.17 145` | Vibrant emerald `0.72 0.18 155` |
| Sidebar | Dark navy `0.22 0.08 245` | **Light pearl** `0.97 0.012 190` with subtle teal border — no more dark sidebar |
| Sidebar text | Light gray | Deep teal `0.25 0.07 200` |
| Cards | Pure white | Pure white with warm border `0.93 0.015 180` |
| Foreground | Cool dark `0.2 0.05 240` | Deep ocean `0.22 0.06 220` |

### Signature touches
- **Light sidebar** with active item using brand gradient (blue→emerald) — the unique differentiator
- Hero gradient: `oklch(0.55 0.15 220) → oklch(0.7 0.17 160)` (ocean blue → mint emerald)
- Subtle mint-tinted muted surfaces instead of cool gray
- Soft teal-shadowed cards (`shadow-elegant` uses teal mix)
- Dark mode: rich midnight-teal `0.18 0.04 210` (not pure navy) — warmer feel

### Charts
Re-tune to harmonize: teal, emerald, soft amber, sky, coral — all jewel-toned, no flat blues.

## Files to edit

1. **`src/styles.css`** — rewrite `:root` and `.dark` token blocks + gradients/shadows. No structural changes.

That's it. Single-file change. All components consume tokens, so the rebrand cascades automatically.

## Verification
- Visually check sidebar (now light), investor dashboard cards, gradient hero strips on portfolio summary, and dark mode toggle.
- Confirm contrast on sidebar active state and hero text remains AA.
