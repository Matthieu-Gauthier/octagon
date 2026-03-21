# Tasks: Fighter Nickname — Scraping & Display

**Input**: Design documents from `/specs/012-scrape-fighter-nickname/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Backend unit tests (Jest) are **REQUIRED** per constitution — `scraper.service.spec.ts` must cover success, absence, and edge cases for nickname extraction.

**Organization**: Tasks grouped by user story to enable independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup — No-op

This feature is purely additive to an existing project. No new project structure, packages, or configuration needed. Proceed directly to Phase 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema and type changes that both user stories depend on.

**⚠️ CRITICAL**: Phase 3 and Phase 4 cannot begin until this phase is complete.

- [x] T001 Add `nickname String?` field to the `Fighter` model in `backend/prisma/schema.prisma`
- [x] T002 Run migration and regenerate Prisma client: `npx prisma migrate dev --name add_fighter_nickname && npx prisma generate` (in `backend/`)
- [x] T003 Add `nickname?: string` to the `Fighter` interface in `frontend/src/types/api.ts`

**Checkpoint**: Database schema updated, Prisma client regenerated, frontend type extended — ready for both stories.

---

## Phase 3: User Story 1 — Nickname Captured During Scrape (Priority: P1) 🎯 MVP

**Goal**: Scrape the fighter nickname from `p.hero-profile__nickname` on UFC.com profile pages, strip surrounding typographic quotes, and persist it in the database.

**Independent Test**: Trigger a scrape via admin for a fighter with a known nickname (e.g., Conor McGregor). Verify `fighters.nickname` is populated in the database with the correct value. Verify fighters without a nickname element have `null`.

### Tests for User Story 1 ⚠️

> **Write these tests FIRST — ensure they FAIL before implementing the scraper change.**

- [x] T004 [US1] Add unit tests for `scrapeFighter()` nickname extraction to `backend/src/events/scraper.service.spec.ts`:
  - Test: fighter profile HTML with `p.hero-profile__nickname` containing `"The Machine"` → `nickname` is `The Machine` (quotes stripped)
  - Test: fighter profile HTML with no `p.hero-profile__nickname` element → `nickname` is `undefined`
  - Test: fighter profile HTML with an empty `p.hero-profile__nickname` element → `nickname` is `undefined` (not empty string)
  - Test: nickname with plain ASCII quotes `"The Notorious"` → quotes stripped correctly

### Implementation for User Story 1

- [x] T005 [US1] Add `nickname?: string` to the `ScrapedFighter` interface in `backend/src/events/scraper.service.ts`
- [x] T006 [US1] In `scrapeFighter()` in `backend/src/events/scraper.service.ts`, scrape nickname after the name extraction:
  ```typescript
  const rawNickname = $('p.hero-profile__nickname').text().trim();
  const nickname = rawNickname
    ? rawNickname.replace(/^["""\s]+|["""\s]+$/g, '') || undefined
    : undefined;
  ```
  Include `nickname` in the returned `ScrapedFighter` object.
- [x] T007 [US1] Add `nickname: fighter.nickname ?? null` to the `update` block of the `fighter.upsert()` call in `backend/src/events/events.service.ts`

**Checkpoint**: Run `npm test -- --testPathPattern=scraper.service` in `backend/`. All new tests pass. Scrape an event — fighters with nicknames have them stored; fighters without have `null`.

---

## Phase 4: User Story 2 — Nickname Displayed on Fight Card (Priority: P2)

**Goal**: Show each fighter's nickname (when available) adjacent to their name on the fight card — uppercase, italic, in parentheses — in both the browser and mobile layouts.

**Independent Test**: Open a fight card with fighters that have known nicknames. Verify nickname appears as `(THE NOTORIOUS)` in uppercase italic next to the correct fighter's name on both desktop and mobile. Verify fighters without nicknames show no extra element.

### Implementation for User Story 2

- [x] T008 [P] [US2] In `frontend/src/components/FightCard.tsx`, add nickname display for Fighter A (left side) — after the `<h3>` name block inside the Fighter A `FighterPortrait` children:
  ```tsx
  {fight.fighterA.nickname && (
    <p className="text-[10px] italic uppercase text-zinc-400 tracking-wide mt-0.5">
      ({fight.fighterA.nickname})
    </p>
  )}
  ```
- [x] T009 [P] [US2] In `frontend/src/components/FightCard.tsx`, add nickname display for Fighter B (right side) — after the `<h3>` name block inside the Fighter B `FighterPortrait` children, with right alignment:
  ```tsx
  {fight.fighterB.nickname && (
    <p className="text-[10px] italic uppercase text-zinc-400 tracking-wide mt-0.5 text-right">
      ({fight.fighterB.nickname})
    </p>
  )}
  ```
- [x] T010 [P] [US2] In `frontend/src/pages/mobile/MobilePicks.tsx`, add nickname display for Fighter A in the fighter names + records section (left side), below the fighter last name `<p>`:
  ```tsx
  {fight.fighterA.nickname && (
    <p className="text-[9px] italic uppercase text-zinc-500 leading-tight mt-0.5">
      ({fight.fighterA.nickname})
    </p>
  )}
  ```
- [x] T011 [P] [US2] In `frontend/src/pages/mobile/MobilePicks.tsx`, add nickname display for Fighter B (right side), below the fighter last name `<p>`:
  ```tsx
  {fight.fighterB.nickname && (
    <p className="text-[9px] italic uppercase text-zinc-500 leading-tight mt-0.5">
      ({fight.fighterB.nickname})
    </p>
  )}
  ```

**Checkpoint**: Both mobile and browser fight card views show nicknames correctly positioned and styled. Fighters without nicknames show no extra whitespace or empty elements.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T012 [P] Run TypeScript type checks in both workspaces: `cd backend && npm run types` and `cd frontend && npm run types` — no new errors
- [x] T013 Run full backend test suite: `cd backend && npm test` — all tests pass
- [ ] T014 Verify quickstart.md steps manually: trigger a scrape, confirm database, confirm UI on both browser and mobile

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies — start immediately
- **Phase 3 (US1)**: Requires Phase 2 complete (Prisma schema must be migrated)
- **Phase 4 (US2)**: Requires Phase 2 complete (frontend `Fighter` type must have `nickname`)
  - Phase 4 can run **in parallel with Phase 3** — frontend display only needs the type, not the live scraper
- **Phase 5 (Polish)**: Requires Phases 3 and 4 complete

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2. No dependency on US2.
- **US2 (P2)**: Depends on Phase 2 (type). No dependency on US1 — can be developed in parallel using fixture data.

### Within Each User Story

- US1: Write tests (T004) → Add interface field (T005) → Implement scraping (T006) → Update upsert (T007)
- US2: All four UI tasks (T008–T011) are fully parallel — different files, no shared state

---

## Parallel Example: User Story 2

```bash
# All four UI tasks can run in parallel (each touches a different fighter/layout):
Task T008: FightCard.tsx — Fighter A nickname (browser)
Task T009: FightCard.tsx — Fighter B nickname (browser)
Task T010: MobilePicks.tsx — Fighter A nickname (mobile)
Task T011: MobilePicks.tsx — Fighter B nickname (mobile)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Schema migration + type update
2. Complete Phase 3: Scraper + upsert + tests
3. **STOP and VALIDATE**: Run scraper, check database — nicknames stored
4. Ship backend — nickname available in API responses

### Incremental Delivery

1. Phase 2 → Database ready, type ready
2. Phase 3 (US1) → Scraping works, API returns nickname
3. Phase 4 (US2) → UI displays nickname on both layouts
4. Phase 5 → Type-check and full test pass

### Parallel Team Strategy

With two developers after Phase 2:
- **Developer A**: Phase 3 (backend scraping + tests)
- **Developer B**: Phase 4 (frontend display — can use hardcoded fixture nickname to develop/test UI without waiting for real scrape)

---

## Notes

- T008 and T009 both touch `FightCard.tsx` — they should be done sequentially or carefully merged if parallelized
- T004 tests must fail before T005–T007 are implemented (TDD requirement per constitution)
- Quote stripping regex handles: `"` (left double quote U+201C), `"` (right double quote U+201D), `"` (ASCII double quote U+0022)
- The `create: fighter` shorthand in `events.service.ts` will automatically include `nickname` once it exists on the `ScrapedFighter` object — only the `update` block needs an explicit addition (T007)
