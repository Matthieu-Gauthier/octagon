# Implementation Plan: Fighter Nickname — Scraping & Display

**Branch**: `012-scrape-fighter-nickname` | **Date**: 2026-03-21 | **Spec**: [spec.md](./spec.md)

## Summary

Add an optional `nickname` field to the Fighter data model, scrape it from the `p.hero-profile__nickname` element on UFC.com fighter profile pages, and display it in the fight card UI (browser `FightCard.tsx` and mobile `MobilePicks.tsx`) as an uppercase italic label in parentheses, positioned adjacent to each fighter's name.

## Technical Context

**Language/Version**: TypeScript (Node 20 backend, React 18 frontend)
**Backend**: NestJS — `events/scraper.service.ts` handles all UFC.com scraping via Cheerio. Fighter upserts happen in `events/events.service.ts`.
**Frontend**: React (Vite) + Tailwind CSS. Fighter names rendered in `FightCard.tsx` (browser) and `MobilePicks.tsx` (mobile).
**ORM / Database**: Prisma + PostgreSQL. Schema in `backend/prisma/schema.prisma`. Migrations via `npx prisma migrate dev`.
**Auth**: Not applicable — fighter data is read-only and flows through existing authenticated endpoints.
**Testing**: Jest (backend unit tests required). Test files co-located as `*.spec.ts`.
**Project Type**: Web app (monorepo — `backend/` + `frontend/`)
**Scale/Scope**: Small friend groups. No high-throughput requirements.
**Constraints**: All scoring and data scoped to `leagueId`; fighter model is shared/global (not league-scoped).

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| League-Centric Architecture | ✅ Pass | Fighter data is shared reference data, not league-scoped. No violation. |
| Backend Architecture (NestJS + Prisma) | ✅ Pass | Additive change to existing `Fighter` model and scraper service. |
| Mandatory Unit Testing (Jest) | ✅ Pass | Scraper nickname extraction logic must have a unit test. |
| Frontend Standards | ✅ Pass | Tailwind CSS, TypeScript, dark-mode-first; UI text is English. |
| Gameplay Mechanics | ✅ Pass | No impact on betting, scoring, or atouts. |

No violations. No complexity justification required.

## Project Structure

### Documentation (this feature)

```text
specs/012-scrape-fighter-nickname/
├── plan.md              ← this file
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

### Source Code (affected files)

```text
backend/
├── prisma/
│   └── schema.prisma                          ← add nickname field to Fighter model
├── src/
│   └── events/
│       ├── scraper.service.ts                 ← add nickname scraping + ScrapedFighter.nickname
│       ├── scraper.service.spec.ts            ← unit tests for nickname extraction
│       └── events.service.ts                  ← include nickname in fighter upsert

frontend/
└── src/
    ├── types/
    │   └── api.ts                             ← add nickname?: string to Fighter interface
    ├── components/
    │   └── FightCard.tsx                      ← display nickname in browser fight card
    └── pages/
        └── mobile/
            └── MobilePicks.tsx                ← display nickname in mobile fight card
```

---

## Phase 0: Research

### Decision 1: HTML selector for nickname

- **Decision**: Use `p.hero-profile__nickname` (confirmed by user from live UFC.com HTML).
- **Rationale**: Directly provided by the user. Matches the existing pattern of `h1.hero-profile__name` already used in the scraper.
- **Alternatives considered**: None needed — selector is explicitly specified.

### Decision 2: Handling wrapper quotes

- **Decision**: Strip leading/trailing typographic quotes (`"` / `"` / `"`) and regular ASCII double-quotes from the scraped text before storing.
- **Rationale**: The UFC.com nickname element wraps the nickname in display quotes (e.g., `"The Machine"`). The stored value should be the plain nickname text only.
- **Implementation**: After `.text().trim()`, apply a regex replace: `replace(/^["""\s]+|["""\s]+$/g, '')`.
- **Alternatives considered**: Store as-is — rejected because it pollutes the data and complicates display.

### Decision 3: Nickname placement in the UI

- **Decision**: Nickname displayed on a **separate line below the fighter name**, in parentheses, uppercase, italic, at a smaller font size.
- **Rationale**: The fighter name in both `FightCard.tsx` and `MobilePicks.tsx` is rendered word-by-word across multiple `<span>` blocks or in a single `<p>`. Placing the nickname inline within the same element would require restructuring the name layout. Placing it on a line below is simpler, visually clean, and consistent across both layouts.
- **Alternatives considered**: Inline next to last word of name — rejected because name is rendered as stacked word spans; inline placement is fragile.

### Decision 4: Nickname null/undefined storage

- **Decision**: When no nickname element is found or it is empty after stripping, store `null` in the database (not empty string). The Prisma field will be `String?` (nullable).
- **Rationale**: Matches FR-003. Null is the canonical "not set" value in Prisma nullable fields.

---

## Phase 1: Design & Contracts

### Data Model Changes

See `data-model.md`.

### API Contracts

Fighter data flows through the existing `GET /events/:id` endpoint which returns fights with embedded `fighterA` / `fighterB` objects. No new endpoints are needed — the `nickname` field is additive to the existing fighter serialization.

See `contracts/fighter-nickname.md` for the updated Fighter response shape.

### Agent Context

Run: `.specify/scripts/bash/update-agent-context.sh claude`
