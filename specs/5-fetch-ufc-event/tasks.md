# Tasks: Fetch UFC Event

**Input**: Design documents from `/specs/5-fetch-ufc-event/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T024 Ensure error states in the UI are handled gracefully (e.g., toast notifications on failure).
- [x] T001 Ensure environment variables are configured for image storage (if applicable) in `backend/.env`
- [x] T002 Install `cheerio` dependency in backend for HTML scraping: `npm install cheerio` in `backend/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Update Prisma schema in `backend/prisma/schema.prisma` with new Fighter fields (remove `record` string, add `wins`, `losses`, `draws`, `noContests`, `winsByKo`, `winsBySub`, `winsByDec`, `height`, `weight`, `reach`, `stance`, `sigStrikesLandedPerMin`, `takedownAvg`)
- [x] T004 Update Prisma schema in `backend/prisma/schema.prisma` to add `onDelete: Cascade` to the `fightId` and `eventId` relations in `Fight`, `Bet`, and `SurvivorPick` models
- [x] T005 Generate Prisma client and push/migrate db changes using `npx prisma db push` (or migrate dev) in `backend/`
- [x] T006 [P] Create the base `EventsModule` and `EventsController` if they do not yet exist in `backend/src/events/events.module.ts`

**Checkpoint**: Foundation ready - Database schema supports the new data properties and deletion cascades.

---

## Phase 3: User Story 1 - Fetch Next UFC Event Data (Priority: P1) 🎯 MVP

**Goal**: Automatically retrieve the details of the next upcoming UFC event (including Main Card and Prelims fights, fighters, and their images) to populate the application without manual entry.

**Independent Test**: Can be tested by triggering the fetch process via cURL or the frontend button and verifying that the correct event, fighters with extra stats, and fights appear in the database/admin view without early prelims.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Create unit tests for the scraper logic in `backend/src/events/scraper.service.spec.ts`
- [x] T008 [P] [US1] Create unit tests for event ingestion in `backend/src/events/events.service.spec.ts`

### Implementation for User Story 1

- [x] T009 [P] [US1] Implement `ScraperService` in `backend/src/events/scraper.service.ts` to scrape fighter and event data mirroring the `victor-lillo` logic
- [x] T010 [US1] Implement image download and local file storage utility in `backend/src/events/scraper.service.ts` or a new `backend/src/utils/file.util.ts`
- [x] T011 [US1] Implement the core `EventsService.fetchNextEvent()` method in `backend/src/events/events.service.ts` to orchestrate scraping, filtering out early prelims, and upserting data via Prisma (depends on T009)
- [x] T012 [US1] Expose endpoint `POST /api/admin/events/fetch` in `backend/src/events/events.controller.ts`
- [x] T013 [P] [US1] Add a "Fetch Next UFC Event" button to the UI layout in `frontend/src/pages/admin/AdminResults.tsx`
- [x] T014 [US1] Connect the frontend button to the `POST` endpoint using a React Query hook in `frontend/src/pages/admin/AdminResults.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. You can fetch events into the platform.

---

## Phase 4: User Story 2 - Remove UFC Event and Cascading Data (Priority: P2)

**Goal**: Provide administrators the ability to delete an event from the admin dashboard, cleaning up all its associated fights and bets automatically.

**Independent Test**: Create a dummy event, add a dummy fight and bet, and test the deletion endpoint. Ensure no orphaned records exist in the DB.

### Tests for User Story 2 ⚠️

- [x] T015 [P] [US2] Create unit test for event deletion logic in `backend/src/events/events.service.spec.ts`

### Implementation for User Story 2

- [x] T016 [US2] Implement deletion method `EventsService.removeEvent(id)` in `backend/src/events/events.service.ts` (relies on DB cascades established in Phase 2)
- [x] T017 [US2] Expose endpoint `DELETE /api/admin/events/:id` in `backend/src/events/events.controller.ts`
- [x] T018 [P] [US2] Add a "Remove Event" button alongside the event details in `frontend/src/pages/admin/AdminResults.tsx`
- [x] T019 [US2] Connect the frontend button to the `DELETE` endpoint using a React Query hook in `frontend/src/pages/admin/AdminResults.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Admins can fetch and delete events safely.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T020 Code cleanup, formatting, and linting (`npm run lint` in both frontend and backend)
- [x] T021 [P] Ensure fallback silhouettes are correctly utilized on the frontend if `imagePath` returns empty.
- [x] T022 Secure `POST` and `DELETE` endpoints in `EventsController` with the `JwtAuthGuard` and Admin Role Guard.
- [x] T023 Run E2E or full unit test suites to confirm no regressions.

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories. Schema changes must be applied first.
- **User Stories (Phase 3+)**: Depend on Foundational phase completion.
- **Polish (Final Phase)**: Depends on both user stories being complete.

### User Story Dependencies
- **User Story 1 (P1)**: Independent execution after Phase 2.
- **User Story 2 (P2)**: Independent execution. Deletion tests can be executed by manually seeding data if US1 is not ready, but practically follows US1.

### Parallel Opportunities
- React frontend UI components (`T013`, `T018`) can be built out in parallel with the backend `ScraperService` (`T009`) and tests.
- DB Schema updates (`T003`, `T004`) can run while `cheerio` is being evaluated.

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 & 2 (Crucial Prisma schema changes).
2. Complete Phase 3 (Scraping and persisting data).
3. **STOP and VALIDATE**: Verify the event is successfully retrieved, parsed, and saved via Swagger/cURL or the basic UI button.
4. Move to Phase 4 (Scraping deletion safety).
5. Wrap up Polish.
