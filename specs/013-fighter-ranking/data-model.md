# Data Model: Fighter Ranking & Champion Status

**Feature**: 013-fighter-ranking
**Date**: 2026-03-21

---

## Modified Entity: Fighter

Two optional fields are added to the existing `Fighter` model in `backend/prisma/schema.prisma`.

### New Fields

| Field             | Type      | Nullable | Description                                                              |
|-------------------|-----------|----------|--------------------------------------------------------------------------|
| `rankingPosition` | `Int?`    | Yes      | Divisional rank number (e.g. 13 for "#13 Welterweight"). Null if unranked or champion. |
| `isChampion`      | `Boolean?`| Yes      | True if fighter holds a title (including interim). Null/absent if not champion. |

### Business Rules

- `rankingPosition` is stored only if the fighter is **not** a champion.
- `isChampion = true` takes precedence: if champion tag is found, `rankingPosition` must be null.
- If neither tag is found, both fields remain null — no error, no empty string.
- Both fields update on every scrape (re-scraping overwrites previous values).

### Full Fighter Schema (after migration)

```prisma
model Fighter {
  id                     String   @id
  name                   String
  wins                   Int?
  losses                 Int?
  draws                  Int?
  noContests             Int?
  winsByKo               Int?
  winsBySub              Int?
  winsByDec              Int?
  height                 String?
  weight                 String?
  reach                  String?
  stance                 String?
  sigStrikesLandedPerMin Float?
  takedownAvg            Float?
  imagePath              String?
  hometown               String?
  recentForm             Json?
  ufcstatsId             String?
  age                    Int?
  nickname               String?
  rankingPosition        Int?
  isChampion             Boolean?
  fightsA                Fight[]  @relation("FighterA")
  fightsB                Fight[]  @relation("FighterB")

  @@map("fighters")
}
```

---

## Intermediate Scraping Type: ScrapedFighter

The `ScrapedFighter` interface in `scraper.service.ts` gains two matching optional fields:

```typescript
export interface ScrapedFighter {
  // ... existing fields ...
  rankingPosition?: number;
  isChampion?: boolean;
}
```

---

## Frontend Type: Fighter

The `Fighter` interface in `frontend/src/types/api.ts` gains two matching optional fields:

```typescript
export interface Fighter {
  // ... existing fields ...
  rankingPosition?: number;
  isChampion?: boolean;
}
```
