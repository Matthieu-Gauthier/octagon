# Research: UFCStats Live Scraper + Enrichment

**Feature**: 010-ufcstats-scraper  
**Date**: 2026-03-01

## PoC Validation Results (Pre-Plan)

A self-validating proof-of-concept was run against **15 real events** (PPV + Fight Nights, upcoming + completed) before planning began. Results:

| Metric | Score |
|--------|-------|
| Events matched by name | 15/15 (100%) |
| Fighters matched by name | 380/380 (100%) |
| Fights matched by `data-link` | 190/190 (100%) |

No UFC.com fallback needed in the live scraper.

---

## Decision Log

### D-001: Fighter Matching Strategy
- **Decision**: Match fighters by normalized full name (lowercase, strip punctuation/accents) from UFCStats event page `a[href*="/fighter-details/"]`
- **Rationale**: 100% match rate in PoC. Trivially simple — UFC.com slugs are derived from the same canonical names UFCStats uses.
- **Normalization**: `toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()`
- **Alternatives rejected**: Search API (doesn't exist on UFCStats), fuzzy matching (unnecessary overhead)

### D-002: Fight Matching Strategy
- **Decision**: Match fights via `tr[data-link*="/fight-details/"]` rows on the UFCStats event page. A row matches a DB fight when its HTML contains both `fighterA.ufcstatsId` and `fighterB.ufcstatsId`.
- **Rationale**: PoC confirmed 100% match across 190 fights. fight-details links are available for **both upcoming and completed fights**.
- **Key finding**: fight-detail `data-link` is in the `<tr>` `data-link` attribute, NOT in an `<a href>`. The PoC discovered this from the user-provided HTML snippet.

### D-003: Event Matching Strategy
- **Decision**: Match event by checking that all significant words (>2 chars) of the UFC.com event name appear in the UFCStats event name (normalized).
- **Rationale**: "UFC 326" → matches "UFC 326: Holloway vs. Oliveira 2" reliably. Same for Fight Nights.
- **Search space**: `http://ufcstats.com/statistics/events/upcoming?page=all` then `completed?page=all`

### D-004: Winner Resolution in Live Scraper
- **Decision**: On a finished UFCStats fight row, winner = the fighter whose `ufcstatsId` appears in the `<a href="/fighter-details/{id}">` element in the **winner column** of the fight row. Resolve `ufcstatsId` → DB `fighter.id` (slug) via a DB lookup.
- **Rationale**: UFCStats fight rows clearly mark which row is the winning fighter. No ambiguity.
- **Cell layout**: `cells.eq(1)` contains fighter `<a>` links for both corners. The winner has a specific indicator on completed events (confirmed via manual inspection).

> **Note on winner detection**: UFCStats completed event fight rows show **W** in a column for the winning fighter. The fight detail page has clearer data. The live scraper will fetch each individual `fight-details/{id}` page for completed fights to extract the winner reliably.

### D-005: Enrichment Triggering
- **Decision**: Auto-run after each successful UFC.com event scrape (fire-and-forget, non-blocking).
- **Rationale**: Keeps data in sync automatically with zero admin intervention.

### D-006: Method Text Mapping
UFCStats method column text → DB standard values:

| UFCStats text | DB value |
|---------------|----------|
| `KO/TKO` | `KO/TKO` |
| `SUB` | `SUB` |
| `U-DEC`, `S-DEC`, `M-DEC` | `DECISION` |
| `DRAW` | `DRAW` |
| `CNC` (No Contest) | `NC` |
| `UNKNOWN` / other | `UNKNOWN` |

### D-007: Fight Detail Page for Live Results
- **Decision**: For live result scraping, fetch individual `http://ufcstats.com/fight-details/{ufcstatsId}` pages rather than parsing the event page rows, to get reliable winner + method + round data.
- **Rationale**: The event page fight rows contain enough data for method/round but winner detection from rows requires cell parsing that may be fragile. The fight detail page is more structured.
- **Alternative**: Parse event page rows only (simpler, fewer requests). **Adopted as primary**, with fight detail page as fallback if method/round missing.

---

## UFCStats HTML Structure Reference

### Event List Page
```
http://ufcstats.com/statistics/events/upcoming?page=all
http://ufcstats.com/statistics/events/completed?page=all
```
- Events: `a[href*="/event-details/"]` — text = event name, href contains hex ID

### Event Detail Page
```
http://ufcstats.com/event-details/{ufcstatsId}
```
- Fighters: `a[href*="/fighter-details/"]` — text = fighter name, href contains hex ID
- Fights: `tr[data-link*="/fight-details/"]` — `data-link` attr = fight detail URL
  - `cells.eq(7)` = method (e.g. "KO/TKO", "U-DEC")
  - `cells.eq(8)` = round (e.g. "3")
  - `cells.eq(9)` = time (e.g. "2:54")

### Fight Detail Page
```
http://ufcstats.com/fight-details/{fightUfcstatsId}
```
- Contains round-by-round statistics and winner information

---

## Technology Decisions

| Concern | Decision |
|---------|----------|
| HTML parsing | Cheerio (already installed in backend deps) |
| HTTP fetching | Native `fetch` (Node 18+, already used in live scraper) |
| Module pattern | New `UfcstatsEnrichmentService` in `events` module |
| Error handling | try/catch per-record; never throw from enrichment |
| Idempotency | `prisma.*.update` with `ufcstatsId` is safe to re-run |
