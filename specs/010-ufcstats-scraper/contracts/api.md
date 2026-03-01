# API Contracts: UFCStats Live Scraper + Enrichment

**Feature**: 010-ufcstats-scraper  
**Date**: 2026-03-01

## Changes to Existing Endpoints

### No new endpoints required

The enrichment is called automatically after the existing scrape endpoints. No new admin endpoints are added.

---

## Modified Endpoint Behavior

### `POST /admin/trigger-live-scraper`

**Unchanged signature.** Internal behavior changed:

| Before | After |
|--------|-------|
| Fetches `https://www.ufc.com/event/{id}` | Fetches `http://ufcstats.com/event-details/{ufcstatsId}` |
| Matches fights by fighter slug | Matches fights by `fight.ufcstatsId` via `tr[data-link]` |
| Falls back to name-based slug extraction | Skips + warns if `event.ufcstatsId` is null |

**Request**: `POST /admin/trigger-live-scraper`  
**Response**: `{ success: true }` (unchanged)

---

### `POST /admin/scrape` (or existing events scrape endpoint)

**Unchanged signature.** New side-effect: after successful scrape, enrichment is called automatically for the event.

---

## Internal Service Interfaces

### `UfcstatsEnrichmentService.enrichEvent(eventId: string): Promise<EnrichmentResult>`

```typescript
interface EnrichmentResult {
  eventId: string;
  eventMatched: boolean;
  ufcstatsEventId: string | null;
  fightersEnriched: number;
  fightersMissed: number;
  fightsEnriched: number;
  fightsMissed: number;
}
```

Called internally — not exposed via HTTP.

---

## Database Schema Changes

See [data-model.md](../data-model.md) for full migration details.

| Table | New Column | Type |
|-------|-----------|------|
| `events` | `ufcstatsId` | `TEXT NULL` |
| `fighters` | `ufcstatsId` | `TEXT NULL` |
| `fights` | `ufcstatsId` | `TEXT NULL` |
