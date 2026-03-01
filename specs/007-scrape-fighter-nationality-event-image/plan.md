# Implementation Plan: Scrape Fighter Nationality & Event Image

**Branch**: `007-scrape-fighter-nationality-event-image` | **Date**: 2026-02-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-scrape-fighter-nationality-event-image/spec.md`

## Summary

The goal is to scrape and store two new pieces of visual data from the UFC website:
1. The **Fighter Hometown** to map to a nationality/flag for display on the `FightCard`.
2. The **Event Hero Image** (`c-hero__image`) to display as a background on the Event title card.

This requires updates to the Prisma schema, the `ScraperService`, and multiple frontend React components.

## Technical Context

**Language/Version**: TypeScript / Node.js
**Primary Dependencies**: NestJS (Backend), Prisma (Database), Playwright/Cheerio (Scraping), Vite/React (Frontend)
**Storage**: PostgreSQL
**Testing**: Jest
**Target Platform**: Web application (Vite Frontend + NestJS backend)
**Project Type**: Monorepo-style split (frontend / backend)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Backend Architecture (NestJS + Postgres)**: Checked. We will modify the existing `events` module and Prisma schema.
- **Mandatory Unit Testing (Jest)**: Checked. `scraper.service.spec.ts` will need updates to verify the extraction of the new fields.
- **Iterative Workflow (Spec-Kit)**: Checked. Spec was written and approved prior to this plan.

## Project Structure

### Documentation (this feature)

```text
specs/007-scrape-fighter-nationality-event-image/
├── plan.md              # This file
├── research.md          # Skipping (No unknown technical challenges)
├── data-model.md        # Phase 1 output
└── contracts/           # Phase 1 output
```

### Source Code (repository root)

```text
backend/
├── prisma/
│   └── schema.prisma         # ADD eventImg and hometown fields
├── src/
│   ├── events/
│   │   ├── events.service.ts # UPDATE to persist new fields
│   │   ├── scraper.service.ts# UPDATE to parse hometown / hero image
│   │   └── scraper.service.spec.ts # UPDATE tests
└── tests/

frontend/
├── src/
│   ├── types/
│   │   └── api.ts            # UPDATE Event and Fighter interfaces
│   ├── components/
│   │   ├── FightCard.tsx     # UPDATE to show eventImg and fighter flags
│   │   ├── FighterPortrait.tsx # UPDATE to overlay flag
│   └── lib/
│       └── flags.ts          # NEW mapping of hometowns to country codes/emojis
```

**Structure Decision**: The feature spans the full stack: Database Schema -> Backend Scraper -> API Types -> Frontend UI.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | N/A        | N/A |
