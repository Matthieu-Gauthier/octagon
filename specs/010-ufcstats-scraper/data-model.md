# Data Model: UFCStats Live Scraper + Enrichment

**Feature**: 010-ufcstats-scraper  
**Date**: 2026-03-01

## Schema Changes (Additive Only)

Three optional fields added. All existing fields unchanged. No data loss. No migration of existing records required.

### Event

```prisma
model Event {
  id              String    @id               // UFC.com slug (unchanged)
  name            String
  date            DateTime
  location        String
  status          String
  prelimsStartAt  DateTime?
  mainCardStartAt DateTime?
  eventImg        String?

  ufcstatsId      String?                     // NEW — UFCStats hex ID e.g. "15ec018d144710db"

  fights    Fight[]

  @@map("events")
}
```

### Fighter

```prisma
model Fighter {
  id          String   @id               // UFC.com slug (unchanged) e.g. "max-holloway"
  name        String
  // ... all existing stats fields unchanged ...

  ufcstatsId  String?                    // NEW — UFCStats hex ID e.g. "150ff4cc642270b9"

  fightsA   Fight[]  @relation("FighterA")
  fightsB   Fight[]  @relation("FighterB")

  @@map("fighters")
}
```

### Fight

```prisma
model Fight {
  id          String   @id              // existing slug e.g. "max-holloway-vs-charles-oliveira"
  eventId     String
  fighterAId  String
  fighterBId  String
  // ... all existing fields unchanged ...

  ufcstatsId  String?                   // NEW — UFCStats fight hex ID e.g. "f030febede41c661"

  event    Event   @relation(...)
  fighterA Fighter @relation("FighterA", ...)
  fighterB Fighter @relation("FighterB", ...)
  bets     Bet[]
  survivorPicks SurvivorPick[]

  @@map("fights")
}
```

## Migration

```bash
cd backend
npx prisma migrate dev --name add-ufcstats-ids
```

Generated migration will contain:
```sql
ALTER TABLE "events"   ADD COLUMN "ufcstatsId" TEXT;
ALTER TABLE "fighters" ADD COLUMN "ufcstatsId" TEXT;
ALTER TABLE "fights"   ADD COLUMN "ufcstatsId" TEXT;
```

## Entity Relationships (unchanged)

No new relations. `ufcstatsId` fields are plain nullable strings — no FK constraints, no index required (used only in enrichment and live scraper internal logic, not for joins).

## State Transitions (unchanged)

```
Event: SCHEDULED → LIVE → FINISHED
Fight: SCHEDULED → FINISHED
```

The new fields do not affect state machine logic.
