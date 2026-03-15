# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Octagon** is a UFC betting app for friend groups. Users create/join **leagues** (private groups with invite codes) and bet on UFC fight cards within each league. Features include a league leaderboard, and an optional Survivor mode (streak-based, per league). There are no global leaderboards — all scoring is league-scoped.

## Monorepo Structure

```
/backend    NestJS API (Node.js, Prisma, PostgreSQL)
/frontend   React SPA (Vite, TypeScript, Tailwind, Shadcn)
/docs       SPECIFICATION.md (source of truth), BACKEND_IMPLEMENTATION.md
/.specify   Project constitution and spec templates
```

## Commands

### Backend (`/backend`)
```bash
npm run start:dev    # Dev server with HMR (webpack watch)
npm run build        # Production build
npm run lint         # ESLint with auto-fix
npm run types        # TypeScript type check (noEmit)
npm test             # Run all Jest unit tests
npm run test:watch   # Jest in watch mode
npm run test:cov     # Jest with coverage report
# Run a single test file:
npm test -- --testPathPattern=events.service
```

### Frontend (`/frontend`)
```bash
npm run dev          # Vite dev server
npm run build        # tsc + vite production build
npm run lint         # ESLint
npm run types        # TypeScript type check (noEmit)
```

### Database (from `/backend`)
```bash
npx prisma migrate dev   # Apply migrations in development
npx prisma generate      # Regenerate Prisma client after schema changes
npx prisma db seed       # Run seed (ts-node prisma/seed.ts)
npx prisma studio        # Open Prisma Studio GUI
```

## Architecture

### Backend (NestJS)

Feature modules in `backend/src/`:
- **auth** — Supabase JWT validation via `passport-jwt` + JWKS. `SupabaseGuard` protects routes.
- **events** — UFC event management. `ScraperService` scrapes `ufc.com`, `UfcstatsEnrichmentService` cross-references `ufcstats.com` for hex IDs. A `@Cron('0 4 * * *')` job auto-fetches the top 3 upcoming events daily.
- **fighters** — Fighter CRUD, populated by the scraper.
- **fights** — Fight CRUD and result management.
- **bets** — Bet placement and scoring per league.
- **leagues** — League creation (6-char invite code), joining, membership.
- **admin** — Admin-only endpoints for triggering scrapes and entering results.
- **jobs** — Scheduled tasks (NestJS Schedule module).
- **prisma** — Shared `PrismaService` and `PrismaModule` used across all feature modules.

### Data / IDs

- **Event IDs**: UFC.com event slug (e.g., `ufc-309-jones-vs-miocic`)
- **Fighter IDs**: UFC.com athlete slug (e.g., `jon-jones`)
- **Fight IDs**: `{fighterA-slug}-vs-{fighterB-slug}`
- `ufcstatsId` fields store hex IDs from ufcstats.com used to match fight results.
- Bets have a unique constraint on `(leagueId, userId, fightId)` — one bet per fight per user per league.

### Frontend (React + Vite)

- **`src/lib/api.ts`** — Axios instance with base URL `VITE_API_URL`. Interceptor injects the Supabase JWT from the active session. Handles 401 by auto-refreshing the token.
- **`src/context/AuthContext.tsx`** — Supabase auth state (`user`, `session`, `loading`). Wraps the app; use `useAuth()` to access.
- **`src/hooks/`** — React Query hooks (`useEvents`, `useFighters`, `useBets`, `useLeagues`, `useAdminFights`, `useRealtime`, `useGameRealtime`).
- **`src/pages/`** — Route-level pages: `leagues/`, `survivor/`, `admin/`, `auth/`.
- **`src/components/ui/`** — Shadcn/Radix primitive components (button, card, form, select, etc.).
- **Routing**: React Router DOM. Entry point `/` redirects to `/leagues`. Admin at `/admin/*`. All user routes are protected via `ProtectedRoute`.
- **State**: Zustand for bet state (`src/store/useBets.ts`, `src/stores/realtimeStore.ts`).
- **UI**: Dark mode by default, Tailwind CSS, Lucide icons.

### Authentication Flow

1. Frontend authenticates with Supabase (email/password or Google OAuth).
2. Supabase JWT is injected into every API request via the axios interceptor.
3. Backend validates the JWT using Supabase's JWKS endpoint (`SUPABASE_URL/auth/v1/.well-known/jwks.json`).
4. `req.user.sub` contains the Supabase UUID used as the user ID throughout the app.

### Required Environment Variables

**Backend** (`.env`):
- `DATABASE_URL` — PostgreSQL connection string
- `SUPABASE_URL` — Supabase project URL

**Frontend** (`.env`):
- `VITE_API_URL` — Backend API base URL (defaults to `http://localhost:3000/api/v1`)
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — Supabase project credentials

## Spec-Kit Workflow

This project uses **Spec-Kit**, a spec-driven feature development workflow. All workflow commands are defined in `.agent/workflows/` and are invoked as slash commands. Feature specs are stored in `specs/{###-feature-name}/`.

### Command sequence (in order)

| Command | Description |
|---|---|
| `/speckit.specify <description>` | Creates a feature branch (`001-feature-name`) and generates `specs/{###}/spec.md` |
| `/speckit.clarify` | Asks up to 5 targeted questions to resolve spec ambiguities; writes answers back into `spec.md` |
| `/speckit.plan` | Generates `plan.md`, `research.md`, `data-model.md`, and API `contracts/` |
| `/speckit.checklist <domain>` | Creates a requirements-quality checklist (e.g., `ux`, `api`, `security`) in `specs/{###}/checklists/` |
| `/speckit.tasks` | Generates a dependency-ordered `tasks.md` from the plan |
| `/speckit.analyze` | Read-only consistency check across `spec.md`, `plan.md`, and `tasks.md` |
| `/speckit.implement` | Executes all tasks in `tasks.md` phase by phase |
| `/speckit.taskstoissues` | Converts tasks into GitHub Issues (requires GitHub MCP) |
| `/speckit.constitution` | Creates or updates `.specify/memory/constitution.md` |

### Key rules
- Always run `/speckit.specify` first — it creates the feature branch and `spec.md`.
- `/speckit.clarify` must complete before `/speckit.plan`.
- `/speckit.tasks` requires a complete `plan.md`.
- `/speckit.implement` checks `checklists/` for incomplete items before proceeding.
- The `update-agent-context.sh` script (called during `/speckit.plan`) auto-updates agent context files from plan metadata. Run it manually with: `.specify/scripts/bash/update-agent-context.sh claude`
- The project constitution at `.specify/memory/constitution.md` is the non-negotiable authority for architecture decisions.

## Key Conventions

- **Spec-first**: Functional changes should be reflected in `docs/SPECIFICATION.md`. New features follow the spec-kit workflow above.
- **Unit tests required**: Every new backend service method needs a Jest spec (`.spec.ts`). Tests live alongside source files in `src/`.
- **No global state for scores**: Leaderboards and picks are always scoped to a `leagueId`.
- **Scoring defaults**: Winner = 10 pts, Method = +5 pts, Round = +5 pts (configurable per league via `scoringSettings` JSON).
- **Survivor rules**: Wrong pick resets streak; draws and no-contests are safe.
