# Research: Fighter Recent Form

## Technical Approach for Data Storage
- **Decision**: Store the recent form data as a JSON array within the `Fighter` model in PostgreSQL using Prisma's `Json` type.
- **Rationale**: The recent form is strictly bounded to the last 3 fights and is always read together with the fighter. A separate relational table would add unnecessary join overhead for a small, bounded array of primitive objects. The `Json` type perfectly accommodates `[{ result: "W", method: "KO/TKO" }, ...]`.
- **Alternatives considered**: 
  - Creating a new `FighterRecentFight` model with a relation to `Fighter`. Rejected because we don't need to query these individual fights independently; they are purely for display on the fighter's profile.
  - Dynamically calculating the recent form from the `Fight` table. Rejected because we only scrape future/current events' fights, and the historical records of a fighter's past 3 fights (before our database started tracking) wouldn't exist in our `Fight` table. Scraping it from the UFC athlete page is the only reliable way to get their true recent form.

## Web Scraping Strategy
- **Decision**: Utilize the existing Cheerio-based scraper in the `backend/src/scraper` module to parse the UFC athlete's page.
- **Rationale**: The user has provided the exact CSS selectors necessary to determine the outcome strings. We will map the presence of the `c-card-event--athlete-results__plaque win` to a Win, verify the opponent for a Loss, and default to NC/Draw based on text.
- **Alternatives considered**: Using Puppeteer to render the page. Rejected because the UFC athlete pages serve this information in the static HTML payload, making Cheerio much faster and less resource-intensive.
