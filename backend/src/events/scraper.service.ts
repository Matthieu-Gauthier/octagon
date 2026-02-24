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
    hometown?: string;
}

export interface ScrapedFight {
    id: string;
    fighterAId: string;
    fighterBId: string;
    division: string;
    order: number;
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
    prelimsStartAt?: Date;    // scraped from #prelims-card .c-event-fight-card-broadcaster__time[data-timestamp]
    mainCardStartAt?: Date;   // scraped from #main-card .c-event-fight-card-broadcaster__time[data-timestamp]
    eventImg?: string;
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

            const eventImg = $ev('.c-hero__image picture img').attr('src');

            const event: ScrapedEvent = {
                id: eventSlug ?? 'Unknown',
                name: (eventName || eventSlug?.replace(/-/g, ' ').toUpperCase()) ?? 'Unknown',
                date: eventDate,
                location,
                status: 'SCHEDULED',
                prelimsStartAt: this.extractSectionTimestamp($ev, '#prelims-card'),
                mainCardStartAt: this.extractSectionTimestamp($ev, '#main-card'),
                eventImg,
            };

            const fights: ScrapedFight[] = [];
            const fightersMap = new Map<string, ScrapedFighter>();

            // The UFC DOM groups fights in sections by ID:
            //   #main-card    → Main Card fights
            //   #prelims-card → Prelim fights
            //   #early-prelims-card → Early Prelims (skipped)
            const sections: { selector: string; isMainCard: boolean; isPrelim: boolean }[] = [
                { selector: '#main-card', isMainCard: true, isPrelim: false },
                { selector: '#prelims-card', isMainCard: false, isPrelim: true },
            ];

            let globalIndex = 0; // tracks overall fight order for isMainEvent / isCoMainEvent

            for (const section of sections) {
                const fightElements = $ev(`${section.selector} .c-listing-fight`);

                for (let i = 0; i < fightElements.length; i++) {
                    const el = fightElements[i];
                    const $f = $ev(el);

                    // Simple: take only the first matching element's text
                    const weightClass = $f.find('.c-listing-fight__class-text').first().text().trim();
                    if (weightClass.toLowerCase().includes('early prelim')) continue;

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
                        order: globalIndex,
                        rounds: (globalIndex === 0 || weightClass.toLowerCase().includes('title')) ? 5 : 3,
                        isMainEvent: globalIndex === 0,
                        isCoMainEvent: globalIndex === 1,
                        isMainCard: section.isMainCard,
                        isPrelim: section.isPrelim,
                        status: 'SCHEDULED'
                    });

                    globalIndex++;
                }
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

    /**
     * Extracts the start timestamp from the broadcaster time element inside a card section.
     * Reads data-timestamp (Unix seconds) from .c-event-fight-card-broadcaster__time within sectionId.
     * Returns undefined if the element or attribute is missing.
     */
    private extractSectionTimestamp($: cheerio.CheerioAPI, sectionId: string): Date | undefined {
        const ts = $(`${sectionId} .c-event-fight-card-broadcaster__time`).first().attr('data-timestamp');
        if (!ts) return undefined;
        const parsed = parseInt(ts, 10);
        return isNaN(parsed) ? undefined : new Date(parsed * 1000);
    }

    private async scrapeFighter(slug: string): Promise<ScrapedFighter> {
        this.logger.log(`Scraping fighter: ${slug}`);
        const url = `${this.UFC_BASE_URL}/athlete/${slug}`;
        const html = await this.fetchHtml(url);
        const $ = cheerio.load(html);

        // Name — new: h1.hero-profile__name / fallback: h1.c-hero__headline
        const name =
            $('h1.hero-profile__name').text().trim() ||
            $('h1.c-hero__headline').text().trim() ||
            slug.replace(/-/g, ' ');

        // Record — new: p.hero-profile__division-body / fallback: .c-hero__headline-number
        // Format: "28-1-0 (W-L-D)" or "28-6-0, 1 NC"
        const recordStr =
            $('p.hero-profile__division-body').text().trim() ||
            $('.c-hero__headline-number').text().trim();
        const recordMatch = recordStr.match(/(\d+)-(\d+)-(\d+)/);
        const wins = recordMatch ? parseInt(recordMatch[1]) : 0;
        const losses = recordMatch ? parseInt(recordMatch[2]) : 0;
        const draws = recordMatch ? parseInt(recordMatch[3]) : 0;
        const ncMatch = recordStr.match(/(\d+)\s*NC/i);
        const noContests = ncMatch ? parseInt(ncMatch[1]) : 0;

        // Bio stats helper — searches .c-bio__label/.c-bio__text pairs
        const getBioStat = (labelText: string): string | null => {
            let result: string | null = null;
            $('.c-bio__info-item, .c-bio__field').each((_, el) => {
                const label = $(el).find('.c-bio__label').text().trim().toLowerCase();
                if (label.includes(labelText.toLowerCase())) {
                    result = $(el).find('.c-bio__text').text().trim() || null;
                    return false; // break
                }
            });
            return result;
        };

        // Bio stats — try new field selectors first, then label-based lookup
        const height =
            $('div.field--name-gt-height .field__item').first().text().trim() ||
            getBioStat('height') || getBioStat('taille') || null;
        const weight =
            $('div.field--name-gt-weight .field__item').first().text().trim() ||
            getBioStat('weight') || getBioStat('poids') || null;
        const reach =
            $('div.field--name-gt-reach .field__item').first().text().trim() ||
            getBioStat('reach') || getBioStat('portée') || null;
        const stance =
            $('div.field--name-gt-stance .field__item').first().text().trim() ||
            getBioStat('stance') || getBioStat('posture') || getBioStat('position') || null;

        let hometown: string | null = null;
        $('.c-bio__field').each((_, el) => {
            const label = $(el).find('.c-bio__label').text().trim().toLowerCase();
            if (label === 'hometown' || label === 'ville d\'origine') {
                hometown = $(el).find('.c-bio__text').text().trim() || null;
                return false; // break
            }
        });

        // Win methods — section .c-stat-3bar, labels: KO/TKO, DÉC/DEC, SOU/SUB
        // Values format: "10 (28%)" — extract leading number only
        const getWinMethod = (labels: string[]): number => {
            let result = 0;
            $('.c-stat-3bar__group').each((_, el) => {
                const label = $(el).find('.c-stat-3bar__label').text().trim().toLowerCase();
                if (labels.some(l => label.includes(l.toLowerCase()))) {
                    const raw = $(el).find('.c-stat-3bar__value').first().text().trim();
                    const numMatch = raw.match(/^(\d+)/);
                    result = numMatch ? parseInt(numMatch[1]) : 0;
                    return false; // break
                }
            });
            return result;
        };

        const winsByKo = getWinMethod(['ko/tko', 'ko', 'knockout']);
        const winsBySub = getWinMethod(['sub', 'sou', 'soumission', 'submission']);
        const winsByDec = getWinMethod(['dec', 'déc', 'dÉc', 'decision']);


        // Sig. Strikes & Takedown avg — remain in .c-stat-compare blocks
        const sigStrikesLandedPerMin = parseFloat(
            $('.c-stat-compare').first().find('.c-stat-compare__number').first().text().trim()
        ) || null;
        const takedownAvg = parseFloat(
            $('.c-stat-compare').eq(1).find('.c-stat-compare__number').first().text().trim()
        ) || null;

        // Image — new: img.hero-profile__image / fallback: img.c-hero__image
        const imageSrc =
            $('img.hero-profile__image').attr('src') ||
            $('img.c-hero__image').attr('src') ||
            $('.hero-profile__image img').attr('src') ||
            null;

        this.logger.log(`Scraped fighter ${name}: ${wins}-${losses}-${draws}${noContests ? `, ${noContests} NC` : ''}`);

        return {
            id: slug,
            name,
            wins,
            losses,
            draws,
            noContests,
            winsByKo,
            winsBySub,
            winsByDec,
            height: height || null,
            weight: weight || null,
            reach: reach || null,
            stance: stance || null,
            sigStrikesLandedPerMin,
            takedownAvg,
            imagePath: imageSrc ?? '',
            hometown: hometown || undefined,
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
                'Accept-Language': 'en-US,en;q=1.0',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0',
                'Cookie': 'STYXKEY_region=CANADA_FRENCH.CA.en-can.Default; countryCode=CA',
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
        return response.text();
    }
}
