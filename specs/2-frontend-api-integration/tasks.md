# Tasks: Frontend-Backend Integration

**Feature**: Frontend-Backend Integration (`2-frontend-api-integration`)
**Status**: Ready
**Spec**: [specs/2-frontend-api-integration/spec.md](file:///c:/Users/xgotg/OneDrive/Documents/git/octagon/specs/2-frontend-api-integration/spec.md)

## Phase 1: Setup & Infrastructure
**Goal**: Initialize dependencies and clients.
- [x] T001 Install dependencies (`axios`, `@tanstack/react-query`) in `frontend/package.json`
- [x] T002 Configure global `QueryClientProvider` in `frontend/src/main.tsx`
- [x] T003 Centralize Supabase client in `frontend/src/lib/supabase.ts`

## Phase 2: User Story 1 - Foundation (P1)
**Goal**: Secure communication with Backend.
- [x] T004 [US1] Create API client with interceptors in `frontend/src/lib/api.ts`
- [x] T005 [US1] Implement Autorefresh logic (401 handling) in `frontend/src/lib/api.ts`
- [x] T006 [US1] Create `useRealtime` hook in `frontend/src/hooks/useRealtime.ts`

## Phase 3: User Story 2 - Events & Fighters (P1)
**Goal**: Replace Mock Data with Real Data.
- [x] T007 [P] [US2] Create TS Interfaces for Event/Fighter in `frontend/src/types/api.ts`
- [x] T008 [P] [US2] Implement `useEvents` and `useEvent` hooks in `frontend/src/hooks/useEvents.ts`
- [x] T009 [P] [US2] Implement `useFighters` hook in `frontend/src/hooks/useFighters.ts`
- [x] T010 [US2] Integrate `useEvents` in `frontend/src/routes/dashboard.tsx` (Remove MOCK_EVENTS)
- [ ] T011 [US2] Integrate `useEvent` in `frontend/src/routes/event.tsx` (Remove MOCK_EVENTS)
- [x] T012 [US2] Add Skeleton loaders for Events/Fighters in `frontend/src/components/skeletons/`

## Phase 4: User Story 3 - Leagues (P2)
**Goal**: Enable League Management.
- [x] T013 [P] [US3] Create TS Interfaces for League in `frontend/src/types/api.ts`
- [x] T014 [P] [US3] Implement League hooks (`useLeagues`, `useCreateLeague`, `useJoinLeague`) in `frontend/src/hooks/useLeagues.ts`
- [x] T015 [US3] Integrate `useLeagues` in `frontend/src/routes/leagues.tsx` (Use `LeaguesHub` and `LeagueDashboard`)
- [x] T016 [US3] Wire up Create League Form in `frontend/src/components/leagues/create-league-form.tsx` (Use `CreateLeague.tsx`)
- [x] T017 [US3] Wire up Join League Form in `frontend/src/components/leagues/join-league-form.tsx` (Use `LeaguesHub.tsx`)

## Phase 5: User Story 4 - Gameplay (P2)
**Goal**: Enable Betting and Live Updates.
- [ ] T018 [P] [US4] Create TS Interfaces for Bets in `frontend/src/types/api.ts`
- [ ] T019 [P] [US4] Implement `useBets` and `usePlaceBet` hooks in `frontend/src/hooks/useBets.ts`
- [ ] T020 [US4] Integrate Betting UI with `usePlaceBet` in `frontend/src/components/events/fight-card.tsx`
- [ ] T021 [US4] Implement Realtime subscription for Fight/Bet updates in `frontend/src/hooks/useGameRealtime.ts`

## Phase 6: Polish
**Goal**: Final UX touches.
- [ ] T022 Implement Global Toast Error Handling (FR-006) in `frontend/src/lib/api.ts`
- [ ] T023 Manual E2E Verification

## Dependencies
- Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5
