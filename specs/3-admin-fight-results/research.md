# Research: Admin Fight Results

## RBAC Implementation
- **Current State**: `User` model has no `role` field.
- **Decision**: **Universal Access (MVP)**.
  - The user requested that *all authenticated users* can modify results for testing purposes.
  - **Action**: Do NOT add `role` field to `User` yet. Secure endpoints with basic `SupabaseGuard` only.

## Standings Calculation
- **Context**: Standings are calculated on-the-fly in `LeaguesService.getStandings`.
- **Decision**: Keep it on-the-fly. The volume of data (users * leagues * bets) is low enough for MVP.
- **Optimization**: Ensure database indices on `leagueId` and `userId` are present in `Bet` table.

## UI Approach
- **Context**: Admin needs to enter results.
- **Decision**: "Edit Mode" on `VegasFightCard`.
  - Add `editable` prop to `VegasFightCard` (or a wrapper).
  - When in Admin Mode, clicking a fighter/method/round sets the *Result* instead of a *Bet*.
  - Visual cue: Different border color (e.g., Gold/Purple) for Admin Mode.
