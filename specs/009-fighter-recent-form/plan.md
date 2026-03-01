# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

The Fighter Recent Form feature extends the system to extract, store, and display up to 3 of a fighter's most recent fight results (Outcome and Method). This data will be scraped from UFC.com during the standard fighter ingestion process and presented on the frontend Mixed Information Form UI.

## Technical Context

**Language/Version**: TypeScript / Node.js
**Primary Dependencies**: NestJS, React, Prisma, Cheerio
**Storage**: PostgreSQL (Prisma `Json` type for `recentForm` on `Fighter` model)
**Testing**: Jest (Unit testing mandatory for new scraper logic)
**Target Platform**: Web application (Frontend + Backend)
**Project Type**: Web application
**Performance Goals**: Scraper should not significantly increase memory or processing time.
**Constraints**: Scraper must gracefully handle missing data or non-standard HTML.
**Scale/Scope**: Impacts all active fighters in the database (~1000 records).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **League-Centric Architecture**: N/A (Fighter data is global, not league-specific).
- [x] **Backend Architecture**: Follows NestJS + Prisma standards.
- [x] **Mandatory Unit Testing**: Jest tests will be added/updated for the `FighterScraperService`.
- [x] **Frontend Standards**: Uses React, Tailwind, and Shadcn/Radix.
- [x] **Iterative Workflow**: Specs generated and plan is being followed.

## Project Structure

### Documentation (this feature)

```text
specs/009-fighter-recent-form/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── scraper/
│   │   └── services/fighter-scraper.service.ts
│   └── events/ (or wherever the fighter API is served)
└── prisma/
    └── schema.prisma

frontend/
├── src/
│   ├── components/
│   │   └── fighter/FightCardShowcase.tsx (or similar component)
│   └── types/
```

**Structure Decision**: Option 2 (Web application) is selected as this feature spans both the NestJS backend and React frontend.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
