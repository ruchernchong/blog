---
name: design-language-system
description: Maintains visual consistency across portfolio UI. Use when creating or modifying components, styling pages, or ensuring design consistency. The system is "Engineering Notebook" — a monochrome paper/ink base with a single coral accent, three type roles, and a monospace annotation signature.
---

# Design Language System — Engineering Notebook

The full source of truth lives in **`DESIGN.md`** at the repo root. Read it before
styling. Summary:

## Colour — monochrome base + a single coral accent

`globals.css` uses HeroUI's neutral default tokens for the base (paper background,
near-black ink foreground, graphite muted, hairline borders) and overrides
`--accent` to a single **coral signal** (`oklch(0.6 0.18 25)`) for links, focus,
active nav, CTAs, and chart traces. `--success`/`--warning`/`--danger` stay
semantic. The same coral accent is shared across light and dark. Dark mode is
HeroUI's default `.dark`; the site defaults to **light** and is toggled via a
Light/Dark segmented control (`next-themes`, no system option). Do not add a
second accent or hand-rolled palette tokens.

## Typography — three roles (self-hosted via `next/font`)

- `font-display` — Space Grotesk (headings, hero)
- `font-sans` — Hanken Grotesk (prose, UI text)
- `font-mono` — Geist Mono (nav, eyebrows, metadata, stats, tags, code). Numbers
  get `tabular-nums`.

## Signature primitives (`apps/web/src/components/`)

- `AnnotationRail` — middot-separated mono metadata strip (`date · 4 min · #tag`)
- `StatReadout` — large tabular-mono value + mono label
- `Eyebrow` — mono section label with a `::` signal tick
- `PageHeader` — eyebrow + display title + description (used by every page)

## Rules

- Lead pages with `PageHeader`; tag content with `AnnotationRail`; keep the accent
  to links/focus/CTAs/active states.
- Layout: header, footer, `(main)`, and data surfaces share one centred
  `max-w-7xl` frame; text pages centre a single `max-w-3xl` reading column inside
  it; data surfaces (dashboard/usage) fill the frame.
- Spacing: `flex gap-*`, even values (`gap-2/4/6/8/12`), prefer `margin-bottom`.
- `motion/react-client` for RSC reveals; respect `prefers-reduced-motion`.
- HeroUI Pro first, then OSS; look components up via the `heroui-pro` MCP.
- No emoji in headings/labels/titles; no decorative borders, gradient orbs, or
  extra drop shadows.
