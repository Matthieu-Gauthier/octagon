# Research & Technical Decisions

**Feature**: Backend API Setup
**Date**: 2026-02-18

## 1. Technical Stack Decisions

### Backend Framework: NestJS
- **Decision**: Use NestJS.
- **Rationale**: Strongly typed, modular architecture, great ecosystem (Prisma, Passport, Config). Matches project "Constitution".

### Database & ORM: Postgres + Prisma
- **Decision**: PostgreSQL (hosted on Unraid) with Prisma ORM.
- **Rationale**: Type-safe DB access, auto-generated migrations, easy relation management.
- **Connection**: Connection string will be provided via `.env`.

### Authentication: Supabase Auth
- **Decision**: Validate JWTs issued by Supabase.
- **Rationale**: Offloads user management (signup/login/recovery). Backend only needs to verify signature and extract `sub` (UserId).
- **Implementation**: `passport-jwt` with Supabase project secret.

### Image Handling: Local Assets
- **Decision**: Download fighter images to local storage.
- **Rationale**: User preference (Clarification Q3).
- **Implementation**:
    - Seeding script fetches images (or uses placeholders).
    - Saved to `backend/uploads/fighters` or similar.
    - Served via `ServeStaticModule`.

### Bet Locking: Time-Based
- **Decision**: Lock bets based on `server_time`.
- **Rationale**: Simple, effective for MVP.
- **Constraint**: Server clock must be synced (NTP).

## 2. API Structure

- **Prefix**: `/api/v1`
- **Modules**:
    - `AuthModule`: Public (Guards elsewhere).
    - `EventsModule`: Public/Protected.
    - `LeaguesModule`: Protected.
    - `BetsModule`: Protected.
    - `AdminModule`: Protected (Admin Role).

## 3. Unknowns & Resolutions

- **Result Source**: Admin Manual Entry (Resolved in Clarification Q4).
- **Live Standings**: On-the-fly Calculation (Resolved in Clarification Q5).
