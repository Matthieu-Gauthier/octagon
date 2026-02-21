# Quickstart: Lock Bets by Card-Section Start Timestamp

**Feature**: 006-lock-bets-timestamp  
**Date**: 2026-02-21

---

## Overview

This feature adds per-card-section bet locking. Bets on prelim fights lock at the prelim start time; bets on main card fights lock at the main card start time. A UI indicator on each fight card shows the upcoming deadline.

---

## Implementation Order

Follow this order to avoid breaking the app mid-implementation:

```
1. Backend schema (Prisma migration)
2. Backend scraper (extract timestamps)
3. Backend bet logic (use per-section cutoff)
4. Backend tests (Jest)
5. Frontend types (Event interface)
6. Frontend fight card UI (lockAt prop + deadline indicator)
```

---

## Step 1 — Prisma Schema Migration

**File**: `backend/prisma/schema.prisma`

Add two nullable fields to `model Event`:
```prisma
prelimsStartAt  DateTime?
mainCardStartAt DateTime?
```

Then run:
```bash
cd backend
npx prisma migrate dev --name add-card-section-timestamps
npx prisma generate
```

---

## Step 2 — Scraper: Extract Timestamps

**File**: `backend/src/events/scraper.service.ts`

1. In `ScrapedEvent` interface, add: `prelimsStartAt?: Date; mainCardStartAt?: Date;`
2. In `scrapeNextEvent()`, after loading `eventDetailHtml`, extract:

```typescript
const extractSectionTimestamp = ($: CheerioAPI, sectionId: string): Date | undefined => {
  const ts = $(`${sectionId} .c-event-fight-card-broadcaster__time`).first().attr('data-timestamp');
  return ts ? new Date(parseInt(ts) * 1000) : undefined;
};

const prelimsStartAt  = extractSectionTimestamp($ev, '#prelims-card');
const mainCardStartAt = extractSectionTimestamp($ev, '#main-card');
```

3. Include these on the returned `ScrapedEvent` object.

---

## Step 3 — EventsService: Pass Timestamps to DB

**File**: `backend/src/events/events.service.ts`

In `fetchNextEvent()`, update the event upsert to include the new fields:
```typescript
update: { ..., prelimsStartAt: event.prelimsStartAt, mainCardStartAt: event.mainCardStartAt },
create: event,
```

---

## Step 4 — BetsService: Per-Section Lock Logic

**File**: `backend/src/bets/bets.service.ts`

In `placeBet()`, replace:
```typescript
if (now >= fight.event.date) { throw ... }
```
with:
```typescript
const cutoff = fight.isPrelim
  ? (fight.event.prelimsStartAt ?? fight.event.date)
  : (fight.event.mainCardStartAt ?? fight.event.date);

if (now >= cutoff) {
  const section = fight.isPrelim ? 'preliminary card' : 'main card';
  throw new BadRequestException(`Betting is closed for ${section} fights`);
}
```

Also update the `include` in `findUnique` to include the new fields (Prisma client auto-exposes them — no explicit change needed unless selecting specific fields).

---

## Step 5 — Frontend Types

**File**: `frontend/src/types/api.ts`

Add to `Event` interface:
```typescript
prelimsStartAt?: string | null;
mainCardStartAt?: string | null;
```

---

## Step 6 — Frontend: Fight Card Deadline Indicator

**File**: `frontend/src/components/FightCard.tsx`

1. Add prop `lockAt?: string | null` to `VegasFightCardProps`.
2. Derive `isLocked` client-side:
```typescript
const isLocked = locked || (!!lockAt && new Date() >= new Date(lockAt));
```
3. Add a small deadline banner below the event-type header (before the Fighters Area), shown when `lockAt` is set:
```tsx
{lockAt && (
  <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-zinc-900/80 border-b border-zinc-800 text-[10px] text-zinc-400">
    <Lock className="h-2.5 w-2.5" />
    {isLocked
      ? <span className="text-red-400 font-bold uppercase tracking-wider">Bets locked</span>
      : <span>Bets lock: <span className="text-zinc-200 font-bold">{new Date(lockAt).toLocaleString()}</span></span>
    }
  </div>
)}
```
4. Pass `locked={isLocked}` instead of the raw `locked` prop internally.

**Where to pass `lockAt`**: In the parent component (e.g., `SurvivorPick`, `LeagueDashboard`), derive:
```tsx
const lockAt = fight.isPrelim
  ? event.prelimsStartAt
  : event.mainCardStartAt;

<VegasFightCard fight={fight} lockAt={lockAt} ... />
```

---

## Running Tests

```bash
cd backend
npm run test -- --testPathPattern=bets.service.spec
npm run test -- --testPathPattern=scraper.service.spec
```

All existing tests must remain green. New tests for the per-section lock logic should be added to `bets.service.spec.ts`.
