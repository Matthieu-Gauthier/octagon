# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: TypeScript (Node.js for backend)  
**Primary Dependencies**: NestJS, `@nestjs/schedule` (needs to be added for cron), Prisma, Cheerio (for scraping)  
**Storage**: PostgreSQL (via Prisma)  
**Testing**: Jest (Unit testing mandatory per constitution)  
**Target Platform**: Node.js backend environment  
**Project Type**: Monorepo with separated `frontend` and `backend` directories. This feature modifies the `backend`.  
**Performance Goals**: Scraping must execute efficiently every 5 minutes without causing memory leaks or blocking the main event loop.  
**Constraints**: Must handle external scraping failures gracefully (403, timeouts) and rely on the next 5-minute cycle.  
**Scale/Scope**: Impacts the `Event` and `Fight` entities. Requires a new cron scheduling module in the backend.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **League-Centric Architecture**: N/A for this specific feature (backend data updates affect fights globally, scoring is handled elsewhere).
- [x] **Backend Architecture (NestJS + Postgres)**: The scraper will be implemented as a new NestJS module/service using Prisma.
- [x] **Mandatory Unit Testing (Jest)**: The `live-event-scraper` service will include Jest unit tests to verify status transition logic and scraping error handling.
- [x] **Iterative Workflow**: Following Spec-Kit workflow. Back-end only change.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
backend/
├── src/
│   ├── events/       # Existing: We will likely interact with the EventsService
│   ├── scraper/      # New or existing: The scraping logic
│   └── jobs/         # New: Where the Cron/Scheduling service will live
└── tests/
```

**Structure Decision**: Code will be placed in the `backend/src` directory. We need to implement a scheduler module (likely named `jobs` or integrated into the existing `scraper` module) and update the `events` or `fights` modules to handle the state transitions.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
