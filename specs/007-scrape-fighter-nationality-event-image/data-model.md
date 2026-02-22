# Data Models

## `Event`
- **Fields**:
  - `eventImg`: `String?` (Nullable) — URL of the main event hero image scraped from UFC site.

## `Fighter`
- **Fields**:
  - `hometown`: `String?` (Nullable) — The raw string scraped from the athlete's bio (e.g., "Makhachkala, Russia").

## `ScrapedEvent` (Backend Type)
- **Fields**:
  - `eventImg`: `string | undefined`
  - `fights`: Array of `ScrapedFight` (Already exists, but fighters within need updates)

## `ScrapedFighter` (Backend Type)
- **Fields**:
  - `hometown`: `string | undefined`

## `Event` and `Fighter` (Frontend Types)
- **Fields**:
  - Update `api.ts` so `Event` interface includes `eventImg?: string | null`
  - Update `api.ts` so `Fighter` interface includes `hometown?: string | null`

---
These are purely database level additions. The existing scrapers will upsert this data without requiring new dedicated relational models or join tables.
