import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';

export interface ScrapedFighter {
    id: string; // slug
    name: string;
    wins: number;
    losses: number;
    draws: number;
    noContests: number;
    winsByKo: number;
    winsBySub: number;
    winsByDec: number;
    height: string | null;
    weight: string | null;
    reach: string | null;
    stance: string | null;
    sigStrikesLandedPerMin: number | null;
    takedownAvg: number | null;
    imagePath: string | null;
}

export interface ScrapedFight {
    id: string;
    fighterAId: string;
    fighterBId: string;
    division: string;
    rounds: number;
    isMainEvent: boolean;
    isCoMainEvent: boolean;
    isMainCard: boolean;
    isPrelim: boolean;
    status: string;
}

export interface ScrapedEvent {
    id: string;
    name: string;
    date: Date;
    location: string;
    status: string;
}

export interface ScrapedEventData {
    event: ScrapedEvent;
    fights: ScrapedFight[];
    fighters: ScrapedFighter[];
}

@Injectable()
export class ScraperService {
    private readonly logger = new Logger(ScraperService.name);
    private readonly UFC_BASE_URL = 'https://www.ufc.com';

    async scrapeNextEvent(): Promise<ScrapedEventData | null> {
        this.logger.log('Starting UFC event scrape...');
        try {
            const eventsHtml = await this.fetchHtml(`${this.UFC_BASE_URL}/events`);

            // Find the first event link in the HTML 
            // The upcoming event is usually the first one listed in the block
            const matches = eventsHtml.match(/href="\/event\/([^"]+)"/g) || [];
            if (matches.length === 0) {
                this.logger.warn('No upcoming event link found in HTML');
                return null;
            }

            // Extract the slug from the first match e.g. 'href="/event/ufc-fight-night-february-21-2026"'
            const firstEventMatch = matches[0];
            const eventSlug = firstEventMatch?.replace('href="/event/', '').replace('"', '');
            const eventUrl = `${this.UFC_BASE_URL}/event/${eventSlug}`;

            this.logger.log(`Fetching event details from ${eventUrl}`);

            const eventDetailHtml = await this.fetchHtml(eventUrl);
            const $ev = cheerio.load(eventDetailHtml);

            const eventName = $ev('.c-hero__headline-prefix').text().trim() + ' ' + $ev('.c-hero__headline').text().trim();
            const timestamp = $ev('.c-hero__headline-suffix').attr('data-timestamp') || $ev('.c-hero__headline-suffix').attr('data-datetime');
            const eventDate = timestamp ? new Date(parseInt(timestamp) * 1000) : new Date();
            const location = $ev('.c-hero__headline-suffix').text().trim() || 'Unknown';

            const event: ScrapedEvent = {
                id: eventSlug ?? 'Unknown',
                name: (eventName || eventSlug?.replace(/-/g, ' ').toUpperCase()) ?? 'Unknown',
                date: eventDate,
                location,
                status: 'SCHEDULED',
            };

            const fights: ScrapedFight[] = [];
            const fightersMap = new Map<string, ScrapedFighter>();

            // Main card vs Prelims (simplified logic - looking at the fight blocks)
            // UFC DOM uses nested elements. We grab all .c-listing-fight elements.
            const fightElements = $ev('.c-listing-fight');
            let isMainCard = true; // Assume main card first, or rely on headers

            for (let i = 0; i < fightElements.length; i++) {
                const el = fightElements[i];
                const $f = $ev(el);

                // Exclude early prelims if needed based on nearby headers
                const weightClass = $f.find('.c-listing-fight__class-text').text().trim();
                if (weightClass.toLowerCase().includes('early prelim')) {
                    continue; // Skip early prelims
                }

                const fighterLinks = $f.find('.c-listing-fight__corner-name a');
                if (fighterLinks.length < 2) continue;

                const fA = $ev(fighterLinks[0]);
                const fB = $ev(fighterLinks[1]);

                const fASlug = fA.attr('href')?.split('/').pop() || '';
                const fBSlug = fB.attr('href')?.split('/').pop() || '';

                if (fASlug && !fightersMap.has(fASlug)) {
                    fightersMap.set(fASlug, await this.scrapeFighter(fASlug));
                }
                if (fBSlug && !fightersMap.has(fBSlug)) {
                    fightersMap.set(fBSlug, await this.scrapeFighter(fBSlug));
                }

                fights.push({
                    id: `${fASlug}-vs-${fBSlug}`,
                    fighterAId: fASlug,
                    fighterBId: fBSlug,
                    division: weightClass,
                    rounds: weightClass.toLowerCase().includes('title') ? 5 : 3,
                    isMainEvent: i === 0,
                    isCoMainEvent: i === 1,
                    isMainCard: i < 5, // Approximation, accurate relies on DOM parsing headers
                    isPrelim: i >= 5,
                    status: 'SCHEDULED'
                });
            }

            return {
                event,
                fights,
                fighters: Array.from(fightersMap.values())
            };
        } catch (error) {
            this.logger.error(`Scraping failed: ${error}`);
            return null;
        }
    }

    private async scrapeFighter(slug: string): Promise<ScrapedFighter> {
        this.logger.log(`Scraping fighter: ${slug}`);
        const url = `${this.UFC_BASE_URL}/athlete/${slug}`;
        const html = await this.fetchHtml(url);
        const $ = cheerio.load(html);

        const name = $('.hero-profile__name').text().trim() || slug.replace('-', ' ');
        const recordStr = $('.hero-profile__division-body').text().trim(); // "28-1-0 (W-L-D)"
        const records = recordStr.match(/(\d+)/g) || ['0', '0', '0'];

        const extractStat = (label: string): string => {
            return $(`.c-stat-compare__label:contains("${label}")`).next('.c-stat-compare__number').text().trim();
        };

        const imageSrc =
            $('.hero-profile__image img').attr('src') ||
            $('img.hero-profile__image').attr('src') ||
            null;

        this.logger.log(`Scraping fighter image: ${imageSrc}`);

        return {
            id: slug,
            name,
            wins: parseInt(records[0]) || 0,
            losses: parseInt(records[1]) || 0,
            draws: parseInt(records[2]) || 0,
            noContests: 0, // Fallback, sometimes not listed explicitly in the primary record string
            winsByKo: 0, // Need deeper scraping logic for methods, fallback to 0 for MVP
            winsBySub: 0,
            winsByDec: 0,
            height: extractStat('Height') || null,
            weight: extractStat('Weight') || null,
            reach: extractStat('Reach') || null,
            stance: extractStat('Stance') || null,
            sigStrikesLandedPerMin: parseFloat($('.c-stat-3bar__value').first().text().trim()) || null,
            takedownAvg: parseFloat($('.c-stat-3bar__value').eq(1).text().trim()) || null,
            imagePath: imageSrc ?? ''
        };
    }

    async downloadImage(url: string, slug: string): Promise<string | null> {
        try {
            // Handle relative URLs
            const fullUrl = url.startsWith('http') ? url : `${this.UFC_BASE_URL}${url}`;
            const response = await fetch(fullUrl);

            if (!response.ok) return null;

            const publicDir = path.join(process.cwd(), 'public', 'fighters');
            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
            }

            const fileName = `${slug}.png`;
            const dest = path.join(publicDir, fileName);

            const arrayBuffer = await response.arrayBuffer();
            fs.writeFileSync(dest, Buffer.from(arrayBuffer));

            return `/fighters/${fileName}`;
        } catch (error) {
            this.logger.error(`Image download failed for ${slug}: ${error}`);
            // Return empty path on failure according to spec
            return null;
        }
    }

    private async fetchHtml(url: string): Promise<string> {
        this.logger.debug(`Fetching HTML from: ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0'
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
        return response.text();
    }
}
