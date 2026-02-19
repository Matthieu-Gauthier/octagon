# Octagon Constitution

<!-- Sync Impact Report
Version: 1.2.0
Last Amended: 2026-02-19
Changes:
- Added "Mandatory Unit Testing (Jest)" principle.
- Bumped version to 1.2.0 (New Principle).
-->

## Governance
- **Ratified**: 2026-02-18
- **Version**: 1.2.0
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

### 5. Gameplay Mechanics
- **Betting**: Vegas-style fight cards. Bets locked after fight start time.
- **Survivor**: Streak-based (Wrong pick = reset, Draw/NC = safe). Optional per league.
- **Scoring**: Configurable per league (Winner/Method/Round/Decision points).

### 6. Iterative Workflow (Spec-Kit)
- **Spec-First**: Write/Update `specs/*.md` before implementation.
- **Phased Delivery**: Follow `docs/BACKEND_IMPLEMENTATION.md` phases.
- **Verification**: Verify each phase with E2E tests before moving to the next.

## Workflow
- Use `.specify/templates` for generating new specs.
- Validate all backend changes against `docs/BACKEND_IMPLEMENTATION.md`.
- Ensure `docs/SPECIFICATION.md` remains the functional source of truth.
