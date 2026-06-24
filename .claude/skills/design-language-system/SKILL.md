---
name: design-language-system
description: Maintains visual consistency across portfolio UI. Use when creating or modifying components, styling pages, or ensuring design consistency. The system is "Engineering Notebook" — HeroUI default theme tokens (neutral paper/ink + blue signal accent), three type roles, and a monospace annotation signature.
---

# Design Language System — Engineering Notebook

The full source of truth lives in **`DESIGN.md`** at the repo root. Read it before
styling. Summary:

## Colour — HeroUI default theme tokens (no bespoke palette)

`globals.css` defines the standard HeroUI default token set; all UI inherits it.
Neutral paper background, near-black ink foreground, graphite muted, hairline
borders, and a single **blue signal accent** (`--accent`,
`oklch(0.6204 0.195 253.83)`) for links, focus, active nav, CTAs, and chart
traces. `--success`/`--warning`/`--danger` stay semantic. Dark mode is HeroUI's
default `.dark`, toggled via `next-themes`. Do not add a second accent or
hand-rolled palette tokens.

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
- Spacing: `flex gap-*`, even values (`gap-2/4/6/8/12`), prefer `margin-bottom`.
- `motion/react-client` for RSC reveals; respect `prefers-reduced-motion`.
- HeroUI Pro first, then OSS; look components up via the `heroui-pro` MCP.
- No emoji in headings/labels/titles; no decorative borders, gradient orbs, or
  extra drop shadows; left-align long-form and hero content.
