# ruchern.dev design language

This is a **tokens-only** design system: it ships the visual identity (colour
tokens, fonts, spacing, radius, shadows) but **no components**. Build UI with
plain elements and your own layout, styled entirely through the CSS custom
properties below. Read `tokens/tokens.css` and `guidelines/DESIGN.md` before
styling — they are the source of truth.

## The idiom: style via `var(--token)`

There are no utility classes and no component library. Apply the design language
by reading the CSS custom properties, e.g.:

```css
background: var(--surface);
color: var(--foreground);
border-radius: var(--radius);
box-shadow: var(--surface-shadow);
```

Both light and dark themes are defined. Light is the default (`:root`); dark
activates under `[data-theme="dark"]` or `.dark` on an ancestor.

## Colour tokens

Identity / surfaces:
- `--accent` — coral `oklch(0.6 0.18 25)`, the **only** identity colour; also
  drives `--focus`. Use `--accent-foreground` for text on it.
- `--background`, `--foreground` — page base and primary text.
- `--surface` / `--surface-foreground` — cards, panels (lifted by `--surface-shadow`).
- `--overlay` / `--overlay-foreground` — floating surfaces (modals, popovers, tooltips).
- `--muted` — secondary text. `--default` / `--default-foreground` — quiet fills.
- `--border`, `--separator` — hairlines. `--link` — link text (aliases `--foreground`).

Status (intent only, never decoration, never a stand-in for the accent):
- `--success`, `--warning`, `--danger` (+ matching `*-foreground`).

Data viz: `--chart-1` … `--chart-5`, derived from `--accent` by relative lightness.

## Typography

Two families, exposed as `--font-sans` (**Figtree**, UI + prose) and
`--font-geist-mono` (**Geist Mono**, code). Headings use tight `-0.03em` tracking
and step down in weight: h1 700, h2/h3 600. Body is 16px / 1.6 line-height.

## Spacing, radius, shape

- 4px baseline (`--spacing: 0.25rem`). Use an **even** gap scale: 8 / 16 / 24 / 32 / 48px
  (16px is the default when unsure). Prefer gaps over `space-x`/`space-y`, and
  `margin-bottom` over `margin-top`.
- Radius: `--radius` 8px (default), `--field-radius` 12px (inputs), 9999px for pills.
- Inputs are borderless filled fields (`--field-border-width: 0`), not outlined boxes.

## Brand rules

- Coral is the only identity colour — never introduce a second brand hue.
- Links earn emphasis through an underline, not colour (`--link` = `--foreground`).
- Drop shadows entirely in dark mode; depth there comes from lighter surface fills.
- Restraint: colour signals identity or intent, lean on spacing and white space
  for structure rather than borders or boxes.

## Example

```html
<article style="background: var(--surface); color: var(--surface-foreground);
                border-radius: var(--radius); box-shadow: var(--surface-shadow);
                padding: 16px; font-family: var(--font-sans);">
  <h2 style="font-weight: 600; letter-spacing: -0.03em; margin-bottom: 8px;">Title</h2>
  <p style="color: var(--muted); line-height: 1.6;">Supporting copy.</p>
  <button style="background: var(--accent); color: var(--accent-foreground);
                 border-radius: var(--radius); padding: 8px 16px; border: 0;">
    Primary action
  </button>
</article>
```
