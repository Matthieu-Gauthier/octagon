# Quickstart: Fetch UFC Event

This document provides a quick overview of how to interact with the new UFC event fetching feature during development.

## 1. Environment Setup

The backend will fetch data from an external API or scrape `ufc.com`. 
- Ensure that your local PostgreSQL instance is running.
- Ensure the backend NestJS service is running (`npm run start:dev` inside `backend/`).

*If we use a paid/freemium API like RapidAPI later, an API key will be required in `.env` (e.g., `UFC_API_KEY=...`). But for now, we prioritize free public endpoints or scraping.*

## 2. Triggering the Event Fetch

As an administrator, you can manually trigger the fetch process to populate your local database with upcoming fights.

**Via API (cURL):**
```bash
curl -X POST http://localhost:3000/api/admin/events/fetch \
  -H "Authorization: Bearer <ADMIN_JWT>"
```
*Note: Replace `<ADMIN_JWT>` with a valid JWT for an admin user.*

## 3. Removing Test Events

To clean up a fetched event (and naturally cascade delete its fights and test bets), use the delete endpoint:

**Via API (cURL):**
```bash
curl -X DELETE http://localhost:3000/api/admin/events/ufc-300 \
  -H "Authorization: Bearer <ADMIN_JWT>"
```
*Replace `ufc-300` with the actual event ID slug.*

## 4. Frontend Admin UI

Once the backend endpoints are built, the frontend `AdminResults` or new `AdminEvents` view will be updated to include two buttons:
1. **"Fetch Next UFC Event"** (Calls the `POST` endpoint).
2. **"Remove Event"** (Calls the `DELETE` endpoint for a selected event).
