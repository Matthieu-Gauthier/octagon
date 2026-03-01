# Phase 1: Data Model & Contracts

## Entities

### Event
Existing entity.
- **Fields impacted**: status (Enum: SCHEDULED, LIVE, COMPLETED), prelimsStartAt, maincardStartsAt
- **State Transition**: SCHEDULED -> LIVE (trigger: time >= startAt). LIVE -> COMPLETED (trigger: all nested Fights finished).

### Fight
Existing entity.
- **Fields impacted**: status (Enum: LIVE -> FINISHED), winnerId (nullable foreign key to Fighter), method (String: KO/TKO, SUB, DECISION, DRAW, NC), ound (Integer)
- **Validation Rules**: If method is DRAW or NC, winnerId MUST be null.

## Contracts

No new public APIs are required. This feature acts as an internal background worker (Cron Job). It will interact directly with the database via Prisma.

## Configuration
- Needs @nestjs/schedule configured in AppModule.
