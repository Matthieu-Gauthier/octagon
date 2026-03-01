# Quickstart: UFCStats Live Scraper + Enrichment

**Feature**: 010-ufcstats-scraper  
**Branch**: `010-ufcstats-scraper`

## What Changed

1. **Schema**: 3 new optional `ufcstatsId` fields on `Event`, `Fighter`, `Fight`
2. **New service**: `UfcstatsEnrichmentService` — populates `ufcstatsId` by name-matching against UFCStats
3. **Live scraper**: Now uses UFCStats as result source (instead of UFC.com)

## Setup

```bash
# 1. Apply schema migration
cd backend
npx prisma migrate dev --name add-ufcstats-ids

# 2. Generate Prisma client
npx prisma generate

# 3. Run tests
npm test
```

## How Enrichment Works

After you scrape an event from UFC.com via `POST /admin/scrape`, enrichment runs automatically:

1. Finds the matching event on UFCStats by name
2. Populates `ufcstatsId` on the DB event
3. Populates `ufcstatsId` on each fighter on the card
4. Populates `ufcstatsId` on each fight

You can verify enrichment worked by checking the DB:
```sql
SELECT id, name, "ufcstatsId" FROM events WHERE "ufcstatsId" IS NOT NULL;
SELECT id, name, "ufcstatsId" FROM fighters WHERE "ufcstatsId" IS NOT NULL LIMIT 20;
SELECT id, "ufcstatsId" FROM fights WHERE "ufcstatsId" IS NOT NULL LIMIT 20;
```

## How Live Scraper Works (Post-Change)

The cron job (`*/5 * * * *`) now:
1. Checks for LIVE events with a `ufcstatsId`
2. Fetches `http://ufcstats.com/event-details/{ufcstatsId}`
3. Matches each fight by its `fight.ufcstatsId` → `tr[data-link]`
4. Extracts method + round from row cells
5. Marks fights and events as FINISHED

If `event.ufcstatsId` is null → event is skipped with a warning log.

## Notes

- Existing UFC.com event scraper is **unchanged**
- `Fighter.id`, `Fight.id`, `Event.id` are **unchanged** (UFC.com slugs)
- Enrichment is **idempotent** — safe to run multiple times
