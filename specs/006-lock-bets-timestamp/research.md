# Research: Lock Bets by Card-Section Start Timestamp

**Feature**: 006-lock-bets-timestamp  
**Date**: 2026-02-21

---

## Decision 1: Timestamp Storage Location

**Decision**: Add `prelimsStartAt` (nullable `DateTime`) and `mainCardStartAt` (nullable `DateTime`) directly to the `Event` model in `schema.prisma`.

**Rationale**: The timestamps belong to the event-level entity (they describe when each section of a single event begins), not to individual fights. This minimises schema complexity — one nullable field per section instead of duplicating a timestamp on every fight row.

**Alternatives Considered**:
- Storing on each `Fight` row (`startAt` per fight): Rejected — redundant data duplication; every fight in the same section would store the same value.
- Separate `CardSection` join table: Rejected — over-engineering for a 2-section use case (prelims + main card).

---

## Decision 2: Scraping Strategy

**Decision**: Within the existing `scrapeNextEvent()` method, after loading the event HTML, find `#main-card .c-event-fight-card-broadcaster__time` and `#prelims-card .c-event-fight-card-broadcaster__time` using Cheerio. Extract `data-timestamp`, multiply by 1000, convert to `Date`. Attach as `mainCardStartAt` and `prelimsStartAt` on `ScrapedEvent`.

**Rationale**: The UFC page already reliably includes one such element per section (verified by user-provided HTML example). The project already uses Cheerio — no new dependency needed.

**Alternatives Considered**:
- Scraping a separate UFC API endpoint: No known public UFC API with this data; rejected.
- Cron-scheduled re-scrape close to event: Out of scope for this feature; existing scheduler is sufficient.

---

## Decision 3: Bet-Lock Logic

**Decision**: In `BetsService.placeBet()`, replace the single `now >= fight.event.date` check with a helper that picks the appropriate cutoff:

```
cutoff = isPrelim  → event.prelimsStartAt ?? event.date
cutoff = isMainCard → event.mainCardStartAt ?? event.date
fallback = event.date  (if fight has neither flag set, or field is null)
```

**Rationale**: Minimal change to existing logic; nullable fallback to `event.date` preserves backward compatibility.

**Alternatives Considered**:
- Server-sent events / websocket push to lock UI in real-time: Out of scope; the UI uses client-side timestamp comparison, server enforces via REST rejection.

---

## Decision 4: Frontend Deadline Indicator

**Decision**: `VegasFightCard` receives a new optional `lockAt` prop (`string | null`, ISO datetime). A small banner below the event-type header shows the formatted lock time, computed as `lockAt ?? null`. If `lockAt` is in the past, the component sets `locked = true` internally (overriding parent prop). Parent (`SurvivorPick`, `LeagueDashboard`, etc.) passes `lockAt` from the event's `prelimsStartAt` or `mainCardStartAt` based on `fight.isPrelim`.

**Rationale**: `VegasFightCard` already has a `locked` prop and `Lock` icon imported — the indicator slots naturally into the existing event-header section without restructuring. Client-side comparison is informational only; server enforces the actual cutoff.

**Alternatives Considered**:
- `lockAt` on `Event` type then passed through `Fight`: Rejected — simpler to derive at call-site since component already receives `fight.isPrelim`.
- Global countdown banner on the page: Rejected by user (Q1 answer — individual cards preferred).

---

## No NEEDS CLARIFICATION Items Remaining

All unknowns resolved via codebase review and clarification session.
