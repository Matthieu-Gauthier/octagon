# API Contract

**Version**: v1
**Base URL**: `/api/v1`

## Authentication
- **Headers**: `Authorization: Bearer <SUPABASE_JWT>`

## System
- `GET /health`: Returns `{ status: 'ok', timestamp: ISOString }`

## Events & Fights
- `GET /events`: Returns list of events.
    - **Query**: None (initially).
    - **Logic**: Returns "Current/Next" event + Past events with User Bets.
- `GET /events/:id`: Returns full event details with fights and fighters.
    - **Response**: `Event` object with `fights[]` and `fights.fighterA/B`.

## Leagues
- `GET /leagues`: Returns all leagues (public/private mix as per clarification).
- `POST /leagues`: Create a new league.
    - **Body**: `{ name: string }`
- `POST /leagues/join`: Join a league via code.
    - **Body**: `{ code: string }`
- `GET /leagues/:id`: Get league details and members.
- `GET /leagues/:id/standings`: Get leaderboard.
    - **Query**: `?eventId=...` (optional filter)

## Bets
- `POST /bets`: Place a bet.
    - **Body**: `{ leagueId, fightId, winnerId, method, round }`
    - **Validation**: Checks `server_time < fight.date`.
- `GET /leagues/:id/bets`: Get user's bets for a league/event.

## Survivor
- `POST /leagues/:id/survivor`: Make a survivor pick.
    - **Body**: `{ eventId, fightId, fighterId }`

## Admin (Protected)
- `POST /events/:id/fights/:fightId/result`: Submit fight result.
    - **Body**: `{ winnerId, method, round, time }`
    - **Trigger**: Recalculates standings.
- `DELETE /leagues/:id`: Archive league (soft delete).
