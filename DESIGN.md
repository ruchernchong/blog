---
name: Blog
target: HeroUI v3 default theme (Pro + OSS)
---

# Engineering Notebook — Design Language

The public design direction for **ruchern.dev**. The site should read like a
meticulous engineer's lab log: text-first, precise, and instrumented. Colour is
quiet; **typography, a monospace annotation system, and layout carry the
identity**.

## Foundations

### Colour — monochrome base, one coral accent

Do **not** hand-roll a bespoke palette beyond the accent. `globals.css` uses
HeroUI's neutral default tokens for the base; the rest of the UI (including HeroUI
Pro components) inherits it. Secondary/hover/soft tokens derive automatically via
`color-mix`.

- `--background` neutral paper · `--foreground`/`--eclipse` near-black ink
- `--muted` graphite · `--border`/`--separator` hairline rule
- `--accent` the single **coral signal** (`oklch(0.6 0.18 25)`) — links, focus,
  active nav, chart traces, CTAs
- `--success`/`--warning`/`--danger` stay semantic
- The same coral accent is shared across light and dark. Dark mode is HeroUI's
  default `.dark`; the site defaults to **light** and is toggled via a Light/Dark
  segmented control (`next-themes`, `attribute="class"`, no system option).

The accent is the only colour. Everything else is paper/ink/graphite.

### Typography — three intentional roles (all self-hosted via `next/font`)

- **Display** — `Space Grotesk` (`font-display`): headings and hero, set tight.
- **Body** — `Hanken Grotesk` (`font-sans`): prose and UI reading text.
- **Mono** — `Geist Mono` (`font-mono`): the chrome + data voice — nav, eyebrows,
  metadata, stats, tags, code. Always pair numeric values with `tabular-nums`.

### Layout

- One shared frame holds the whole site: the header, footer, `(main)` content
  area, and the wide data surfaces (dashboard, usage) all cap at `max-w-7xl` and
  centre, so their left/right edges always line up.
- Reading surfaces (home, about, projects, blog index + article) centre a single
  `max-w-3xl` reading column inside that frame — one width for every text page.
  Data surfaces fill the full frame. Generous whitespace (`gap-6/8/12/16`).
- Hairline rules only where they carry structural meaning (header divider, list
  separators) — never as decorative newspaper columns.

## The signature

A **monospace annotation rail** tags content like notebook margin notes, and all
numeric values render as **tabular-mono readouts**. Reusable primitives:

- `AnnotationRail` (`components/annotation-rail.tsx`) — middot-separated mono
  metadata strip (`2026-06-24 · 4 min · #nextjs`).
- `StatReadout` (`components/stat-readout.tsx`) — large tabular-mono value over a
  mono label. The "instrument" readout.
- `Eyebrow` (`components/eyebrow.tsx`) — mono section label with a `::` signal
  tick.
- `PageHeader` (`components/page-header.tsx`) — eyebrow + display title +
  description, used by every page.

## Components

Use **HeroUI Pro first, then HeroUI OSS** — look every component up via the
`heroui-pro` MCP before use. Prefer semantic props (`variant`, `color`) over
`className`; `onPress` not `onClick`; `isDisabled` not `disabled`. Icon-only
buttons get a `Tooltip`. Link-buttons use `buttonVariants()` from `@heroui/styles`
on a Next `Link`. Icons from `@hugeicons/*`.

## Do / Don't

- **Do** lead pages with `PageHeader`; tag content with `AnnotationRail`; set all
  numbers in `tabular-nums`; keep the accent to links/focus/CTAs/active states.
- **Do** use `motion/react-client` for reveals in RSC pages; respect
  `prefers-reduced-motion`.
- **Don't** introduce a second accent colour or hand-rolled palette tokens.
- **Don't** use emoji in headings, labels, or titles.
- **Don't** add decorative borders/dividers, gradient orbs, or drop shadows the
  HeroUI tokens don't already provide.
- **Do** centre the `max-w-3xl` reading column within the shared `max-w-7xl`
  frame; keep one reading width across every text page.
