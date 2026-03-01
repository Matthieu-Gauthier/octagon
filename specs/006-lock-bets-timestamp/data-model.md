# Data Model: Lock Bets by Card-Section Start Timestamp

**Feature**: 006-lock-bets-timestamp  
**Date**: 2026-02-21

---

## Modified Entities

### Event (Prisma Model — `backend/prisma/schema.prisma`)

**Change**: Add two nullable DateTime fields.

```prisma
model Event {
  id              String    @id
  name            String
  date            DateTime          // general event date (unchanged)
  location        String
  status          String            // SCHEDULED, LIVE, FINISHED
  prelimsStartAt  DateTime?         // NEW: scraped from #prelims-card data-timestamp
  mainCardStartAt DateTime?         // NEW: scraped from #main-card data-timestamp
  fights          Fight[]
  @@map("events")
}
```

**Validation rules**:
- Both fields nullable — scraper may not find the element.
- If both are present: `prelimsStartAt` SHOULD be before `mainCardStartAt`. If not (bad data), log a warning; bet logic uses `event.date` as fallback.

---

### ScrapedEvent (TypeScript interface — `backend/src/events/scraper.service.ts`)

**Change**: Extend with the two new optional fields.

```typescript
export interface ScrapedEvent {
  id: string;
  name: string;
  date: Date;
  location: string;
  status: string;
  prelimsStartAt?: Date;    // NEW
  mainCardStartAt?: Date;   // NEW
}
```

---

### Event (Frontend type — `frontend/src/types/api.ts`)

**Change**: Add two optional ISO string fields to the `Event` interface.

```typescript
export interface Event {
  id: string;
  name: string;
  date: string;
  location?: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  fights?: Fight[];
  prelimsStartAt?: string | null;   // NEW
  mainCardStartAt?: string | null;  // NEW
}
```

---

## State Transitions

### Bet Placement (BetsService)

The cutoff logic changes from:

```
cutoff = event.date
```

to:

```
cutoff = fight.isPrelim
  ? (event.prelimsStartAt ?? event.date)
  : (event.mainCardStartAt ?? event.date)
```

No new status fields or state machines are required.

---

## No New Tables

No new tables, join tables, or entities are needed. All changes are additive nullable columns on the existing `Event` table.

---

## Migration

A Prisma migration adds the two columns:

```sql
ALTER TABLE events ADD COLUMN "prelimsStartAt"  TIMESTAMP(3);
ALTER TABLE events ADD COLUMN "mainCardStartAt" TIMESTAMP(3);
```

Both nullable — backward compatible; existing rows will have NULL in both columns until the next scrape run.
