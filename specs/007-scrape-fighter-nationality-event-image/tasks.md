# Feature Tasks: Scrape Fighter Nationality & Event Image

## Backend Changes
- [x] Push `eventImg` to Event schema and `hometown` to Fighter schema via Prisma.
- [x] Update `ScraperService` `.c-hero__image picture img` and `<div class="c-bio__field">` logic.
- [x] Ensure `EventsService` persists the new fields during upsert.
- [x] Run `scraper.service.spec.ts`

## Frontend Changes
- [x] Add `eventImg` and `hometown` optional properties to `api.ts`.
- [x] Create `frontend/src/lib/flags.ts` to map string hometowns to country flags (like 🇺🇸).
- [x] Update `FightCard.tsx` main/co-main headers to use `eventImg` as a background.
- [x] Update `FighterPortrait.tsx` / `FightCard.tsx` to display the national flag emoji next to fighter names.
