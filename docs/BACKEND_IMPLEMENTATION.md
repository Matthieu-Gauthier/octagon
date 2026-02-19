# Backend Implementation Plan


## Development Standards
- **Testing**: All features must include **Jest** unit tests (Success/Error/Edge cases).
- **Constitution**: Refer to `.specify/memory/constitution.md` for non-negotiable rules.

## Phase 1: Core Infrastructure (Planned)
- [ ] **Project Initialization**: NestJS setup, Docker configuration (dev/prod).
- [ ] **Database Setup**: PostgreSQL on Unraid (`192.168.0.200`), Prisma ORM initialization.
- [ ] **Authentication Layer**: Supabase JWT Strategy & Auth Guard implementation.
- [ ] **Health Check**: Basic connectivity endpoint (`/health`).

## Phase 2: Master Data Management (Planned)
- [ ] **Schema Design**: `Event`, `Fight`, `Fighter` models in Prisma.
- [ ] **Data Seeding**: Migration script for `MOCK_EVENTS` and `MOCK_FIGHTERS`.
- [ ] **Ingestion Service**: Service to fetch/scrape external UFC data (periodic updates).
- [ ] **Public API**: Endpoints for retrieving Events and Fighters.

## Phase 3: League System (Planned)
- [ ] **Schema Design**: `User`, `League`, `LeagueMember`, `ScoringSettings` models.
- [ ] **League Logic**: Creation, settings management, and invite code generation.
- [ ] **Membership Logic**: Joining via code, role management (Admin/Member).
- [ ] **API**: Protected endpoints for League CRUD operations.

## Phase 4: Gameplay Mechanics (Planned)
- [ ] **Schema Design**: `Bet`, `SurvivorPick` models.
- [ ] **Betting Engine**: Validation (lock times), storage, and retrieval logic.
- [ ] **Survivor Engine**: Pick validation and status tracking logic.
- [ ] **Scoring System**: Cron job to calculate results and update `Leaderboard`.

## Phase 5: DevOps & Testing (Planned)
- [ ] **CI/CD Pipeline**: GitHub Actions for linting and building.
- [ ] **E2E Testing**: API flow validation.
- [ ] **Deployment**: Docker container build and deployment to Unraid.
