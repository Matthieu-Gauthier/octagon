# Implementation Plan: Fix Fight Display Issues

**Branch**: `008-fix-fight-display-issues` | **Date**: 2026-02-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-fix-fight-display-issues/spec.md`

## Summary

Fix the order of fights displayed on the event page to strictly match the order they were scraped. Enhance the fighter display by showing Height, Weight, Reach, and Stance, formatted similarly to existing stats. Fix missing country flags and move all flags to the absolute bottom of the fighter card display.

## Technical Context

**Language/Version**: TypeScript / React (Vite) / NestJS 
**Primary Dependencies**: Tailwind CSS, React Query
**Storage**: PostgreSQL (Prisma)
**Testing**: Jest
**Target Platform**: Web application
**Project Type**: frontend + backend  
**Performance Goals**: Fast UI rendering
**Constraints**: Tailwind CSS must be used for styling.
**Scale/Scope**: UI component updates, potentially minor API/scraper adjustments if sorting is lost at the database level.

### Unknowns to Resolve (Phase 0)
- **NEEDS CLARIFICATION**: How is fight order currently determined when fetching an event from the API/DB? Is the original scraped order preserved in a field (e.g., `order`, `boutOrder`)?
- **NEEDS CLARIFICATION**: Where are physical stats (Height, Weight, Reach, Stance) currently stored on the Fighter model, and are they being fetched by the UI?
- **NEEDS CLARIFICATION**: What countries are currently missing flags, and where is the flag mapping located in the frontend?

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Frontend Standards**: Passes. We are using React + Tailwind CSS.
- **Mandatory Unit Testing (Jest)**: Passes. We will ensure UI component tests are updated if necessary.
- **Iterative Workflow (Spec-Kit)**: Passes. Following the spec -> plan workflow.

## Project Structure

### Documentation (this feature)

```text
specs/008-fix-fight-display-issues/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── modules/scraper/
│   └── modules/events/
└── tests/

frontend/
├── src/
│   ├── components/
│   │   ├── fights/
│   │   └── fighters/
│   ├── utils/
│   └── tests/
```

**Structure Decision**: Web application (frontend + backend). We will mostly touch frontend components, but might need to adjust backend scraper/API if sorting or stats are missing.
