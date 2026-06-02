# ruchern.dev Docs

Standalone Fumadocs app for technical documentation and runbooks for the ruchern.dev workspace.

## Development

```bash
pnpm docs:dev
```

The docs app runs on port `3001` by default.

## Commands

- `pnpm docs:dev` - Start the docs development server
- `pnpm docs:build` - Build the docs app
- `pnpm docs:typecheck` - Generate Fumadocs types and run TypeScript checks

## Structure

| Path | Description |
| --- | --- |
| `content/docs` | MDX documentation source files |
| `src/lib/source.ts` | Fumadocs source loader |
| `src/lib/layout.shared.tsx` | Shared Fumadocs layout options |
| `src/app/docs` | Fumadocs default `/docs` route |
| `src/app/api/search/route.ts` | Fumadocs search route |

## Deployment

The intended deployment target is a separate Vercel project for `docs.ruchern.dev`.

Keep the Fumadocs default `/docs` route first, so the initial deployed docs URL is expected to be:

```txt
https://docs.ruchern.dev/docs
```
