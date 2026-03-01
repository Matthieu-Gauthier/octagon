# Quickstart: Scraping Event Images and Nationalities

No new dependencies or external services are required.

## Backend Verification
1. Open the backend service: `cd backend`
2. Run database push and seed to make sure schema is picked up:
   ```bash
   npx prisma db push
   npm run seed
   ```
3. Run the scraper tests to ensure new selectors extract data:
   ```bash
   npm run test scraper.service
   ```

## Frontend Verification
1. Start the frontend: `cd frontend && npm run dev`
2. Navigate to `http://localhost:5173/showcase`
3. Look for the Fight Card demo and confirm you see dummy images / flags or real data if linked to a local backend using scraped data.
