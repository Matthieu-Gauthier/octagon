---
description: "Task list for 010-ufcstats-scraper"
---

# Tasks: UFCStats Live Scraper + Enrichment

**Input**: `/specs/010-ufcstats-scraper/` — spec.md, plan.md, data-model.md, research.md, contracts/api.md  
**Branch**: `010-ufcstats-scraper`

**Organization**: 3 user stories → 3 implementation phases after foundation.  
**Tests**: Required by constitution (Jest). Included for all phases.

## Format: `[ID] [P?] [Story?] Description`

---

## Phase 1: Setup

**Purpose**: No code changes needed — project structure and branch already exist.

- [ ] T001 Verify branch `010-ufcstats-scraper` is checked out — run `git status` in `backend/`

---

## Phase 2: Foundational — Schema Migration

**Purpose**: Add `ufcstatsId` to all 3 models. **BLOCKS all user stories.**

- [ ] T002 Add `ufcstatsId String?` to `Event` model in `backend/prisma/schema.prisma` (after `eventImg`)
- [ ] T003 Add `ufcstatsId String?` to `Fighter` model in `backend/prisma/schema.prisma` (after `recentForm`)
- [ ] T004 Add `ufcstatsId String?` to `Fight` model in `backend/prisma/schema.prisma` (after `time`)
- [ ] T005 Run `npx prisma migrate dev --name add-ufcstats-ids` in `backend/`
- [ ] T006 Run `npx prisma generate` in `backend/` to regenerate client types

**Checkpoint**: Schema migrated — all user story work can now begin.

---

## Phase 3: User Story 1 — UFCStats Enrichment (Priority: P1) 🎯 MVP

**Goal**: After scraping an event from UFC.com, automatically populate `ufcstatsId` on the event, its fighters, and its fights by name-matching against UFCStats.

**Independent Test**: Scrape UFC 326 from UFC.com → verify `ufcstatsId` is set on the event, all fighters, and all fights in DB.

### Tests — User Story 1

- [ ] T007 [P] [US1] Create `backend/src/events/ufcstats-enrichment.service.spec.ts` with test scaffolding (module setup, mocked PrismaService, mocked fetch)
- [ ] T008 [P] [US1] Write test: `enrichEvent()` — given known event + mocked UFCStats HTML → verifies `prisma.event.update` called with correct `ufcstatsId` in `backend/src/events/ufcstats-enrichment.service.spec.ts`
- [ ] T009 [P] [US1] Write test: `enrichEvent()` — when UFCStats fetch fails → does not throw, logs error in `backend/src/events/ufcstats-enrichment.service.spec.ts`
- [ ] T010 [P] [US1] Write test: `enrichEvent()` — when fighter name has no match → skips that fighter, continues for others in `backend/src/events/ufcstats-enrichment.service.spec.ts`

### Implementation — User Story 1

- [ ] T011 [US1] Create `backend/src/events/ufcstats-enrichment.service.ts` with `@Injectable()` class `UfcstatsEnrichmentService`
- [ ] T012 [US1] Implement private `fetchHtml(url)` and `normalize(name)` helpers in `backend/src/events/ufcstats-enrichment.service.ts`
- [ ] T013 [US1] Implement private `findUfcstatsEvent(eventName)` — searches upcoming then completed UFCStats event list pages for a name match → returns `{ ufcstatsId, name } | null` in `backend/src/events/ufcstats-enrichment.service.ts`
- [ ] T014 [US1] Implement private `buildFighterMap(ufcstatsEventId)` — fetches event detail page, extracts `a[href*="/fighter-details/"]` → returns `Map<normalizedName, ufcstatsId>` in `backend/src/events/ufcstats-enrichment.service.ts`
- [ ] T015 [US1] Implement private `buildFightRows(ufcstatsEventId)` — fetches event detail page, extracts `tr[data-link*="/fight-details/"]` → returns array of `{ ufcstatsId, rowHtml }` in `backend/src/events/ufcstats-enrichment.service.ts`
- [ ] T016 [US1] Implement public `enrichEvent(eventId: string): Promise<EnrichmentResult>` — fetches event from DB with fights + fighters, calls helpers, upserts `ufcstatsId` on event/fighters/fights via Prisma, returns summary in `backend/src/events/ufcstats-enrichment.service.ts`
- [ ] T017 [US1] Add `UfcstatsEnrichmentService` to `providers` and `exports` in `backend/src/events/events.module.ts`
- [ ] T018 [US1] In `backend/src/events/events.service.ts`, inject `UfcstatsEnrichmentService` and add fire-and-forget call to `enrichEvent()` after each successful event upsert (try/catch, non-blocking)
- [ ] T019 [US1] Run tests: `npm test -- --testPathPattern=ufcstats-enrichment` in `backend/` — all must pass

**Checkpoint**: Scrape UFC 326 → DB has `ufcstatsId` on event + fighters + fights.

---

## Phase 4: User Story 2 — UFCStats Live Scraper (Priority: P1)

**Goal**: Replace UFC.com fight result scraping in the live scraper with UFCStats. Use `event.ufcstatsId` and `fight.ufcstatsId` for reliable matching.

**Independent Test**: Trigger `POST /admin/trigger-live-scraper` against a LIVE/FINISHED event that has `ufcstatsId` set → fights marked FINISHED with correct `winnerId`, `method`, `round`.

### Tests — User Story 2

- [ ] T020 [P] [US2] Update existing test `'should fetch LIVE events and attempt to scrape them'` in `backend/src/jobs/live-scraper.service.spec.ts` — event mock must include `ufcstatsId: 'mock-ufcstats-id'`, expected fetch URL = `http://ufcstats.com/event-details/mock-ufcstats-id`
- [ ] T021 [P] [US2] Write new test: when `event.ufcstatsId` is null → `fetch` is NOT called, warning is logged, no crash in `backend/src/jobs/live-scraper.service.spec.ts`
- [ ] T022 [P] [US2] Write new test: when fight row found and method/round parsed → `prisma.fight.update` called with correct `FINISHED` status, method, and round in `backend/src/jobs/live-scraper.service.spec.ts`

### Implementation — User Story 2

- [ ] T023 [US2] Update `handleLiveEvents()` `findMany` query in `backend/src/jobs/live-scraper.service.ts` to include `ufcstatsId` on event and fights (add `include: { fights: { include: { fighterA: true, fighterB: true } } }`)
- [ ] T024 [US2] Replace `scrapeLiveEvent()` body in `backend/src/jobs/live-scraper.service.ts` — if `event.ufcstatsId` is null: log warning + return early; otherwise fetch `http://ufcstats.com/event-details/{event.ufcstatsId}`
- [ ] T025 [US2] In `scrapeLiveEvent()` in `backend/src/jobs/live-scraper.service.ts`, implement fight result parsing: for each fight with `ufcstatsId`, find `tr[data-link]` where link contains `fight.ufcstatsId`, extract `cells.eq(7)` (method) and `cells.eq(8)` (round)
- [ ] T026 [US2] In `scrapeLiveEvent()` in `backend/src/jobs/live-scraper.service.ts`, implement winner resolution: find `a[href*="/fighter-details/"]` in winning row → match `ufcstatsId` fragment against `fight.fighterA.ufcstatsId` / `fight.fighterB.ufcstatsId` → resolve to DB fighter `id` (slug) for `winnerId`
- [ ] T027 [US2] In `scrapeLiveEvent()` in `backend/src/jobs/live-scraper.service.ts`, implement method text mapping: `KO/TKO` → `KO/TKO`, `SUB` → `SUB`, `U-DEC`/`S-DEC`/`M-DEC` → `DECISION`, `DRAW` → `DRAW`, `CNC` → `NC`
- [ ] T028 [US2] Preserve all SCHEDULED→LIVE→FINISHED state machine logic (event.update, allFightsFinished check, patch logic) in `backend/src/jobs/live-scraper.service.ts` — no functional change to state transitions
- [ ] T029 [US2] Run tests: `npm test -- --testPathPattern=live-scraper` in `backend/` — all must pass

**Checkpoint**: Trigger live scraper against enriched LIVE event → fight results populated from UFCStats.

---

## Phase 5: Polish & Verification

**Purpose**: Full test run + manual validation.

- [ ] T030 [P] Run full test suite `npm test` in `backend/` — all tests must pass (no regressions)
- [ ] T031 [P] Verify `debugScrape()` method in `backend/src/jobs/live-scraper.service.ts` still compiles and returns useful output (update if needed for new UFCStats structure)
- [ ] T032 Manual: scrape UFC 326 via existing endpoint → verify `event.ufcstatsId`, `fighter.ufcstatsId`, `fight.ufcstatsId` populated in DB (check via Prisma Studio or DB query)
- [ ] T033 Manual: set a LIVE event with valid `ufcstatsId` → trigger `POST /admin/trigger-live-scraper` → verify fight results pulled from UFCStats into DB
- [ ] T034 Manual: set `event.ufcstatsId = null` on a LIVE event → trigger live scraper → verify warning logged, no crash, event untouched

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** (Setup): No dependencies — start immediately
- **Phase 2** (Schema): Depends on Phase 1 — **BLOCKS all phases below**
- **Phase 3** (Enrichment Service): Depends on Phase 2
- **Phase 4** (Live Scraper): Depends on Phase 2; benefits from Phase 3 (needs enriched data to test)
- **Phase 5** (Polish): Depends on Phase 3 + 4

### Parallel Opportunities Within Phases

```bash
# Phase 3 — tests can be written in parallel with service skeleton:
T007 T008 T009 T010  ← all parallel (same file, different describes)
T011 → T012         ← sequential (helpers needed first)
T013 T014 T015      ← parallel (independent private methods)
T016 → T017 → T018  ← sequential (wiring)

# Phase 4 — tests can be written while implementation is underway:
T020 T021 T022      ← parallel (same spec file, different it blocks)
T023                ← must come first (query change)
T024 → T025 → T026 → T027 → T028  ← sequential (one method)
```

---

## Implementation Strategy

### MVP (Phases 1–3 only)

1. Phase 1 + 2: schema migration (T001–T006)
2. Phase 3: enrichment service (T007–T019)
3. **STOP + VALIDATE**: Scrape event → confirm `ufcstatsId` populated

### Full Delivery

4. Phase 4: live scraper (T020–T029)
5. Phase 5: polish + manual tests (T030–T034)
