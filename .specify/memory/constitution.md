# Octagon Constitution

<!-- Sync Impact Report
Version: 1.3.0
Last Amended: 2026-03-15
Changes:
- Added Power-ups (Atouts) to Gameplay Mechanics.
- Clarified Survivor mode is currently unused/disabled.
- Added Supabase Realtime to Backend Architecture.
- Added evening-play format to Gameplay Mechanics.
- Bumped version to 1.3.0.
-->

## Governance
- **Ratified**: 2026-02-18
- **Version**: 1.3.0
- **Amendment Process**: Pull Request review by Repository Owner.

## Core Principles

### 1. League-Centric Architecture
- **Isolation**: No global leaderboards. All scoring and standings exist strictly within a `League`.
- **Navigation**: The application entry point is `/leagues` (My Leagues).
- **Data Scope**: Bets and Survivor picks must be keyed by `leagueId`.

### 2. Backend Architecture (NestJS + Postgres)
- **Framework**: NestJS with modular architecture (Feature Modules).
- **Database**: PostgreSQL hosted on Unraid (`192.168.0.200`).
- **ORM**: Prisma for type-safe database access.
- **Auth**: Supabase JWT validation via Passport Strategy.
- **Realtime**: Supabase Realtime used for live score and bet updates (subscribe by league).
- **Observability**: Health check endpoint (`/health`) required for connectivity verification.

### 3. Mandatory Unit Testing (Jest)
- **Framework**: Tests must be written using **Jest**.
- **Requirement**: No story is considered complete without passing unit tests covering the new functionality.
- **Verification**: All tests must pass before a story is marked as done.
- **Scope**: Success paths, error cases, and edge cases.

### 4. Frontend Standards
- **Stack**: React (Vite) + TypeScript + Tailwind CSS.
- **State**: Zustand for global state (Bets, Auth).
- **UI**: Shadcn/Radix primitives, Lucide icons, Dark Mode default.
- **Routing**: React Router DOM.
- **Language**: All UI text must be in **English** (labels, badges, buttons, placeholders).
- **Fighter record format**: `W - L - D` with NC in parentheses if non-zero, e.g. `19 - 0 - 2 (1)` or `18 - 5 - 0`.
- **Fighter stats displayed**: Age, Height, Reach, Weight (all optional — shown only when available). `age` / `dateOfBirth` fields are planned but not yet in the backend schema — frontend types are ready.

### 5. Gameplay Mechanics
- **Play format**: Games are played during a single UFC event evening. No real money — points only.
- **Betting**: Vegas-style fight cards. Bets locked after fight start time (or event lock).
- **Scoring**: Default — Winner = 10pts, Method = +5pts, Round = +5pts. Configurable per league via `scoringSettings`.
- **Power-ups (Atouts)**: Each player gets 1 atout per event per league. Atouts are played on a fight or an opponent before the fight starts. Once played, visible to all. An opponent may only be targeted once per evening.
  - **Dernière Chance**: x2 points on the main event (self-target only).
  - **Exacto**: +15 bonus pts if winner + method + round are all correct (self-target only).
  - **Inversion**: Flips an opponent's pick to the opposite fighter; locks their pick on that fight.
  - **Dette**: If targeted opponent gets the fight correct, their points transfer to the player who played the atout.
- **Survivor**: Streak-based (Wrong pick = reset, Draw/NC = safe). Optional per league. **Currently unused/disabled — do not implement Survivor features unless explicitly requested.**

### 6. Iterative Workflow (Spec-Kit)
- **Spec-First**: Write/Update `specs/*.md` before implementation.
- **Phased Delivery**: Follow `docs/BACKEND_IMPLEMENTATION.md` phases.
- **Verification**: Verify each phase with E2E tests before moving to the next.

## Workflow
- Use `.specify/templates` for generating new specs.
- Validate all backend changes against `docs/BACKEND_IMPLEMENTATION.md`.
- Ensure `docs/SPECIFICATION.md` remains the functional source of truth.
