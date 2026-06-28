---
name: Boma Editorial
source: Boma Web App — student-first rental platform (Kenya)
extracted: 2026-06-28
note: Hybrid system — Axene's editorial structure fused with Boma's warm "Modern Homestead" palette.
colors:
  # — Foundation (warm) —
  bg: '#faf6f0'
  surface: '#ffffff'
  surface-2: '#f3efe7'
  text: '#0c110f'
  muted: '#56635e'
  muted-soft: '#8a938e'
  border-1: '#eaefed'
  border-soft: '#f0eee6'
  # — Brand constants —
  forest: '#133127'
  honey: '#f59e0b'
  honey-ink: '#3a2600'
  honey-soft: '#fdecc8'
  cream: '#faf6f0'
  # — Functional states —
  emerald: '#10b981'
  emerald-soft: '#e3f5ee'
  rose: '#f43f5e'
  amber: '#d97706'
  info: '#3d6ee0'
  # — Dark theme (carbon-forest) —
  dark-bg: '#0f1f18'
  dark-surface: '#13271f'
  dark-surface-2: '#0a1611'
  dark-text: '#f4f0e8'
  dark-muted: '#9aa39e'
  dark-border-1: '#244438'
  dark-honey-ink: '#ffd98a'
fonts:
  display: 'Outfit'
  body: 'Inter'
  mono: 'JetBrains Mono'
radii:
  sm: '8px'
  md: '12px'
  lg: '16px'
---

# Design System: Boma Editorial

**Source:** Boma Web App — "find your people, then your place" (student-first rentals, Kenya).
**Brand mantra:** *"Warm homestead, editorial discipline — calm cream, deep forest, honey when it matters."*
**Lineage:** Boma's warm "Modern Homestead" palette (forest / honey / cream) rendered through Axene's
editorial structure (lowercase display, ruled grids, hairline dividers, no shadows).

## 1. Visual Theme & Atmosphere

Boma presents as a warm, trustworthy housing-community brand carried with the restraint and
editorial confidence of a print magazine. The aesthetic rests on a disciplined three-color
foundation — a deep, grounded near-black green ("Forest"), a single saturated hospitality
accent ("Honey"), and warm cream backgrounds. The result feels welcoming **and** premium: large
amounts of breathing room, hairline 1px dividers (rendered via `color-mix` at ~10% opacity), and a
grid-driven layout where cells are separated by thin rules rather than cards-with-shadows. The
stated ratio is roughly **80% neutral, 20% honey** — honey is a punctuation mark, never a wash.

Typography does the heavy lifting for personality: oversized **lowercase** display headlines in
Outfit (Bold/Black, 800–900) with tight tracking (−2 to −3px), softened against humanist Inter body
copy. Monospace eyebrows/kickers (JetBrains Mono, uppercase, wide-tracked, 11px) add a technical,
engineered texture that keeps the warmth from tipping into sentimental. Everything is "softened
square": gentle radii (8–16px), no playful over-rounding, no gradients on brand elements, no
drop-shadow cards. The mood: homely, editorial, quietly self-assured.

## 2. Color Palette & Roles

### Primary Foundation
| Name | Hex | Role |
|:--|:--|:--|
| **Cream Sand** | `#faf6f0` | Page background (`--color-bg`) — the calm warm base |
| **Pure White** | `#ffffff` | Surface / panels (`--color-surface`) |
| **Bone** | `#f3efe7` | Secondary surface / tonal content zones (`--color-surface-2`) |
| **Forest** | `#133127` | Brand near-black — headlines, dark hero blocks, primary ink-on-light |
| **Ink** | `#0c110f` | Primary body text |

### Accent & Interactive
| Name | Hex | Role |
|:--|:--|:--|
| **Honey** | `#f59e0b` | THE brand accent — CTAs, highlights, active indicators, star ratings (~20% of UI) |
| **Honey Ink** | `#3a2600` | Text/icon color when placed *on* honey — never white on honey |
| **Soft Honey** | `#fdecc8` | Tinted accent backgrounds, hovers |
| **Gold tints** | `#f59e0b0a → #f59e0b4d` | Layered honey glazes (1–30% alpha) for subtle fills/borders |

### Typography & Text Hierarchy
| Name | Hex | Role |
|:--|:--|:--|
| **Ink** | `#0c110f` | Primary text (light) |
| **Paper** | `#f4f0e8` | Primary text (dark) |
| **Slate** | `#56635e` | Muted/secondary text (`--color-muted`) |
| **Slate Soft** | `#8a938e` | Tertiary / muted-soft |
| **Mist** | `#eaefed` | Borders (light, `--color-border-1`) — used at ~10% opacity |
| **Soft line** | `#f0eee6` | Faint dividers |

### Functional States
| Name | Hex | Role |
|:--|:--|:--|
| **Emerald** | `#10b981` | "Verified resident", available listings, positive states; soft `#e3f5ee` |
| **Rose** | `#f43f5e` | Favorites (heart), delete, danger |
| **Amber** | `#d97706` | Pending review / verification processing / occupied |
| **Info** | `#3d6ee0` | Informational / links |

> **Brand color rules (enforce these):**
> 1. Two colors carry the brand: **Honey + Forest**. Cream is the rest.
> 2. Aim for **~80% neutral / ~20% honey**.
> 3. **Never** put honey behind white text — use Honey Ink (`#3a2600`) or Forest.
> 4. **Honey always needs Forest or cream.** Never pair honey with another saturated color.
> 5. Use full Honey (`#f59e0b`) for pure brand moments; the soft tints are for backgrounds, hovers, subtle accents.

## 3. Typography Rules

**Three roles, strict discipline.** Display carries personality; body carries legibility; mono carries the engineered texture.

| Family | Role | Character |
|:--|:--|:--|
| **Outfit** (`--font-display`, 700–900) | Headlines, wordmark, numerics | The brand voice — confident, **lowercase**, tightly tracked |
| **Inter** (`--font-body`, 400–600; body 400–500) | All body & UI copy | Humanist, neutral, highly legible in dense listings |
| **JetBrains Mono** (`--font-mono`, 500–700) | Eyebrows, kickers, labels, prices, codes | Technical, engineered texture |

### Hierarchy & Weights
- **Hero display:** Outfit **900**, clamp(40px → 88px), `line-height: 0.95`, `letter-spacing: −3px`, **lowercase**.
- **Section headlines:** lowercase, Outfit 800, `letter-spacing: −2px`.
- **Card / listing title:** Outfit 700, 18–20px, lowercase or sentence case.
- **Body:** Inter **400–500**, 15–18px, `letter-spacing: 0`, `line-height: 1.6`.
- **Eyebrow / kicker / label:** JetBrains Mono **500**, **11px**, UPPERCASE, `letter-spacing: 2px`, colored Slate.
- **Price / numeric:** JetBrains Mono 600 for that engineered, tabular feel.

### Spacing Principles
Tight negative tracking on display type; generous line-height (1.6) on body for an editorial, readable
rhythm. Headlines collapse line-height below 1.0.

## 4. Component Stylings

### Buttons
- **Radius:** softened — `--r-sm: 8px` to `--r-md: 12px`. Never fully-rounded pills for primary brand surfaces.
- **Primary:** Honey `#f59e0b` fill with **Honey-Ink / Forest** text (`#3a2600`) — never white text on honey.
- **Secondary/ghost:** transparent with hairline border (`color-mix(forest, 12%)`), text in Forest.
- **Transitions:** `0.15s cubic-bezier(.4,0,.2,1)`.

### Ruled Grid Cells & Containers (the signature pattern)
Content is laid into a **bordered grid** (2 / 3 / 4 cols) where cells are divided by **1px rules at ~10%
forest opacity** via `color-mix(in srgb, var(--color-forest) 10%, transparent)` — **not** drop-shadow cards.
Outer-edge borders are removed so the grid reads as one ruled block. Collapses to 2 cols at ≤1024px and
1 col at ≤768px.

### Listing Cards
- **Construction:** no shadows. A listing is an image + content area bounded by hairline rules or a subtle
  `surface-2` fill. Image radius 12px.
- Inside: a small mono eyebrow (campus / area), a lowercase Outfit title, a JetBrains Mono price, and an
  Emerald "verified" or Amber "pending" badge.

### Navigation
- Slim top bar; lowercase wordmark lockup ("boma" with a single **honey period**) on the left.
- Line icons (Lucide style, stroke 1.6). Includes search + auth/profile affordances.

### Inputs & Forms
- Hairline borders consistent with grid rules; small radii (8–12px) matching buttons.
- Labels in JetBrains Mono uppercase 11px; input text in Inter. Focus states use Honey sparingly.

### Badges & Pills
- **Verified resident:** Emerald text on `emerald-soft`, mono label.
- **Pending / occupied:** Amber on soft amber.
- Small radius (8px), never fully round.

### Logo & Mark
- **Wordmark:** the word "boma" in **Outfit Black, lowercase**, with a **single honey period** (`.`). Tightly tracked.
- **Don'ts:** no gradients, no recoloring the dot, no rotate/skew/italic, no shadows.

## 5. Layout Principles

### Grid & Structure
- Ruled grid system (2/3/4 columns) with hairline internal dividers; no card shadows.
- Generous section spacing on a 4px base scale; the design "breathes," with honey used as rare punctuation.

### Alignment & Visual Balance
- Left-aligned editorial body; oversized lowercase display headlines.
- ~80/20 neutral-to-honey visual weight enforced by brand rules.

### Responsive Behavior
- Breakpoints: **≤480px** (mobile), **≤768px** (1-col grid), **769–1024px** (2-col grid), desktop above.
- Mobile-first collapse of multi-column ruled grids to a single column.

### Radii
`--r-sm: 8px` · `--r-md: 12px` · `--r-lg: 16px` — consistently "softened square," never pill/fully-rounded
for brand surfaces.

## 6. Iconography & Imagery

- **UI icons:** Lucide line-icon set — `viewBox 0 0 24 24`, `fill: none`, `stroke: currentColor`,
  `stroke-width: 1.6`, round caps/joins. Icons in Forest or Slate, never honey unless interactive.
- **Imagery:** warm, real photography of homes, rooms, and student life — never sterile stock. Image
  masks use 12–16px radii. Forest hero blocks may carry a subtle dark textured backdrop.

## 7. Design System Notes for Stitch Generation

### Language to Use
> "Warm editorial housing-community brand. Cream background (#faf6f0), deep Forest near-black text
> (#133127 / #0c110f). Single saturated **Honey #f59e0b** accent used sparingly (~20%). Oversized
> **lowercase** display headlines in Outfit, weight 900, letter-spacing −3px, line-height 0.95.
> Humanist body sans (Inter). Monospace uppercase eyebrows (JetBrains Mono), 11px, letter-spacing 2px.
> Content in a **ruled grid** with 1px hairline dividers at 10% opacity — no drop-shadow cards.
> Softened-square radii 8–16px. Calm, welcoming, premium, lots of whitespace."

### Color References (paste into Stitch)
- Background: Cream Sand `#faf6f0` (or Forest `#133127` for dark hero blocks)
- Primary text: Ink `#0c110f` / Paper `#f4f0e8`
- Accent: **Honey `#f59e0b`** (text on it = `#3a2600`, never white)
- Muted text: Slate `#56635e`
- Borders: Mist `#eaefed` at ~10% opacity
- Verified: Emerald `#10b981`

### Incremental Iteration
- Keep honey rare: if a screen feels too yellow, you've broken the 80/20 rule — pull it back to one CTA + a few tints.
- Never let headlines go title-case or loosen their tracking; lowercase + tight is the signature.
- Prefer ruled grids over card shadows to stay on-brand.
- Pair honey only with Forest/cream — a second saturated color reads off-brand.
