# Tasks: Fighter Ranking & Champion Status

**Input**: Design documents from `/specs/013-fighter-ranking/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Backend unit tests (Jest) are **REQUIRED** per constitution — new scraping logic in `scraper.service.ts` must have `.spec.ts` tests covering success paths, error cases, and edge cases.

**Organization**: Tasks are grouped by user story (US1 = scraping backend, US2 = frontend display).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema migration and type plumbing — foundational for both user stories.

- [X] T001 Add `rankingPosition Int?` and `isChampion Boolean?` fields to `Fighter` model in `backend/prisma/schema.prisma`
- [X] T002 Apply schema changes via `npx prisma db push` from `backend/`
- [X] T003 Add `rankingPosition?: number` and `isChampion?: boolean` to `ScrapedFighter` interface in `backend/src/events/scraper.service.ts`
- [X] T004 Add `rankingPosition?: number` and `isChampion?: boolean` to `Fighter` interface in `frontend/src/types/api.ts`

**Checkpoint**: Schema is live, TypeScript interfaces reflect new fields — user story work can begin.

---

## Phase 2: User Story 1 — Ranking & Champion Status Scraped (Priority: P1) 🎯 MVP

**Goal**: The scraper extracts rank number and champion status from `.hero-profile__tag` elements and persists them on the Fighter record.

**Independent Test**: Trigger a scrape for a known ranked fighter and a known champion. Verify DB records contain correct `rankingPosition` / `isChampion` values. Run `npm test -- --testPathPattern=scraper.service` and verify all new tests pass.

### Tests for User Story 1 (REQUIRED) ⚠️

> **Write these tests FIRST, ensure they FAIL before implementation**

- [X] T005 [US1] Write Jest tests for rank/champion tag parsing in `backend/src/events/scraper.service.spec.ts`:
  - Test: tag `#13 Welterweight Division` → `rankingPosition = 13`
  - Test: tag `Title Holder` → `isChampion = true`, `rankingPosition = undefined`
  - Test: tag `Interim Title Holder` → `isChampion = true`
  - Test: no ranking tag → both fields `undefined`
  - Test: champion tag + rank tag → `isChampion = true`, `rankingPosition = undefined` (champion precedence)
  - Test: tag with extra whitespace/newlines → still parsed correctly
  - Test: `#99 Women's Strawweight Division` → `rankingPosition = 99`

### Implementation for User Story 1

- [X] T006 [US1] Implement rank/champion parsing in `scrapeFighter()` in `backend/src/events/scraper.service.ts`:
  - Iterate all `p.hero-profile__tag` elements
  - Check any tag (case-insensitive) for `"title holder"` → set `isChampion = true`
  - If not champion, find first tag matching `/^#(\d+)\s+(.+)$/` → set `rankingPosition = parseInt(match[1], 10)`
  - Add `rankingPosition` and `isChampion` to returned `ScrapedFighter` object
- [X] T007 [US1] Add `rankingPosition` and `isChampion` to the fighter upsert block in `backend/src/events/events.service.ts`:
  - `rankingPosition: fighter.rankingPosition ?? null`
  - `isChampion: fighter.isChampion ?? null`
- [X] T008 [US1] Run tests to verify all T005 tests now pass: `npm test -- --testPathPattern=scraper.service`

**Checkpoint**: Scraper correctly reads and stores rank/champion data. All backend tests pass. US1 is complete and independently verifiable.

---

## Phase 3: User Story 2 — Ranking Badge Displayed on Fight Card (Priority: P2)

**Goal**: Fight cards show a gold **C** badge for champions and a white **#N** badge for ranked fighters, inline with fighter names, on both browser and mobile layouts.

**Independent Test**: Load `/showcase` (browser) and mobile fight card with mock data containing a champion (`isChampion: true`) and a ranked fighter (`rankingPosition: 5`). Verify gold C and white #5 badges appear in the correct positions. Verify an unranked fighter shows no badge.

### Implementation for User Story 2

- [X] T009 [P] [US2] Create `RankBadge` component in `frontend/src/components/RankBadge.tsx`:
  - Props: `fighter: Fighter`
  - `fighter.isChampion` → `<span>` with gold color (`text-yellow-400`) and text `C`
  - `fighter.rankingPosition != null` → `<span>` with white color (`text-white`) and text `#N`
  - Neither → return `null` (no DOM element rendered)
  - Font: `text-[11px] font-black leading-none`
- [X] T010 [P] [US2] Add `RankBadge` to `BrowserFightCard.tsx` in `frontend/src/components/BrowserFightCard.tsx`:
  - Fighter A (left side): render `<RankBadge fighter={fight.fighterA} />` AFTER the fighter name `<p>` and AFTER the nickname `<span>` (rightmost element in the left flex row)
  - Fighter B (right side): render `<RankBadge fighter={fight.fighterB} />` BEFORE the nickname `<span>` (leftmost element in the right flex row, before nickname and name)
- [X] T011 [P] [US2] Add `RankBadge` to `MobilePicks.tsx` in `frontend/src/pages/mobile/MobilePicks.tsx`:
  - Fighter A (left side): render `<RankBadge fighter={fight.fighterA} />` AFTER the fighter name `<p>` and AFTER the nickname `<span>`
  - Fighter B (right side): render `<RankBadge fighter={fight.fighterB} />` BEFORE the nickname `<span>`
- [X] T012 [US2] Update mock data in `frontend/src/pages/FightCardShowcase.tsx` to include ranking for visual testing:
  - Add `isChampion: true` to one fighter (e.g., Jon Jones)
  - Add `rankingPosition: 3` to another fighter (e.g., Du Plessis)
  - Leave at least one fighter unranked for visual verification of the "no badge" case

**Checkpoint**: Both browser and mobile fight cards show correct ranking badges. Unranked fighters show nothing. US2 complete.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup.

- [X] T013 [P] Run full backend test suite and confirm no regressions: `npm test` from `backend/`
- [X] T014 [P] Run TypeScript type check on frontend: `npm run types` from `frontend/`
- [X] T015 Verify quickstart.md integration scenarios manually (or via scrape trigger on a known ranked fighter)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately. T001 → T002 must be sequential (push after schema edit). T003 and T004 can run in parallel after T001.
- **Phase 2 (US1)**: Depends on T001–T003. T005 (tests) must be written and FAIL before T006.
- **Phase 3 (US2)**: Depends on T001 + T004 (types). T009, T010, T011 can run in parallel. T012 after T009 is done.
- **Phase 4 (Polish)**: After all implementation tasks complete.

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 1 (schema + `ScrapedFighter` interface). Independent of US2.
- **US2 (P2)**: Depends on Phase 1 (`Fighter` frontend type). Independent of US2 completion — badge renders `null` gracefully when fields are absent.

### Within Each User Story

- T005 tests must be written and FAIL before T006 implementation
- T006 scraper logic before T007 upsert wiring (both in `events` module, safe to verify in sequence)
- T009 (RankBadge component) before T010/T011 (consume it)

### Parallel Opportunities

- T003 and T004 can run in parallel after T001
- T009, T010, T011 can all run in parallel (different files, same component dependency only at import time)
- T013 and T014 can run in parallel

---

## Parallel Example: User Story 2

```bash
# Once T009 (RankBadge.tsx) is scaffolded, launch all card updates together:
Task T010: "Add RankBadge to BrowserFightCard.tsx"
Task T011: "Add RankBadge to MobilePicks.tsx"
# Both read RankBadge but don't write to it — safe to parallelize
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (schema + types)
2. Complete Phase 2: US1 (scraping — TDD)
3. **STOP and VALIDATE**: `npm test`, check DB via Prisma Studio or admin scrape trigger
4. Deploy US1 — ranking data will be populated on next scrape cycle

### Incremental Delivery

1. Phase 1 → schema live, types updated
2. Phase 2 (US1) → scraper works, DB populated after next scrape
3. Phase 3 (US2) → badges visible on fight cards immediately using existing DB data
4. Phase 4 → clean validation pass

---

## Notes

- `npx prisma db push` must be used (not `migrate dev`) — migration history is drifted from DB state (see research.md Decision 4)
- `RankBadge` renders `null` when neither field is set — safe for all existing fight cards with no ranking data
- Champion badge shows only **C** (no rank number) per spec FR-005 and FR-010
- Badge color: champions → `text-yellow-400` (gold), ranked → `text-white`
- No new API endpoints — ranking data flows through existing fighter objects in event responses
