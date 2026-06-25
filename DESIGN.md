---
version: alpha
name: ruchern.dev
description: >-
  Design language for ruchern.dev: a minimal, warm, personal site whose
  identity rests on a single coral accent over near-neutral surfaces. Tokens
  are transcribed from the implemented values in apps/web/src/app/globals.css.
colors:
  # Base primitives
  white: "oklch(100% 0 0)"
  black: "oklch(0% 0 0)"
  snow: "oklch(0.9911 0 0)"
  eclipse: "oklch(0.2103 0.0059 285.89)"
  # Surfaces (light theme is canonical; dark is described in prose)
  background: "oklch(0.9702 0 0)"
  foreground: "{colors.eclipse}"
  surface: "{colors.white}"
  surface-foreground: "{colors.foreground}"
  overlay: "{colors.white}"
  muted: "oklch(0.5517 0.0138 285.94)"
  default: "oklch(94% 0.001 286.375)"
  default-foreground: "{colors.eclipse}"
  # Accent (the one identity colour)
  accent: "oklch(0.6 0.18 25)"
  accent-foreground: "{colors.snow}"
  # Status (intent only)
  success: "oklch(0.7329 0.1935 150.81)"
  warning: "oklch(0.7819 0.1585 72.33)"
  danger: "oklch(0.6532 0.2328 25.74)"
  # Structure
  border: "oklch(92% 0.004 286.32)"
  separator: "oklch(92% 0.004 286.32)"
  focus: "{colors.accent}"
  link: "{colors.foreground}"
typography:
  h1:
    fontFamily: Figtree
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.03em
  h2:
    fontFamily: Figtree
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.03em
  h3:
    fontFamily: Figtree
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
  body-lg:
    fontFamily: Figtree
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.7
  body:
    fontFamily: Figtree
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Figtree
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: Figtree
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Figtree
    fontSize: 12px
    fontWeight: 500
    letterSpacing: 0.05em
  code:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  button-secondary:
    backgroundColor: "{colors.default}"
    textColor: "{colors.default-foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.sm}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.surface-foreground}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
---

# ruchern.dev Design Language

This file is the normative reference for the visual identity of ruchern.dev. The
front-matter tokens are the source of truth, transcribed from the implemented
values in `apps/web/src/app/globals.css`. The prose explains why those values
exist and how to apply them.

It complements `.claude/skills/design-language-system/SKILL.md`, the agent-facing
"how to apply" skill, and `.claude/skills/blog-voice/SKILL.md` for written voice.

## Overview

The site is minimal, warm, and personal. Surfaces stay near-neutral so a single
coral accent carries the whole identity. Everything is built on HeroUI v3, whose
tokens we override in `globals.css`; the values here mirror those overrides.

Restraint is the rule. Colour signals identity or intent, never decoration.
Layout leans on a steady 4px rhythm and generous white space rather than borders
or boxes.

## Colors

The neutral spine runs from `eclipse` (deep charcoal) to `snow` and `white`. The
light background is a cool, near-white `oklch(0.9702 0 0)`, and `foreground`
aliases `eclipse`. `muted` carries secondary text, `default` carries quiet fills.

Coral `accent` `oklch(0.6 0.18 25)` is the only identity colour. It also drives
`focus`, so keyboard focus always reads as the brand. `link` deliberately aliases
`foreground` rather than the accent; links earn emphasis through an underline, not
colour.

Status colours are reserved for intent: `success` green, `warning` amber, `danger`
red. They never stand in for the accent.

The five chart colours `--chart-1` through `--chart-5` are derived from `accent`
by stepping lightness in relative `oklch()` (`calc(l - 0.24)` through
`calc(l + 0.24)`), so data visualisations stay on-brand. They live in `globals.css`
rather than the token map above, because relative-colour expressions are not static
primitives.

**Dark theme.** The same accent rides over inverted surfaces: `background`
`oklch(12% 0.005 285.823)`, `foreground` aliases `snow`, `surface`
`oklch(0.2103 0.0059 285.89)`, `overlay` `oklch(0.22 0.0059 285.89)` (lifted
slightly for contrast), and `border` `oklch(22% 0.006 286.033)`. `warning` and
`danger` shift brighter for legibility on dark fills.

## Typography

Figtree sets all UI and prose; Geist Mono sets code and tabular figures. Headings
carry tight `-0.03em` tracking and drop in weight down the scale: `h1` at 700,
`h2` and `h3` at 600. Body copy runs at 16px with relaxed 1.6 line height, easing
to 1.7 for long-form `body-lg`. The `label` style is the small, slightly-tracked
form used for eyebrows and metadata.

## Layout

Spacing follows a 4px baseline (`--spacing: 0.25rem`) and an even-only gap scale:

- `gap-2` (8px): icon-and-text, chips, tight pairs
- `gap-4` (16px): card content, grids, forms (the default when unsure)
- `gap-6` (24px): between related components
- `gap-8` (32px): page divisions
- `gap-12` (48px): hero-to-content transitions

Prefer `gap-*` over `space-x`/`space-y`. Prefer `margin-bottom` over `margin-top`
so spacing accumulates downward predictably.

## Elevation & Depth

Depth is quiet. `--surface-shadow` and `--field-shadow` stack three soft, low-alpha
layers for cards and inputs; `--overlay-shadow` is deeper for floating surfaces
(tooltips, popovers, modals). In dark mode every shadow is removed; depth there
comes from the lighter `surface` and `overlay` fills instead.

## Shapes

Corners are gently rounded: `8px` is the default radius (`rounded.md`), `12px` for
form fields (`rounded.lg`), and `9999px` for pills. Inputs are borderless by
default (`--field-border-width: 0`); they read as filled fields, not outlined
boxes.

## Components

Built on HeroUI v3 conventions: `onPress` (not `onClick`), `isDisabled` (not
`disabled`), and compound components (`Card.Header`, `Select.Trigger`).

- **button-primary**: coral fill with `accent-foreground` text, `rounded.md`. The
  single high-emphasis action per view.
- **button-secondary**: quiet `default` fill for supporting actions.
- **input**: borderless filled field, `rounded.lg`, focus ring in `accent`.
- **card**: `surface` fill, `rounded.md`, lifted by `--surface-shadow`.

Style link-buttons with `buttonVariants()` from `@heroui/styles` applied to a Next
`Link`, never a HeroUI render prop. Icons come from `@hugeicons/*`.

## Do's and Don'ts

- **Do** treat coral as the only identity colour. **Don't** introduce a second
  brand hue.
- **Do** reserve status colours for intent (success, warning, danger). **Don't**
  use them as decoration or as a stand-in for the accent.
- **Do** lean on spacing and white space for structure. **Don't** reach for borders
  or boxes where a gap will do.
- **Do** let links earn emphasis through their underline. **Don't** colour body
  links with the accent.
- **Do** drop shadows entirely in dark mode. **Don't** port light-mode elevation
  across themes.
- **Do** write content in Singapore English with the voice in
  `.claude/skills/blog-voice/SKILL.md`. **Don't** add hype words or marketing
  preambles.
