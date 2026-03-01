# Feature Specification: UFCStats Live Scraper + Enrichment

**Feature Branch**: `010-ufcstats-scraper`  
**Created**: 2026-03-01  
**Status**: Clarified — Ready for Planning  

## Context & Background

The existing live scraper (`live-scraper.service.ts`) fetches fight results from `ufc.com` during event nights. This has become unreliable due to HTML structure changes and anti-scraping measures. `ufcstats.com` provides the same data through a much simpler, stable HTML structure.

This feature has two deliverables:

1. **Modify the existing live scraper** to fetch fight results from `ufcstats.com` instead of `ufc.com`
2. **Add an enrichment method** that populates `ufcstatsId` fields (Event, Fight, Fighter) by matching existing records against UFCStats by name

A schema migration adds optional `ufcstatsId` fields to the three affected models. All existing fields, IDs, and business logic remain unchanged.

**Validated PoC (2026-03-01)**: Matching strategy tested across 15 events (PPV + Fight Nights, upcoming + completed) — **Events 15/15, Fighters 380/380, Fights 190/190. 100% success rate.**

---

## Clarifications

### Session 2026-03-01

- Q: What should be used as the Fighter `id` (primary key)? → A: Keep existing UFC.com slug (`max-holloway`). Add `ufcstatsId` as secondary optional field.
- Q: What should be used as the Event `id` (primary key)? → A: Keep UFC.com slug. Add `ufcstatsId` as secondary optional field.
- Q: How should `prelimsStartAt`/`mainCardStartAt` be handled? → A: Unchanged — still provided by the existing UFC.com event scraper.
- Q: When should enrichment be triggered? → A: Automatically after each successful UFC.com event scrape.
- Q: Should a full second scraper be built? → A: No. Only: (1) modify existing live scraper to use UFCStats, (2) add enrichment method.

---

## Deliverables

### 1. Schema Migration
Add optional `ufcstatsId: String?` field to:
- `Event` model
- `Fight` model
- `Fighter` model

### 2. UFCStats Enrichment Method
A new method (exposed via admin API endpoint) that, given an event ID already in the database:
- Matches the Event to UFCStats by event name → populates `event.ufcstatsId`
- Matches each Fight's two fighters by name → populates `fighter.ufcstatsId` for each
- Matches each Fight by the pair of fighter UFCStats IDs (via `tr[data-link]` on the event page) → populates `fight.ufcstatsId`
- Runs automatically after each successful UFC.com event scrape
- Is idempotent (safe to re-run)
- Skips and logs a warning for any unmatched record without failing the entire operation

### 3. Modified Live Scraper
Replace the UFC.com result-fetching logic in `live-scraper.service.ts`:
- Uses `event.ufcstatsId` to locate the corresponding UFCStats event page
- Matches DB fights to UFCStats fight rows using `fight.ufcstatsId`  
- Extracts: winner (by `fighter.ufcstatsId` → DB fighter ID), method, round
- If `event.ufcstatsId` is null, falls back to the existing UFC.com scraping logic
- All SCHEDULED → LIVE → FINISHED state machine logic is preserved unchanged

---

## User Scenarios & Testing

### Scenario 1 — Enrichment after UFC.com scrape (P1)
**Given** an event was just scraped from UFC.com and exists in the DB,  
**When** the enrichment runs automatically,  
**Then** `ufcstatsId` is populated on the event, all its fighters, and all its fights.

### Scenario 2 — Live scraper uses UFCStats (P1)
**Given** a LIVE event has a `ufcstatsId`,  
**When** the live scraper polls and a fight result appears on UFCStats,  
**Then** the fight is marked FINISHED with correct `winnerId`, `method`, and `round`.

### Scenario 3 — Fallback when ufcstatsId is missing (P2)
**Given** an event has no `ufcstatsId` (enrichment not yet run or failed),  
**When** the live scraper polls,  
**Then** it falls back to UFC.com scraping (existing behavior, unchanged).

---

## Edge Cases

- Fighter name on UFCStats slightly differs from UFC.com slug (handled by word-overlap normalization)
- Enrichment runs on an event that already has `ufcstatsId` set (idempotent upsert, no-op)
- UFCStats is unreachable during a live event (live scraper logs error and skips that poll cycle)
- A fight has no `ufcstatsId` when the live scraper runs (fight is skipped, warning logged)

---

## Success Criteria

- **SC-001**: After enrichment, 100% of events, fighters, and fights that exist on UFCStats have their `ufcstatsId` populated.
- **SC-002**: The live scraper correctly records fight results (winner, method, round) from UFCStats within 2 polling cycles (~10 min) of them appearing on the site.
- **SC-003**: When `ufcstatsId` is absent, existing UFC.com live scraper behavior is preserved exactly.
- **SC-004**: No existing features (bets, standings, fighter display, event display) are affected by the schema additions.
