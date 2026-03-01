# Tasks: Fighter Recent Form

**Input**: Design documents from `/specs/009-fighter-recent-form/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Checkout feature branch `009-fighter-recent-form` (Already completed during speckit.specify)
- [x] T002 Verify local database is running and accessible

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T003 Update `Fighter` model in `backend/prisma/schema.prisma` to add `recentForm Json?`
- [x] T004 Run Prisma db push or migrate dev to apply schema changes and generate client

**Checkpoint**: Foundation ready - Database schema is updated to support recent form.

---

## Phase 3: User Story 2 - Automated Scraping of Recent Form (Priority: P1) 🎯 

**Goal**: The system automatically extracts the last 3 fight results for each fighter during the regular scraping process.

**Independent Test**: Can be tested by running the scraper on an athlete's page locally and verifying the database correctly updates the fighter's recent form field.

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [x] T005 [P] [US2] Update unit tests for `FighterScraperService` in `backend/src/scraper/services/fighter-scraper.service.spec.ts` to expect recent form extraction.

### Implementation for User Story 2

- [x] T006 [US2] Implement HTML parsing logic for `athlete-record` in `backend/src/scraper/services/fighter-scraper.service.ts` using Cheerio.
- [x] T007 [US2] Update database saving logic in `fighter-scraper.service.ts` to persist the extracted `recentForm` JSON array.

**Checkpoint**: At this point, the backend scraper independently collects and stores the recent form data.

---

## Phase 4: User Story 1 - View Fighter Recent Form (Priority: P1) 🎯 MVP

**Goal**: Users viewing a fighter's profile or fight card can see the outcome and method of their last 3 fights.

**Independent Test**: Can be tested by viewing a fighter who has at least 3 recent fights logically seeded in the database and verifying the outcomes match the UI.

### Implementation for User Story 1

- [x] T008 [P] [US1] Update frontend `Fighter` TypeScript definitions to include `recentForm?: { result: 'W' | 'L' | 'D' | 'NC'; method: string; }[]` in `frontend/src/types/fighter.ts` (or appropriate types file).
- [x] T009 [US1] Update `FightCardShowcase` component to render the recent form data in `frontend/src/components/fighter/FightCardShowcase.tsx`.

**Checkpoint**: Both User Stories 1 AND 2 should both work end-to-end to deliver the feature MVP.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T010 Run frontend and backend linting/formatting.
- [x] T011 Verify end-to-end UI rendering looks good on both desktop and mobile views.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all active development
- **User Stories (Phase 3 & 4)**: 
  - US2 (Scraping) can start immediately after Phase 2.
  - US1 (UI) theoretically depends on the backend actually serving the data, although frontend mocking can be done in parallel.

### Implementation Strategy

1. Complete Setup + Foundational → Foundation ready (Schema Updated)
2. Add User Story 2 (Scraping) → Test independently by scraping a known fighter
3. Add User Story 1 (UI) → Ensure the UI consumes the newly scraped dataset 
4. Polish and commit.
