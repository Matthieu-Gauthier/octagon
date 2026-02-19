# Octagon - Project Specification

## Overview
**Octagon** is a web application for organizing friendly UFC betting with friends.
Users join or create **leagues** (private groups), and within each league they can:
- View & bet on UFC fight cards
- Compare standings via a league-specific leaderboard
- Play **Survivor Mode** if the league admin enables it

## Architecture — League-Centric

```
/                       → Redirect to /leagues
/leagues                → My Leagues list + Join/Create
/leagues/create         → Create a new league
/leagues/:id            → League Dashboard (tabs below)
/leagues/:id/fights     → Fight Card view (event selector + VegasFightCards)
/leagues/:id/leaderboard→ League Leaderboard
/leagues/:id/survivor   → Survivor Hub  (if enabled)
/leagues/:id/survivor/pick/:eventId → Survivor pick flow
```

> **No global leaderboard** — scoring and standings only exist within a league.

## Core Features

### 1. Leagues (Entry Point)
- **My Leagues** page is the home page (`/`).
- Create a league (name, optional Survivor toggle).
- Join via 6-character invite code.
- Each league card shows name, member count, and an arrow to enter.

### 2. League Dashboard (`/leagues/:id`)
- **Header**: League name, invite code (copy), member count.
- **Tabs** (internal navigation inside the league):
  | Tab | Description |
  |-----|-------------|
  | 🥊 Fight Card | Event selector combobox + VegasFightCards (main/prelim) |
  | 🏆 Leaderboard | Standings for this league only |
  | 🔥 Survivor | Shown only if league has Survivor enabled |

### 3. Fight Card (within a league)
- **Event Selector** combobox lives here (not in the global header).
- Uses the unified `VegasFightCard` component in `mode="full"`.
- Bets are stored per-league (keyed by `leagueId + fightId`).

### 4. Leaderboard (within a league)
- League-scoped leaderboard based on prediction accuracy.
- Scoring: Winner = 10 pts, Method = +5, Round = +5.

### 5. Survivor Mode (optional per league)
- League admin toggles Survivor on/off at creation.
- Uses `VegasFightCard` in `mode="winner"` (pick every fight).
- Streak-based: wrong pick resets streak, draws/NCs are safe.

### 6. Authentication
- Email/Password + Google OAuth.
- Protected routes require login.

### 7. Admin Portal
- `/admin` — result entry, event management (unchanged).

## UI/UX
- **Dark Mode** by default (neutral grey palette).
- Vegas-style fight cards with inline betting.
- Auto-collapse of method/round panel after 1s.
- Mobile-first responsive design.

## Data Model Changes

### League (updated)
```typescript
interface League {
    id: string;
    name: string;
    code: string;           // 6-char invite code
    adminId: string;
    members: string[];
    survivorEnabled: boolean; // NEW — toggle for Survivor mode
}
```

### Bets
Bets are keyed by `leagueId:fightId` so each league has independent picks.
