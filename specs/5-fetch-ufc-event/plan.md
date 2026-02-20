# Implementation Plan: Fetch UFC Event

**Branch**: `5-fetch-ufc-event` | **Date**: 2026-02-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/5-fetch-ufc-event/spec.md`

## Summary

This feature involves fetching upcoming UFC event data, including the event details and fights/fighters for the main card and prelims. Based on research and user preference, we will adapt the open-source scraper logic from `victor-lillo/octagon-api` directly into our NestJS backend to retrieve fighter details and images from the UFC website, giving us a free and reliable data source while keeping full control. We also need an admin action to remove an event and cascade the deletion of fights and bets. Functionally, when importing fights, we will use the UFC URL slug as a unique logical ID for fighters to update existing records (like scorecards) and handle image download failures gracefully by leaving the path empty.

## Technical Context

**Language/Version**: TypeScript (Node.js/Next.js ecosystem)
**Primary Dependencies**: NestJS (Backend), Prisma (ORM), React (Frontend)
**Storage**: PostgreSQL (via Prisma)
**Testing**: Jest (Backend), Vitest/Testing Library (Frontend) 
**Target Platform**: Web (Desktop & Mobile responsive)
**Project Type**: Monorepo-style Web Application (Backend & Frontend)
**Performance Goals**: Event import < 1 minute, Deletion < 5 seconds
**Constraints**: Ensure robust error handling for external API/scraping limits or failures
**Scale/Scope**: ~10-15 fights per event, ~20-30 fighters per event. 

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Conforms to League-Centric Architecture (N/A for global UFC events, but bets will remain tied to leagues).
- [x] Backend adheres to NestJS + Prisma stack.
- [x] Mandatory Unit Testing (Jest) will be included in the tasks.
- [x] Frontend adheres to React (Vite) + Tailwind + Zustand.

## Project Structure

### Documentation (this feature)

```text
specs/5-fetch-ufc-event/
├── plan.md              # This file
├── research.md          
├── data-model.md        
├── quickstart.md        
├── contracts/           
└── tasks.md             
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── events/
│   ├── fighters/
│   └── fights/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/admin/
│   └── services/
└── tests/
```

**Structure Decision**: Standard web application split (backend/frontend). The backend will handle the data retrieval (CRON or manual trigger) and database storage. The frontend will provide the admin UI to trigger fetches and manage/remove events.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None yet  | N/A        | N/A |
