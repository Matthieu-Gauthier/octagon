# Tasks: Fix Fight Display Issues

**Input**: Design documents from `/specs/008-fix-fight-display-issues/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

*(No net-new project setup required for this feature)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Update database schema by adding `order` Int field to the `Fight` model in `backend/prisma/schema.prisma`
- [x] T002 Apply database schema changes (e.g. `npx prisma db push`) in `backend/`

**Checkpoint**: Foundation ready - database is prepared for the new ordering mechanism.

---

## Phase 3: User Story 1 - Consistent Fight Order (Priority: P1) 🎯 MVP

**Goal**: Fights must be listed in the exact same chronological order as they appear on the source website.

**Independent Test**: Can be independently verified by scraping a new event and checking the /events API response order.

### Implementation for User Story 1

- [x] T003 [US1] Update `ScraperService` to parse and assign an integer `order` index to each fight during extraction and upsert in `backend/src/scraper/scraper.service.ts`
- [x] T004 [P] [US1] Modify `EventsService` `findAll` and `findOne` methods to replace existing `orderBy` logic with `{ order: 'asc' }` in `backend/src/events/events.service.ts`
- [x] T005 [US1] Re-scrape an upcoming event using the application UI or API to populate the new `order` field for existing data.

**Checkpoint**: At this point, User Story 1 should be fully functional and the backend should return correctly ordered fights.

---

## Phase 4: User Story 2 - Complete Fighter Stats Display (Priority: P2)

**Goal**: Display physical statistics (Height, Weight, Reach, Stance) visually similar to the win methods.

**Independent Test**: Can be tested by viewing any fighter card on the UI and verifying that the four specific stats are visible.

### Implementation for User Story 2

- [x] T006 [US2] Create new `PhysicalStatsBreakdown` component/widget inside `frontend/src/components/FightCard.tsx` that mirrors the styling of `WinsBreakdown`
- [x] T007 [US2] Integrate the `PhysicalStatsBreakdown` component into the primary `FightCard` layout, ensuring it receives data from the `fighterA` and `fighterB` props in `frontend/src/components/FightCard.tsx`

**Checkpoint**: At this point, Physical Stats should be visible on the Fighter card.

---

## Phase 5: User Story 3 - Missing Country Flags (Priority: P3)

**Goal**: Fix missing flags and reposition them to the absolute bottom of the card.

**Independent Test**: Can be independently tested by viewing international fighters on the UI.

### Implementation for User Story 3

- [x] T008 [P] [US3] Add missing country mappings (e.g. smaller European/African nations) to the `countryFlags` object in `frontend/src/lib/flags.ts`
- [x] T009 [US3] Modify `VegasFightCard` layout to remove flags from the central "VS Badge" and position them at the absolute bottom of the card container in `frontend/src/components/FightCard.tsx`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T010 Verify mobile responsiveness of the newly added stats and repositioned flags in `FightCard.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A
- **Foundational (Phase 2)**: BLOCKS User Story 1 (database field required).
- **User Stories (Phase 3+)**: 
  - US1 depends on Phase 2.
  - US2 & US3 are purely frontend and can be done in parallel with US1 once Phase 2 is complete, assuming backend API payloads already include the necessary `height`, `weight`, etc., which they do.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational schema update.
- **User Story 2 (P2)**: Independent entirely.
- **User Story 3 (P3)**: Independent, but touches the same file (`FightCard.tsx`) as US2, so coordinate to avoid merge conflicts.

### Parallel Opportunities

- T004 (Updating API sorting) can happen in parallel with T003 (Scraper update).
- T008 (Adding flag mappings) can happen in parallel with any other task.
- US2 and US3 UI work can theoretically happen in parallel with US1 backend work.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (Database update)
2. Complete Phase 3: User Story 1 (Scraper & API sort)
3. **STOP and VALIDATE**: Verify the chronological ordering of fights works end-to-end.

### Incremental Delivery

1. Deliver US1 (Fight Order).
2. Deliver US2 (Fighter Stats UI).
3. Deliver US3 (Flag Repositioning and Mappings).
