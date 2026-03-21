# API Contract: Fighter Ranking & Champion Status

**Feature**: 013-fighter-ranking
**Date**: 2026-03-21

---

## No New Endpoints

This feature adds no new API endpoints. Ranking and champion data flow through the existing event/fight response pipeline.

---

## Modified Response Shape: Fighter Object

All existing endpoints that return `Fighter` objects will now include the two new optional fields. The primary consumer is the fight card.

### Fighter Object (updated)

```typescript
interface Fighter {
  id: string;
  name: string;
  hometown?: string;
  wins?: number;
  losses?: number;
  draws?: number;
  noContests?: number;
  winsByKo?: number;
  winsBySub?: number;
  winsByDec?: number;
  age?: number;
  height?: string;
  weight?: string;
  reach?: string;
  stance?: string;
  sigStrikesLandedPerMin?: number;
  takedownAvg?: number;
  nickname?: string;
  imagePath?: string;
  recentForm?: { result: 'W' | 'L' | 'D' | 'NC'; method: string }[];
  // NEW FIELDS:
  rankingPosition?: number;   // absent/null for unranked and champions
  isChampion?: boolean;       // absent/null for non-champions
}
```

---

## Affected Endpoints

| Endpoint                        | Change                                |
|---------------------------------|---------------------------------------|
| `GET /events/:id`               | Fighter objects include new fields    |
| `GET /events` (list)            | Fighter objects include new fields    |
| `GET /admin/fights`             | Fighter objects include new fields    |

No request payload changes. No new parameters. Fully backward-compatible (new fields are optional).

---

## Scraper Internal Contract

The scraper's `scrapeFighter()` private method produces a `ScrapedFighter` with:

| Field             | Source                                                      | Logic                                                                          |
|-------------------|-------------------------------------------------------------|--------------------------------------------------------------------------------|
| `rankingPosition` | First `p.hero-profile__tag` matching `/^#(\d+)\s+(.+)$/`   | Extracted integer. Null if champion or no match.                               |
| `isChampion`      | Any `p.hero-profile__tag` containing `"title holder"` (case-insensitive) | True if found. Null otherwise. Champion overrides rankingPosition.   |

The `events.service.ts` upsert passes these fields as `rankingPosition: fighter.rankingPosition ?? null` and `isChampion: fighter.isChampion ?? null`.
