# API Contracts

## Base URL
`VITE_API_URL` (typically `http://localhost:3000`)

## Authentication
All requests (except Health) typically require `Authorization: Bearer <SUPABASE_JWT>` header.

## Endpoints

### Health
- `GET /health` -> `200 OK` (Status check)

### Events
- `GET /events`
  - Returns: `Event[]` (includes fights)
- `GET /events/:id`
  - Returns: `Event` (detailed)

### Fighters
- `GET /fighters`
  - Returns: `Fighter[]`
- `GET /fighters/:id`
  - Returns: `Fighter`

### Leagues
- `GET /leagues`
  - Returns: `League[]` (My Leagues)
- `GET /leagues/:id`
  - Returns: `League` (with members)
- `POST /leagues`
  - Body: `{ name: string }`
  - Returns: `League`
- `POST /leagues/join`
  - Body: `{ code: string }`
  - Returns: `LeagueMember`
- `GET /leagues/:id/standings`
  - Returns: `LeagueStanding[]`

### Bets
- `GET /leagues/:leagueId/bets`
  - Query: `userId=<current_user>`
  - Returns: `Bet[]`
- `POST /bets`
  - Body: `{ leagueId: string, fightId: string, winnerId: string, method?: string, round?: number }`
  - Returns: `Bet`
