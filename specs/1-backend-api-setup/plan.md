# Implementation Plan: Backend Implementation

**Branch**: `1-backend-api-setup` | **Date**: 2026-02-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/1-backend-api-setup/spec.md`

## Summary

Initialize the NestJS backend application with PostgreSQL, Prisma, and Supabase Authentication. Implement the core "League-Centric" architecture, including data models for Users, Leagues, Events, Fighters, and Bets. Replace frontend mocks with real API calls.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Framework**: NestJS 10.x
**Database**: PostgreSQL 16 (on Unraid)
**ORM**: Prisma 5.x
**Auth**: Supabase Auth (JWT Strategy)
**Testing**: Jest (Unit/E2E)
**Project Type**: Monorepo (Frontend + Backend) structure assumed (or separate backend dir)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **League-Centric Architecture**: Schema designed around `leagueId`.
- [x] **Backend Architecture**: NestJS + Postgres + Prisma + Supabase confirmed.
- [x] **Observability**: Health check endpoint included.

## Project Structure

### Documentation (this feature)

```text
specs/1-backend-api-setup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code

```text
backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── prisma/             # Prisma Service & Schema
│   ├── auth/               # Supabase Guard & Strategy
│   ├── common/             # Global filters, pipes, guards
│   ├── modules/
│   │   ├── health/         # Health Check
│   │   ├── events/         # Events & Fights
│   │   ├── fighters/       # Fighters
│   │   ├── leagues/        # Leagues & Members
│   │   ├── bets/           # Betting Engine
│   │   └── user/           # User utilities (if needed)
│   └── scripts/            # Seeding scripts
├── test/                   # E2E Tests
└── package.json
```

**Structure Decision**: Standard NestJS modular architecture.

## Proposed Changes

### Core Infrastructure
#### [NEW] [Backend Setup](file:///c:/Users/xgotg/OneDrive/Documents/git/octagon/backend)
- Initialize NestJS project.
- Configure `ConfigModule` for Environment Variables.
- Setup `PrismaService` and `PrismaModule`.

### Authentication
#### [NEW] [Auth Module](file:///c:/Users/xgotg/OneDrive/Documents/git/octagon/backend/src/auth)
- Implement `SupabaseStrategy` (Passport JWT).
- Implement `JwtAuthGuard` and public decorators.

### Features
#### [NEW] [Leagues Module](file:///c:/Users/xgotg/OneDrive/Documents/git/octagon/backend/src/modules/leagues)
- `League` CRUD.
- `LeagueMember` management (Join/Leave).
- `ScoringSettings` handling.

#### [NEW] [Events Module](file:///c:/Users/xgotg/OneDrive/Documents/git/octagon/backend/src/modules/events)
- `Event` & `Fight` retrieval.
- **Spec Compliance**: Helper methods to filter past events based on User Bets.

#### [NEW] [Bets Module](file:///c:/Users/xgotg/OneDrive/Documents/git/octagon/backend/src/modules/bets)
- Betting logic (Create/Update).
- **Validation**: Time-check against `Event` date.

#### [NEW] [Admin Module](file:///c:/Users/xgotg/OneDrive/Documents/git/octagon/backend/src/modules/admin)
- Result entry endpoint.
- League archiving.

### Data & Seeding
#### [NEW] [Seed Script](file:///c:/Users/xgotg/OneDrive/Documents/git/octagon/backend/prisma/seed.ts)
- Script to populate DB with `MOCK_EVENTS`, `MOCK_LEAGUES`, and `MOCK_USERS`.

## Verification Plan

### Automated Tests
- **Unit Tests**: `npm run test` for Services and Logic.
- **E2E Tests**: `npm run test:e2e` for Controller endpoints (Supertest).
    - Verify `GET /events` returns correct filtered list.
    - Verify `POST /bets` rejects late bets.

### Manual Verification
1. **Health Check**: `GET /health` returns 200.
2. **Database State**: Run `npx prisma studio` to inspect seeded data.
3. **Auth Flow**: Obtain JWT from Supabase (client-side or curl), verify access to protected routes.

