# design-sync notes — ruchern.dev

## What this sync is

This repo is a **Next.js application** (apps/web, built on HeroUI), **not** a
component-library design system. There is no buildable package that emits a `dist/`
of UI components, no Storybook, and no stories. So this is a **design-language sync**:
it ships the visual identity (colour tokens, fonts, and the DESIGN.md guidelines) with
an **empty `_ds_bundle.js`** (`window.RuchernDev = {}`). No *real* React components
ship, by design.

To give the claude.ai/design gallery visible, on-brand content (it is card-driven and
shows nothing for a zero-card project), **4 hand-authored static foundation cards** are
included under `components/Foundations/`: `Colours`, `Typography`, `SpacingAndShape`,
`Elevation`. They are plain HTML styled by `styles.css` (no React) that visualise the
tokens. Their **durable source** lives in `.design-sync/cards/Foundations/*.html`
(committed); the build copies them into `ds-bundle/components/Foundations/<Name>/`.

- Claude Design project: `Blog Design System` (`260a2111-3b40-470c-b543-4e26f1135bcb`),
  https://claude.ai/design/p/260a2111-3b40-470c-b543-4e26f1135bcb
  (created as `ruchern.dev`, renamed in the app — the projectId is the durable anchor,
  the display name is not stored in config.json)
- Font delivery: **remote Google Fonts `@import`** (Figtree + Geist Mono, both OFL),
  inside `ds-bundle/fonts/fonts.css`. Validate reports `[FONT_REMOTE]` (expected).

## How it was built (off-script)

The non-storybook converter (`package-build.mjs`) is built around a real package
`dist/` + `.d.ts` tree, which this repo lacks, so the `ds-bundle/` layout was
**hand-authored** (the base skill sanctions this for repos outside the converter
envelope). Sources of truth:

- `apps/web/src/app/globals.css` → `ds-bundle/tokens/tokens.css` (verbatim `:root`
  light + `.dark` custom properties).
- `DESIGN.md` (repo root) → `ds-bundle/guidelines/DESIGN.md` (plain copy).
- `apps/web/src/app/layout.tsx` → font families/weights for `fonts/fonts.css`.
- `.design-sync/conventions.md` → top of `ds-bundle/README.md`.
- `.design-sync/cards/Foundations/*.html` → `ds-bundle/components/Foundations/<Name>/<Name>.html`
  (the 4 static foundation cards; set `.ds-build-meta.json` `componentCount` to the
  number of cards so validate's count check passes — currently 4).

The only gate is `package-validate.mjs`. Run it (no components ⇒ nothing to render,
so skip the render check):

```sh
node .ds-sync/package-validate.mjs ./ds-bundle --no-render-check
```

It must exit 0. Two warnings are EXPECTED and acceptable here:
- `_ds_sync.json absent` — intentionally omitted (off-script tokens-only; the next
  sync re-verifying is trivial).
- `[RENDER_SKIPPED]` — there are zero previews to render.

`--no-render-check` means no playwright install is needed for this sync.

## Conventions header

`.design-sync/conventions.md` is the design-agent-facing header (prepended to the
uploaded README). It names the real token vocabulary so the agent styles via
`var(--token)`. Every name in it was grep-verified against the built
`tokens/tokens.css` / `fonts/fonts.css` before commit — re-run that check if you
edit either the header or the tokens.

## Re-sync risks (what can silently go stale)

- **Tokens are a manual transcription** of `apps/web/src/app/globals.css`. If that
  file's `:root`/`.dark` custom properties change, `ds-bundle/tokens/tokens.css`
  does NOT update automatically — re-transcribe it. Diff the two before re-uploading.
- **DESIGN.md** is copied as-is; re-copy if the repo's DESIGN.md changes.
- **No components by design.** If the repo ever grows a real, buildable component
  library, reconsider a full (non-tokens-only) sync rather than extending this one.
- **No `_ds_sync.json` anchor** is uploaded, so every re-sync re-verifies from
  scratch. That's fine and cheap for a tokens-only bundle.
- Fonts load remotely at runtime; if offline fidelity ever matters, switch
  `fonts/fonts.css` to self-contained woff2 + `@font-face`.
