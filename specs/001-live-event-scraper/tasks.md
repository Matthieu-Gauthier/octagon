# Tasks: Live Event Scraper

**Input**: Design documents from `/specs/001-live-event-scraper/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and missing dependencies

- [x] T001 Install `@nestjs/schedule` and `@types/cron` in `backend` via npm
- [x] T002 Configure `ScheduleModule.forRoot()` in `backend/src/app.module.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before the scraping logic can run

- [x] T003 Create `JobsModule` in `backend/src/jobs/jobs.module.ts` and register it in `AppModule`

**Checkpoint**: Foundation ready - background scheduling is enabled.

---

## Phase 3: User Story 1 - Live Event Result Injection (Priority: P1) 🎯 MVP

**Goal**: Automatically monitor live UFC events and update fight results in real-time.

**Independent Test**: Can be verified by running the cron method manually or setting a short interval against a mock HTML payload/active event.

### Implementation for User Story 1

- [x] T004 [US1] Create `LiveScraperService` scaffold in `backend/src/jobs/live-scraper.service.ts`
- [x] T005 [US1] Implement event discovery: Fetch `SCHEDULED` events past start time (transition to `LIVE`) and existing `LIVE` events
- [x] T006 [US1] Implement HTML scraping logic using `cheerio` to extract fight results (winner, KO/SUB/DECISION/DRAW/NC, round) from the event page
- [x] T007 [US1] Implement database updates: Update `Fight` records, ensuring `winnerId` is null for DRAW/NC
- [x] T008 [US1] Implement event completion: Detect if all fights are finished and transition event `status` to `COMPLETED`
- [x] T009 [US1] Add `@Cron('*/5 * * * *')` decorator and wrap the execution in a robust `try/catch` to handle 403s/timeouts gracefully
- [x] T010 [P] [US1] Write unit tests for `LiveScraperService` logic in `backend/src/jobs/live-scraper.service.spec.ts`

**Checkpoint**: User Story 1 (Live Event Scraping) is fully functional and safely runs every 5 minutes.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and final verification

- [x] T011 Verify memory stability and error handling logs when simulating external scraping failures

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup
- **User Stories (Phase 3)**: Depends on Foundational phase
- **Polish (Phase 4)**: Depends on User Story 1

### User Story Dependencies

- **User Story 1 (P1)**: Independent MVP.

### Parallel Opportunities

- T010 (Unit tests) can be written iteratively or in parallel with the implementation of T005-T008 if following TDD.

---

## Parallel Example: User Story 1

```bash
# Launch implementation and tests together:
Task: "[US1] Create LiveScraperService scaffold in backend/src/jobs/live-scraper.service.ts"
Task: "[P] [US1] Write unit tests for LiveScraperService logic in backend/src/jobs/live-scraper.service.spec.ts"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2 (Dependencies and Module setup)
2. Complete Phase 3 (Scraping logic, DB updates, Error handling)
3. Deploy and verify during a real or simulated live event
