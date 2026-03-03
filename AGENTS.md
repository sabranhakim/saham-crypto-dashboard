# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js App Router project.
- `src/app/`: app routes, layouts, global styles, and API routes (`src/app/api/tradingview/route.ts`).
- `src/components/ui/`: reusable UI primitives (shadcn-style components).
- `src/lib/`: shared utility helpers.
- `public/`: static assets.
- Root config: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`.

Keep feature logic close to the route that uses it. Prefer small, composable components over large files.

## Build, Test, and Development Commands
Use npm scripts from `package.json`:
- `npm run dev`: start local development server.
- `npm run build`: create production build.
- `npm run start`: serve the production build.
- `npm run lint`: run ESLint checks.

Typical local flow:
```bash
npm run lint
npm run build
npm run dev
```

## Coding Style & Naming Conventions
- Language: TypeScript (`.ts`/`.tsx`).
- Indentation: 2 spaces; follow existing formatting in touched files.
- Components: `PascalCase` (e.g., `TradingViewChart`).
- Variables/functions: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` for true constants, otherwise descriptive `camelCase`.
- Use Tailwind utility classes for styling; keep class strings readable and grouped by purpose.
- Run `npm run lint` before opening a PR.

## Testing Guidelines
There is currently no dedicated test framework configured. For now:
- Treat `npm run lint` and `npm run build` as required quality gates.
- Manually verify key flows (tab switch, search, watchlist, API data load, chart rendering).

When adding tests, place them near features (for example `src/app/<route>/__tests__/`) and name files `*.test.ts(x)`.

## Commit & Pull Request Guidelines
Git history currently shows a single seed commit (`Initial commit from Create Next App`), so no strict convention is established yet.

Recommended going forward:
- Commit messages: short, imperative, and scoped (example: `feat(dashboard): add tradingview scanner route`).
- PRs should include:
  - change summary,
  - why the change was made,
  - validation steps/commands run,
  - screenshots or short recordings for UI updates.

## Security & Configuration Tips
- Never commit secrets. `.env*` is already ignored.
- Keep API calls that may expose internals on server routes (`src/app/api/*`).
- For third-party data sources, handle errors and fallback states in UI.
