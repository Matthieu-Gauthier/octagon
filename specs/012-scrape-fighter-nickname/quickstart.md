# Quickstart: Fighter Nickname — Scraping & Display

**Feature**: 012-scrape-fighter-nickname | **Date**: 2026-03-21

## Implementation Steps (in order)

### Step 1 — Backend: Prisma Schema

Add `nickname String?` to the `Fighter` model in `backend/prisma/schema.prisma`.

Run:
```bash
cd backend
npx prisma migrate dev --name add_fighter_nickname
npx prisma generate
```

### Step 2 — Backend: Scraper Service

In `backend/src/events/scraper.service.ts`:

1. Add `nickname?: string` to the `ScrapedFighter` interface.
2. In `scrapeFighter()`, after scraping the name, add:
   ```typescript
   const rawNickname = $('p.hero-profile__nickname').text().trim();
   const nickname = rawNickname
     ? rawNickname.replace(/^["""\s]+|["""\s]+$/g, '') || undefined
     : undefined;
   ```
3. Include `nickname` in the returned object.

### Step 3 — Backend: Events Service Fighter Upsert

In `backend/src/events/events.service.ts`, in the `fighter.upsert` update block, add:
```typescript
nickname: fighter.nickname ?? null,
```

### Step 4 — Backend: Unit Tests

In `backend/src/events/scraper.service.spec.ts`, add tests covering:
- Fighter with nickname → nickname scraped and stripped of quotes.
- Fighter without nickname element → `undefined` returned.
- Fighter with empty nickname element → `undefined` returned (not empty string).

### Step 5 — Frontend: Type

In `frontend/src/types/api.ts`, add `nickname?: string` to the `Fighter` interface.

### Step 6 — Frontend: Browser Fight Card

In `frontend/src/components/FightCard.tsx`:

- Fighter A (left): After the `<h3>` name block, add:
  ```tsx
  {fight.fighterA.nickname && (
    <p className="text-[10px] italic uppercase text-zinc-400 tracking-wide mt-0.5">
      ({fight.fighterA.nickname})
    </p>
  )}
  ```
- Fighter B (right): Same pattern with `text-right` alignment, placed after the `<h3>`.

### Step 7 — Frontend: Mobile Fight Card

In `frontend/src/pages/mobile/MobilePicks.tsx`:

- Fighter A section (left): After the fighter last name `<p>`, add:
  ```tsx
  {fight.fighterA.nickname && (
    <p className="text-[9px] italic uppercase text-zinc-500 leading-tight">
      ({fight.fighterA.nickname})
    </p>
  )}
  ```
- Fighter B section (right): Same pattern.

## Verification

1. Trigger a scrape via the admin panel for an event with fighters known to have nicknames.
2. Check the database — `fighters.nickname` should be populated.
3. Load the fight card page on browser and mobile — nicknames appear in parentheses, uppercase, italic, below each fighter's name.
4. Fighters without nicknames show no extra UI element.
5. All Jest tests pass: `npm test -- --testPathPattern=scraper.service`.
