# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev      # Start dev server (port 3010)
bun run build    # Production build to dist/
bun run serve    # Preview production build
```

Use `bun` as the package manager (not pnpm or npm).

## Architecture

Minimal Solid.js SPA using Vite and TypeScript.

- `index.html` → `src/index.tsx` (entry, mounts `<App />` to `#root`)
- `src/App.tsx` — main application component
- CSS Modules (`*.module.css`) for component-scoped styles, `src/index.css` for globals
- `vite.config.ts` — uses `vite-plugin-solid` and `solid-devtools`

TypeScript is configured with `"jsx": "preserve"` — Solid.js handles JSX transformation at build time, not the TS compiler. No test framework or linter is configured.
