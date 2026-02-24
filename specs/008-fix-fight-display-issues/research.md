# Research & Technical Decisions: Fix Fight Display Issues

**Status**: Completed

## 1. Fight Order Preservation
**Context**: Fights need to be displayed in the exact order they are scraped.
**Decision**: Add an `order` (Int) field to the `Fight` Prisma model. Update `scraper.service` to assign an index-based order value during the scraping/upsert process. Modify `events.service.ts` to sort by `order: 'asc'` instead of the hardcoded `isMainEvent`/`isMainCard` multi-sort strategy.
**Rationale**: The current sorting strategy (`orderBy: [{ isMainEvent: 'desc' }, { ... }]`) artificially groups fights but leaves the actual chronological order non-deterministic for fights within the same grouping (like prelims). Since PostgreSQL doesn't guarantee insertion order retrieval without an explicit `ORDER BY`, adding a dedicated sequence field is the most robust solution.
**Alternatives**: Relying solely on data scraping order strings or timestamps if available, but a simple integer `order` index captured from the array structure of the scraped data is the most reliable.

## 2. Fighter Physical Stats
**Context**: Need to display Height, Weight, Reach, and Stance for fighters.
**Decision**: Create a new `PhysicalStatsBreakdown` (or similar) component inside `FightCard.tsx` that mirrors the styling of the existing `WinsBreakdown`. The Database `Fighter` model already stores `height`, `weight`, `reach`, and `stance` as Strings, and the API already returns them in the payload. We just need to implement the UI to render these values side-by-side.
**Rationale**: Reusing the visual language of the `WinsBreakdown` component fulfills the user's specific request for the stats to look the same. The data is already present in the data pipeline, minimizing backend impact.
**Alternatives**: Creating completely new UI treatments, rejected as user explicitly requested them to look like the win methods.

## 3. Missing Country Flags
**Context**: Some countries are missing flags in the UI. Flags need to be moved to the bottom.
**Decision**: Reposition the country flags from the central "VS Badge" to the absolute bottom of the `FightCard` container. Expand `frontend/src/lib/flags.ts` with heavily requested missing countries or implement an extended flag parsing map.
**Rationale**: Moving the flags to the bottom creates spatial room in the center of the card for the new physical stats breakdown.
**Alternatives**: Keeping flags near the names, but bottom-placement was explicitly requested.
