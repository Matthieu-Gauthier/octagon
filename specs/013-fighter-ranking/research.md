# Research: Fighter Ranking & Champion Status

**Feature**: 013-fighter-ranking
**Date**: 2026-03-21

---

## Decision 1: HTML selector for ranking tag

**Decision**: Use `p.hero-profile__tag` selector, iterate all matches, take the first whose trimmed text matches `/^#(\d+)\s+(.+)$/`.

**Rationale**: UFC.com fighter profile pages consistently use `p.hero-profile__tag` for all contextual labels (division, rank, champion status). Cheerio already loads the page HTML in `scrapeFighter()` — no extra network request needed.

**Alternatives considered**:
- Scraping the UFC rankings page separately → rejected (extra HTTP request, more fragile, violates FR-007).
- CSS attribute selectors → not applicable since tag text is dynamic.

---

## Decision 2: Champion detection pattern

**Decision**: For each `.hero-profile__tag` element, check if its text (lowercased, trimmed) contains `"title holder"`. This covers both "Title Holder" and "Interim Title Holder" as required.

**Rationale**: Case-insensitive substring match is the most robust approach against whitespace/newline noise. The spec explicitly requires "Interim Title Holder" to be treated identically to "Title Holder".

**Alternatives considered**:
- Exact match → fragile against whitespace or interim prefix.
- Separate regex for interim → unnecessary given substring approach.

---

## Decision 3: Champion takes precedence over rank

**Decision**: When both a "Title Holder" tag and a rank tag are present, set `isChampion = true` and `rankingPosition = undefined` (null in DB).

**Rationale**: Per spec FR-004 and edge case "Champion with rank tag" — champion status is the source of truth, no rank number stored.

**Alternatives considered**:
- Store both → spec explicitly forbids it.

---

## Decision 4: Database field addition strategy

**Decision**: Use `npx prisma db push` (not `prisma migrate dev`) to apply the two new optional fields to the `Fighter` model.

**Rationale**: The project's migration history has drifted from the live database state (established in feature 012). `db push` safely applies schema changes without creating migration files that would conflict.

**Alternatives considered**:
- `prisma migrate dev` → will fail due to schema drift (proven in feature 012).
- Manual SQL migration → bypasses Prisma safety checks.

---

## Decision 5: No new API endpoint

**Decision**: The existing `GET /events/:id` endpoint already returns full fighter objects. Adding `rankingPosition` and `isChampion` to the Fighter model means they are automatically included in all existing fight card responses.

**Rationale**: The fighter data is embedded in Fight objects returned by event endpoints. No new endpoint, no breaking change.

**Alternatives considered**:
- `GET /fighters/:id` dedicated endpoint → unnecessary for this feature scope.

---

## Decision 6: Frontend badge placement

**Decision**: Render a `RankBadge` inline component after the fighter name (for fighter A / left side) and before the fighter name (for fighter B / right side), consistent with nickname placement already in `BrowserFightCard.tsx` and `MobilePicks.tsx`.

**Rationale**: Mirrors the existing nickname pattern. Gold `C` for champions, white `#N` for ranked, nothing for unranked. The badge is a small pill/text element, not a separate row.

**Alternatives considered**:
- Separate row below name → rejected per FR-012 (must be inline).
- Tooltip/hover only → not visible enough for the use case.
