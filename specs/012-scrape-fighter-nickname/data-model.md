# Data Model: Fighter Nickname

**Feature**: 012-scrape-fighter-nickname | **Date**: 2026-03-21

## Changes

### Backend: Prisma Schema

**File**: `backend/prisma/schema.prisma`

Add one optional field to the existing `Fighter` model:

```prisma
model Fighter {
  // ... existing fields ...
  nickname    String?   // UFC.com hero-profile__nickname, stripped of wrapper quotes
}
```

**Migration**: `npx prisma migrate dev --name add_fighter_nickname`

---

### Backend: ScrapedFighter Interface

**File**: `backend/src/events/scraper.service.ts`

```typescript
export interface ScrapedFighter {
  // ... existing fields ...
  nickname?: string;   // Optional — undefined when not present on UFC.com
}
```

---

### Frontend: Fighter Interface

**File**: `frontend/src/types/api.ts`

```typescript
export interface Fighter {
  // ... existing fields ...
  nickname?: string;   // Optional — undefined/null when fighter has no nickname
}
```

---

## Validation Rules

| Field    | Type     | Required | Constraints                          |
|----------|----------|----------|--------------------------------------|
| nickname | String?  | No       | Max ~80 chars. Null if not present. No empty strings. Stored without surrounding quotes. |

## State Transitions

Not applicable — `nickname` is a static data field updated on each scrape cycle, with no state machine.

## Entity Relationships

No new relationships. `Fighter` remains a standalone reference entity related to `Fight` via `fighterAId` / `fighterBId`.
