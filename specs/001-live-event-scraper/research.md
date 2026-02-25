# Phase 0: Research & Architecture

## Unknowns Resolved

### 1. NestJS Cron/Job Scheduling
- **Decision**: Use @nestjs/schedule.
- **Rationale**: It is the officially supported, robust scheduling module for NestJS built on top of 
ode-cron. It supports declarative cron jobs (@Cron()) and dynamic timeouts/intervals.
- **Alternatives considered**: External job queues like BullMQ (too heavy/complex for a simple 5-minute interval check without distributed worker needs).

### 2. Live Scraper Module Integration
- **Decision**: Create a dedicated LiveScraperService that uses the existing ScraperModule APIs (or directly uses Cheerio). It will rely on EventsService and FightsService for database operations.
- **Rationale**: Keeps the scheduling logic isolated from the core scraping logic and database entities.
- **Alternatives considered**: Putting the @Cron() directly in EventsService (violates Single Responsibility Principle).

### 3. Graceful Error Handling
- **Decision**: Implement a 	ry/catch block within the cron method. If an error occurs (e.g., Axios 403 or timeout), the error will be passed to NestJS's Logger and the function will return early without throwing an unhandled exception.
- **Rationale**: Ensures the backend does not crash and the cron job will automatically attempt again in 5 minutes.

## Best Practices

- **Idempotency**: The @Cron method must ensure it doesn't process the same event concurrently if an execution takes longer than 5 minutes.
- **Transaction**: Updating multiple fights and the event status should ideally be wrapped in a Prisma transaction if possible, or handled carefully to avoid partial updates.
