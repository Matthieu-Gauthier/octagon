# Tasks: Backend Implementation

**Feature**: Backend API Setup
**Status**: In Progress

## Phase 1: Core Infrastructure
- [x] T001 Create NestJS project structure <!-- id: 3 -->
- [x] T002 Configure Environment Variables (ConfigModule) <!-- id: 4 -->
- [x] T003 Initialize Prisma execution (Schema & Service) <!-- id: 5 -->
- [x] T004 [P] Implement Health Module (/health) <!-- id: 6 -->

## Phase 2: User Story 1 - Core Backend & Auth (P1)
**Goal**: Authenticate users and secure endpoints.
- [x] T005 [US1] Implement Unit Tests for AuthModule (Strategy, Guard) in `backend/src/auth/`

- [x] T006 [US1] Implement SupabaseStrategy in `backend/src/auth/supabase.strategy.ts` <!-- id: 7 -->
- [x] T007 [US1] Implement JwtAuthGuard in `backend/src/auth/supabase.guard.ts` <!-- id: 8 -->
- [x] T008 [US1] Configure AuthModule in `backend/src/auth/auth.module.ts` <!-- id: 9 -->

## Phase 3: User Story 2 - Events & Fighters Data (P1)
**Goal**: Serve fight data to the frontend.
- [x] T009 [US2] Implement Unit Tests for EventsService (filtering logic) in `backend/src/events/events.service.spec.ts`
- [x] T010 [US2] Implement Unit Tests for FightersService in `backend/src/fighters/fighters.service.spec.ts`
- [x] T011 [P] [US2] Create Event, Fight, Fighter models in `backend/prisma/schema.prisma` <!-- id: 10 -->
- [x] T012 [US2] Implement FightersService (findAll, findOne) <!-- id: 11 -->
- [x] T013 [US2] Implement FightersController <!-- id: 12 -->
- [x] T014 [US2] Implement EventsService (findAll with logic, findOne) <!-- id: 13 -->
- [x] T015 [US2] Implement EventsController <!-- id: 14 -->
- [x] T016 [US2] Create Seed Script for Mock Data in `backend/prisma/seed.ts` <!-- id: 15 -->

## Phase 4: User Story 3 - Leagues System (P2)
**Goal**: Allow users to create and join leagues.
- [x] T017 [US3] Implement Unit Tests for LeaguesService in `backend/src/leagues/leagues.service.spec.ts`
- [x] T018 [P] [US3] Create League, LeagueMember models in `backend/prisma/schema.prisma` <!-- id: 16 -->
- [x] T019 [US3] Implement LeaguesService (create, join, findAll) <!-- id: 17 -->
- [x] T020 [US3] Implement LeaguesController <!-- id: 18 -->

## Phase 5: User Story 4 - Betting Engine (P2)
**Goal**: Enable betting logic.
- [x] T021 [US4] Implement Unit Tests for BetsService (validation logic) in `backend/src/bets/bets.service.spec.ts`
- [x] T022 [P] [US4] Create Bet model in `backend/prisma/schema.prisma` <!-- id: 19 -->
- [x] T023 [US4] Implement BetsService (placeBet, findMyBets) <!-- id: 20 -->
- [x] T024 [US4] Implement BetsController <!-- id: 21 -->

## Phase 6: Polish & Verification
**Goal**: Ensure system stability and coverage.
- [x] T025 Run full E2E Test Suite (`npm run test:e2e`)
- [x] T026 Verify all Unit Tests Pass (`npm run test`)
- [x] T027 Verify API with Frontend (Manual Integration Check)

## Dependencies
- Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5
