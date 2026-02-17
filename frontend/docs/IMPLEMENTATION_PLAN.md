# Implementation Plan

## Phase 1: Foundation (Completed)
- [x] Project Setup (Vite, TypeScript, Tailwind).
- [x] Basic UI Components (Card, Button, Badge).
- [x] Routing (React Router).
- [x] Layout Structure (Header, Navigation).

## Phase 2: Core Features (Completed)
- [x] **Fight Card Display**: `VegasFightCard` component with inline betting.
- [x] **Betting Form**: Stepper flow (winner → method → round), auto-collapse.
- [x] **State Management**: `zustand` for league-scoped bets (`leagueId:fightId`).
- [x] **Dark Mode**: Pure grey dark theme, matching Vegas card design.

## Phase 3: League-Centric Architecture (Completed)
- [x] **Leagues as Entry Point**: `/` redirects to `/leagues`.
- [x] **League Dashboard**: Tabbed layout (Fight Card, Leaderboard, Survivor).
- [x] **Event Selector**: Moved into Fight Card tab (removed from header).
- [x] **League-Scoped Bets**: Bets keyed by `leagueId:fightId`.
- [x] **Survivor Toggle**: Optional per-league, toggled at creation.
- [x] No global leaderboard — all scoring within leagues.

## Phase 4: Authentication (Completed)
- [x] Sign Up / Login Forms (Email & Password).
- [x] Google OAuth Integration.
- [x] Protected Routes.
- [ ] User Profile (avatar, username).

## Phase 5: Admin Portal (Completed)
- [x] Result Entry Interface.
- [x] Event Management.

## Phase 6: Survivor Mode (Completed)
- [x] Survivor Data Model & Context.
- [x] Hub Interface (Status, History).
- [x] Pick Selection Flow (VegasFightCard in "winner" mode).
- [x] Streak-based system (wrong pick resets, draws/NCs = safe).

## Phase 7: Backend Integration (Planned)
- [ ] Connect to Supabase/Firebase.
- [ ] Real-time updates for results.
- [ ] Odds API integration.

## Phase 8: Refinement (Planned)
- [ ] Mobile responsiveness.
- [ ] Additional animations.
- [ ] Accessibility audit.
