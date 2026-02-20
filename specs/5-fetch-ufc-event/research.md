# Research: UFC Event Data Source

## 1. Finding a Clean, Free API

**Context:** We need to fetch upcoming UFC event details, fights (Main Card & Prelims), fighters, and their images. The user prefers a free, clean API over scraping.

**Findings:**
There is no official *public* free UFC API. However, there are several community-maintained solutions:
- **RapidAPI (UFC Data APIs)**: Several freemium APIs exist. They often have low rate limits (e.g., 50 requests/day) but provide structured JSON.
- **Open Source Projects (GitHub)**: 
  - `victor-lillo/octagon-api` and `eminbustun/UFC_API`: Offer REST endpoints but rely on community hosting or require self-hosting.
  - `ufc-api` (NPM packages): Several Node.js wrappers exist that scrape `ufcstats.com` under the hood.

**Image Availability:** Most unofficial APIs struggle to provide reliable, high-quality fighter images because `ufcstats.com` does not host the rich portrait images, only `ufc.com` does.

## 2. Decision & Fallback Strategy

**Decision:** 
We will integrate a lightweight data retrieval service in the NestJS backend. 
1. **Primary Approach (Scraper Porting)**: As suggested, we will review the open-source scraper from `victor-lillo/octagon-api` (specifically their `get-fighters` and event logic). Since it is proven to scrape MMA data effectively, we will adapt their scraping logic directly into our NestJS service. This gives us full control over the UFC data and image retrieval without relying on third-party uptime.
2. **Fallback**: If the scraper breaks due to UI changes on the UFC website, we can look into reliable RapidAPI endpoints as a backup.

**Rationale:**
Porting an existing, functioning open-source scraper (like `victor-lillo/octagon-api`) provides a reliable, cost-free solution while maintaining full control over the ingestion process and database syncing (like our specific `slug` logical IDs and image handling).

**Alternatives Considered:**
- **Sportradar / Premium APIs**: Rejected because it violates the "free" requirement.
- **Pure Scraping (Puppeteer/Playwright)**: Rejected as a primary approach because it is too heavy and slow compared to simple HTTP parsing or API requests.
