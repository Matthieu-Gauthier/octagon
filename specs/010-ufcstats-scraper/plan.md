# Implementation Plan: UFCStats Live Scraper + Enrichment

**Branch**: `010-ufcstats-scraper` | **Date**: 2026-03-01 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/010-ufcstats-scraper/spec.md`

## Summary

Replace UFC.com live result scraping with UFCStats.com, and add automatic enrichment of `ufcstatsId` identifiers on Events, Fighters, and Fights after each UFC.com scrape.

PoC validated on 15 real events (PPV + Fight Nights): **Events 15/15, Fighters 380/380, Fights 190/190 — 100% match rate.**

## Technical Context

**Language/Version**: TypeScript, Node 24 (NestJS v10)  
**Primary Dependencies**: Cheerio (installed), Prisma, native `fetch`  
**Storage**: PostgreSQL — 3 nullable columns added  
**Testing**: Jest (`npm test` in `/backend`)  
**Target Platform**: Linux server (Docker)  
**Performance Goals**: Enrichment completes in <30s per event  
**Constraints**: Non-blocking enrichment, live scraper must not crash on null `ufcstatsId`  
**Scale/Scope**: ~15 fights/event, ~30 fighters/event

## Constitution Check

| Principle | Status |
|-----------|--------|
| League-centric architecture | ✅ Not affected |
| NestJS Feature Modules | ✅ New service added to `events` module |
| Mandatory Jest unit tests | ✅ New tests for enrichment + updated live scraper tests |
| Frontend unchanged | ✅ Backend only |
| Prisma for DB access | ✅ Prisma `update` used throughout |

**GATE RESULT: PASS** — No violations.

## Project Structure

```text
backend/
├── prisma/
│   └── schema.prisma                         # MODIFY: add ufcstatsId fields
├── src/
│   ├── events/
│   │   ├── events.module.ts                  # MODIFY: add UfcstatsEnrichmentService
│   │   ├── events.service.ts                 # MODIFY: call enrichment after scrape
│   │   ├── ufcstats-enrichment.service.ts    # NEW
│   │   └── ufcstats-enrichment.service.spec.ts # NEW
│   └── jobs/
│       ├── live-scraper.service.ts           # MODIFY: use UFCStats for results
│       └── live-scraper.service.spec.ts      # MODIFY: update tests

specs/010-ufcstats-scraper/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0 ✅
├── data-model.md        # Phase 1 ✅
├── quickstart.md        # Phase 1 ✅
└── contracts/
    └── api.md           # Phase 1 ✅
```

## Complexity Tracking

No constitution violations. No complexity justification required.

---

## Phase 0: Research (Complete)

See [research.md](./research.md) for full findings.

**Key decisions resolved:**

| ID | Decision |
|----|----------|
| D-001 | Fighter matching: normalized name from event page `a[href*="/fighter-details/"]` |
| D-002 | Fight matching: `tr[data-link*="/fight-details/"]` rows, match by fighter UFCStats IDs |
| D-003 | Event matching: all words of UFC.com name found in UFCStats event name |
| D-004 | Winner resolution: match `ufcstatsId` in winning row's fighter link → DB fighter slug |
| D-005 | Enrichment trigger: auto after UFC.com scrape |
| D-006 | Method mapping: `U-DEC`/`S-DEC`/`M-DEC` → `DECISION`, `CNC` → `NC`, etc. |

---

## Phase 1: Design (Complete)

### Data Model

See [data-model.md](./data-model.md).

**Migration**: `npx prisma migrate dev --name add-ufcstats-ids`

### API Contracts

See [contracts/api.md](./contracts/api.md).

**No new endpoints.** Enrichment is internal, triggered automatically.

### Implementation Order

1. **Schema** (`schema.prisma`) → migrate → generate client
2. **`UfcstatsEnrichmentService`** (`ufcstats-enrichment.service.ts`) + tests
3. **`events.service.ts`** hook → call enrichment after scrape
4. **`events.module.ts`** → wire new service
5. **`live-scraper.service.ts`** → replace UFC.com logic with UFCStats
6. **`live-scraper.service.spec.ts`** → update tests

### Key Implementation Notes

**Enrichment Service — `enrichEvent(eventId)`:**
- Fetch event from DB with `include: { fights: { include: { fighterA: true, fighterB: true } } }`
- Search UFCStats events (upcoming then completed) until name match found
- Fetch event detail page, extract `fighterMap: Map<normalizedName, ufcstatsId>`
- Per fighter: `prisma.fighter.update({ where: { id }, data: { ufcstatsId } })`
- Extract `fightRows: tr[data-link]` → for each fight, find row containing both fighter IDs → `prisma.fight.update`
- `prisma.event.update` with `ufcstatsId`
- Return `EnrichmentResult` summary

**Live Scraper — `scrapeLiveEvent()` replacement:**
- `findMany` with `include: { fights: { include: { fighterA: true, fighterB: true } } }` to get `ufcstatsId`
- If `event.ufcstatsId` null → `this.logger.warn(...)` + return
- Fetch `http://ufcstats.com/event-details/{event.ufcstatsId}`
- For each fight where `fight.ufcstatsId` is set: find `tr[data-link]` where `data-link` contains `fight.ufcstatsId`
- Extract method (`cells.eq(7)`) + round (`cells.eq(8)`)
- For winner: `cells.eq(1)` has `<a href="/fighter-details/{id}">` — the winning fighter row has a "W" indicator; match `ufcstatsId` → `fighter.id` (slug)
- All existing SCHEDULED→LIVE→FINISHED state machine logic preserved
