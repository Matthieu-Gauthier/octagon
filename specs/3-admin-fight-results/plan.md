# Implementation Plan: Admin Fight Results

**Feature**: Admin Fight Results
**Spec**: [specs/3-admin-fight-results/spec.md](file:///c:/Users/xgotg/OneDrive/Documents/git/octagon/specs/3-admin-fight-results/spec.md)
**Status**: Draft

## Technical Context

### Architecture & Patterns
- **Backend**: NestJS with Prisma. Result updates will trigger standings recalculation.
- **Frontend**: React (Vite) with TanStack Query. Admin UI will likely reuse `VegasFightCard` in a new "Admin Mode" or use a dedicated form.
- **State Management**: React Query for fetching fights and standings. `useMutation` for updates.

### Dependencies
- **Existing**: `PrismaService`, `BetsService`, `LeaguesService`, `EventsService`.
- **New**: `AdminService` or extend `FightsService` to handle result updates and trigger side effects.

### Integrations
- **Database**: `Fight` table update -> `Bet` table (implied calculation) -> `Leagues` standings.
- **Auth**: `SupabaseGuard` with Role Based Access Control (RBAC) to ensure only admins can access these endpoints. *Note*: Current RBAC implementation needs verification.

### Unknowns & Risks
- **[NEEDS CLARIFICATION]**: Does the system currently have a robust RBAC? The spec mentions "ADMIN role", but we need to verify how `User` roles are stored/checked.
- **[NEEDS CLARIFICATION]**: How should "Standings Recalculation" happen? On-the-fly (current implementation) vs Stored snapshot?
    - *Research*: Current `getStandings` calculates on-the-fly. This is fine for now but might scale poorly. For MVP, we stick to on-the-fly.

## Constitution Check

### Compliance
- **Principle 1**: "Leagues are isolated". *Check*: Standings are calculated per league.
- **Principle 2**: "Admin authority". *Check*: Admins control results.

### Gates
- [ ] **Research Complete**: `research.md` created.
- [ ] **Data Model Frozen**: `data-model.md` created.
- [ ] **Contracts Frozen**: API contracts created.
