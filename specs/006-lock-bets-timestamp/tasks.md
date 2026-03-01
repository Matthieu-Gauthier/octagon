# Tasks: Lock Bets by Card-Section Start Timestamp

**Input**: Design documents from `specs/006-lock-bets-timestamp/`  
**Branch**: `006-lock-bets-timestamp`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: Unit tests (Jest) required per constitution — included for backend tasks.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prisma schema update — foundational for all backend user stories.

- [ ] T001 Add `prelimsStartAt DateTime?` and `mainCardStartAt DateTime?` to `model Event` in `backend/prisma/schema.prisma`
- [ ] T002 Run `npx prisma migrate dev --name add-card-section-timestamps` in `backend/` to generate migration and update DB
- [ ] T003 Run `npx prisma generate` in `backend/` to regenerate the Prisma client after migration

**Checkpoint**: Prisma client and DB schema ready — all subsequent tasks can proceed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the `ScrapedEvent` TypeScript interface and frontend `Event` type — required before service and UI tasks.

**⚠️ CRITICAL**: Backend service tasks (T007+) and frontend task (T012) cannot start until these are done.

- [ ] T004 [P] Add `prelimsStartAt?: Date` and `mainCardStartAt?: Date` to `ScrapedEvent` interface in `backend/src/events/scraper.service.ts`
- [ ] T005 [P] Add `prelimsStartAt?: string | null` and `mainCardStartAt?: string | null` to `Event` interface in `frontend/src/types/api.ts`

**Checkpoint**: Type definitions ready — backend service and frontend UI tasks can now begin in parallel.

---

## Phase 3: User Story 3 — Scraper Captures Timestamps (Priority: P2) 🎯 MVP Start

> US3 is implemented first because US1 and US2 (bet locking logic) depend on the timestamps being scraped and stored.

**Goal**: Scraper extracts `data-timestamp` from `#main-card` and `#prelims-card` divs and persists them on the event record.

**Independent Test**: Trigger `POST /admin/events/fetch` and confirm the returned event object contains non-null `prelimsStartAt` and `mainCardStartAt`. Check the `events` table in DB to confirm both columns are populated.

### Tests for User Story 3

- [ ] T006 [US3] Add unit test to `backend/src/events/scraper.service.spec.ts`: mock HTML with both `#main-card` and `#prelims-card` timestamp elements and assert `scrapeNextEvent()` returns an event object with correct `prelimsStartAt` and `mainCardStartAt` Date values
- [ ] T007 [US3] Add unit test to `backend/src/events/scraper.service.spec.ts`: mock HTML with only `#main-card` timestamp element and assert `mainCardStartAt` is set and `prelimsStartAt` is undefined
- [ ] T008 [US3] Add unit test to `backend/src/events/scraper.service.spec.ts`: mock HTML with no timestamp elements and assert both fields are undefined on the returned event

### Implementation for User Story 3

- [ ] T009 [US3] Add private helper `extractSectionTimestamp($ev, sectionId)` in `backend/src/events/scraper.service.ts` that reads `data-timestamp` from `.c-event-fight-card-broadcaster__time` within the given section and returns `Date | undefined`
- [ ] T010 [US3] Call `extractSectionTimestamp` for `'#prelims-card'` and `'#main-card'` after HTML parse in `scrapeNextEvent()` in `backend/src/events/scraper.service.ts` and include results on the returned event object
- [ ] T011 [US3] Update `fetchNextEvent()` in `backend/src/events/events.service.ts` to include `prelimsStartAt` and `mainCardStartAt` in both the `update` and `create` payloads of the event upsert

**Checkpoint**: Scraper now captures and stores per-section timestamps. US1 and US2 logic can now be implemented.

---

## Phase 4: User Story 1 — Prelim Bets Lock at Prelim Start Time (Priority: P1)

**Goal**: Bet placement is rejected for prelim fights once `prelimsStartAt` has passed, while main card bets remain open.

**Independent Test**: In `bets.service.spec.ts`, confirm that a mock fight with `isPrelim = true` and a past `prelimsStartAt` causes `placeBet()` to throw `BadRequestException` with message containing "preliminary card". Confirm a mock fight with `isPrelim = true` and a future `prelimsStartAt` allows the bet through.

### Tests for User Story 1

- [ ] T012 [US1] Add unit test to `backend/src/bets/bets.service.spec.ts`: prelim fight, `now < prelimsStartAt` → bet accepted (upsert called)
- [ ] T013 [US1] Add unit test to `backend/src/bets/bets.service.spec.ts`: prelim fight, `now >= prelimsStartAt` → `BadRequestException` with message matching "preliminary card"
- [ ] T014 [US1] Add unit test to `backend/src/bets/bets.service.spec.ts`: main card fight while `now >= prelimsStartAt` but `now < mainCardStartAt` → bet accepted (main card still open)
- [ ] T015 [US1] Add unit test to `backend/src/bets/bets.service.spec.ts`: prelim fight with null `prelimsStartAt`, `now < event.date` → bet accepted (fallback)
- [ ] T016 [US1] Add unit test to `backend/src/bets/bets.service.spec.ts`: prelim fight with null `prelimsStartAt`, `now >= event.date` → `BadRequestException` (fallback)

### Implementation for User Story 1

- [ ] T017 [US1] Update the `fight.findUnique` include in `placeBet()` in `backend/src/bets/bets.service.ts` so the `event` include selects `prelimsStartAt` and `mainCardStartAt` in addition to existing fields
- [ ] T018 [US1] Replace the single `now >= fight.event.date` cutoff check in `placeBet()` in `backend/src/bets/bets.service.ts` with per-section logic: `isPrelim → (prelimsStartAt ?? date)`, `isMainCard → (mainCardStartAt ?? date)`, throw `BadRequestException` with section-specific message

**Checkpoint**: Prelim bets lock correctly at `prelimsStartAt`. Main card bets are unaffected.

---

## Phase 5: User Story 2 — Main Card Bets Lock at Main Card Start Time (Priority: P1)

**Goal**: Bet placement is rejected for main card fights once `mainCardStartAt` has passed.

**Independent Test**: In `bets.service.spec.ts`, confirm a mock fight with `isMainCard = true` and a past `mainCardStartAt` causes `placeBet()` to throw `BadRequestException` with message containing "main card". Confirm a future `mainCardStartAt` allows the bet.

> **Note**: The implementation for US2 is part of T018 (same `placeBet` logic). The tasks below are the **test coverage** specific to the main card case.

### Tests for User Story 2

- [ ] T019 [US2] Add unit test to `backend/src/bets/bets.service.spec.ts`: main card fight, `now < mainCardStartAt` → bet accepted
- [ ] T020 [US2] Add unit test to `backend/src/bets/bets.service.spec.ts`: main card fight, `now >= mainCardStartAt` → `BadRequestException` with message matching "main card"
- [ ] T021 [US2] Add unit test to `backend/src/bets/bets.service.spec.ts`: main card fight with null `mainCardStartAt`, `now >= event.date` → `BadRequestException` (fallback)

**Checkpoint**: Both prelim and main card bets lock correctly at their respective timestamps.

---

## Phase 6: User Story 4 — UI Deadline Indicator on Each Fight Card (Priority: P2)

**Goal**: Each `VegasFightCard` displays the applicable lock deadline and transitions to a locked visual state once the deadline has passed.

**Independent Test**: Open the event page in the browser. Confirm all fight cards display a lock deadline indicator. Temporarily set `mainCardStartAt` to a time in the past in the DB and reload — main card fight cards should show "Bets locked" and bet actions should be disabled.

### Implementation for User Story 4

- [ ] T022 [US4] Add `lockAt?: string | null` prop to `VegasFightCardProps` interface in `frontend/src/components/FightCard.tsx`
- [ ] T023 [US4] Compute `const isLocked = locked || (!!lockAt && new Date() >= new Date(lockAt))` inside `VegasFightCard` in `frontend/src/components/FightCard.tsx` and replace all uses of the `locked` prop internally with `isLocked`
- [ ] T024 [US4] Add deadline banner JSX below the event-type header (after the `eventType === "standard"` block) in `frontend/src/components/FightCard.tsx`: show formatted lock time when open, show "Bets locked" in red when `isLocked` is true; use `Lock` icon (already imported), Tailwind dark-theme classes consistent with existing design
- [ ] T025 [P] [US4] Update parent components that render `VegasFightCard` (search for usages in `frontend/src/`) to derive and pass `lockAt` from `fight.isPrelim ? event.prelimsStartAt : event.mainCardStartAt`

**Checkpoint**: UI deadline indicator visible on all fight cards. Locked state disables betting UI client-side. Server enforces cutoff independently.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T026 [P] Run full backend test suite `cd backend && npm run test` and confirm all new and existing tests pass
- [ ] T027 [P] Manually verify scraper output by calling `POST /admin/events/fetch` and checking response includes `prelimsStartAt` and `mainCardStartAt`
- [ ] T028 Verify DB migration is clean: connect to PostgreSQL and confirm `events` table has two new nullable columns
- [ ] T029 [P] Review `backend/src/events/events.service.spec.ts`: add a smoke test verifying `fetchNextEvent` returns event data including the two timestamp fields (mock scraper output)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (Prisma client must exist before extending interfaces)
- **Phase 3 (US3 — Scraper)**: Depends on Phase 2 — T004 (interface) required before T009/T010
- **Phase 4 (US1 — Prelim lock)**: Depends on Phase 2 (T004 for event include) and Phase 3 (timestamps must be in DB)
- **Phase 5 (US2 — Main card lock)**: Depends on Phase 4 (T017/T018 already in place)
- **Phase 6 (US4 — UI)**: Depends on Phase 2 (T005 frontend type) — can run in parallel with Phases 3/4/5
- **Phase 7 (Polish)**: Depends on all phases complete

### User Story Dependencies

| Story | Depends On | Can Parallelize With |
|-------|-----------|---------------------|
| US3 (scraper) | Phase 1+2 | — |
| US1 (prelim lock) | Phase 1+2+3 | — |
| US2 (main lock) | US1 (T017/T018) | — |
| US4 (UI) | Phase 2 (T005) | US3, US1, US2 (different layer) |

### Parallel Opportunities

- **T004 ∥ T005**: Backend interface + frontend type update (different files, no dependencies)
- **T006 ∥ T007 ∥ T008**: Scraper test cases (independent test scenarios) — write then run together
- **T012 ∥ T013 ∥ T014 ∥ T015 ∥ T016**: Bets.service test cases (all independent scenarios)
- **T019 ∥ T020 ∥ T021**: Main card test cases
- **Phase 6 (US4)**: Entire frontend phase can start right after T005 (Phase 2) completes, in parallel with backend phases 3/4/5
- **T026 ∥ T027 ∥ T029**: Final validation tasks (independent checks)

---

## Parallel Example: Backend Tests

```bash
# All bets.service test cases can be written in one session (same file):
T012: prelim fight, now < prelimsStartAt → bet accepted
T013: prelim fight, now >= prelimsStartAt → BadRequestException "preliminary card"
T014: main card fight, prelims started but main card hasn't → bet accepted
T015: prelim fight, null prelimsStartAt, now < event.date → accepted (fallback)
T016: prelim fight, null prelimsStartAt, now >= event.date → BadRequestException

# All scraper test cases can be written in one session (same file):
T006: both sections have timestamps → both fields set
T007: only main-card has timestamp → only mainCardStartAt set
T008: no timestamps → both undefined
```

---

## Implementation Strategy

### MVP (US3 + US1 + US2 only — no UI changes)

1. Complete Phase 1: Prisma migration
2. Complete Phase 2: Type interfaces
3. Complete Phase 3: Scraper timestamps (US3)
4. Complete Phase 4: Prelim lock logic + tests (US1)
5. Complete Phase 5: Main card lock tests (US2)
6. **STOP and VALIDATE**: Run `npm run test`, trigger scrape, confirm cutoff works

### Full Delivery (all 4 user stories)

- Run UI phase (Phase 6) in parallel with backend phases once T005 (frontend type) is done
- Merge and test end-to-end

### Single Developer Order

```
T001 → T002 → T003 → T004 + T005 (parallel) → T006-T011 (US3) → T012-T018 (US1) → T019-T021 (US2) → T022-T025 (US4) → T026-T029 (Polish)
```

---

## Notes

- `[P]` = different files or independent scenarios, no blocking dependencies
- Jest tests must be written to **fail first**, then the implementation makes them pass
- The `locked` prop in `VegasFightCard` is separate from `lockAt` — `lockAt` is the timestamp string, `locked` remains the server-driven override (e.g., fight status = FINISHED)
- After T002 (migration), verify `npx prisma studio` shows the new columns before proceeding
- US2 shares the same implementation task (T018) as US1 — its phase contains only test coverage tasks
