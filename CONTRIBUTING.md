# Contributing to GitBoot

Thanks for helping! Bug reports, themes and ideas are all welcome.

## Setup

```bash
npm install
npm run dev     # http://localhost:5173
npm test
```

## Add a theme (easiest first contribution)

1. Add a name to `ThemeName` and `THEME_NAMES` in [`src/config.ts`](src/config.ts).
2. Add a palette in [`src/themes/index.ts`](src/themes/index.ts): `bg`, `chrome`, `border`, the five text colors, `glow` / `scanlines`, `chromeStyle` and `promptStyle`.
3. Run `npm run examples` and add the new demo to the README theme table.
4. Check it in the browser, including with `prefers-reduced-motion` enabled.

## Guidelines

- Keep the exported SVG small (target under 50 kB) and free of external assets: GitHub does not load them.
- The timeline (`src/engine/timeline.ts`) must stay pure and deterministic.
- Add or update tests in `src/gitboot.test.ts` for behavior changes.
- `npm test` and `npm run build` must pass.
- One focused change per pull request, with a short description of what and why.
