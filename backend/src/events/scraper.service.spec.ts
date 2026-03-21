/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-require-imports */
import { Test, TestingModule } from '@nestjs/testing';
import { ScraperService } from './scraper.service';

// Helper to build minimal UFC event page HTML with optional section timestamps
function buildEventHtml(
  options: {
    mainCardTimestamp?: string;
    prelimsTimestamp?: string;
  } = {},
): string {
  const mainCardSection = options.mainCardTimestamp
    ? `<div id="main-card">
             <div class="c-event-fight-card-broadcaster__time tz-change-inner"
                  data-timestamp="${options.mainCardTimestamp}"
                  data-format="D, M j / g:i A T">Sat, Feb 21 / 9:00 PM EST</div>
           </div>`
    : `<div id="main-card"></div>`;

  const prelimsSection = options.prelimsTimestamp
    ? `<div id="prelims-card">
             <div class="c-event-fight-card-broadcaster__time tz-change-inner"
                  data-timestamp="${options.prelimsTimestamp}"
                  data-format="D, M j / g:i A T">Sat, Feb 21 / 6:00 PM EST</div>
           </div>`
    : `<div id="prelims-card"></div>`;

  return `<html><body>${mainCardSection}${prelimsSection}</body></html>`;
}

describe('ScraperService', () => {
  let service: ScraperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScraperService],
    }).compile();

    service = module.get<ScraperService>(ScraperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractSectionTimestamp (via scrapeNextEvent integration)', () => {
    // We test the private helper indirectly by using cheerio the same way as the service.
    // For a direct unit test we expose the method via any-cast.

    it('T006: should extract both timestamps when both sections are present', () => {
      const cheerio = require('cheerio');
      const html = buildEventHtml({
        mainCardTimestamp: '1771711200',
        prelimsTimestamp: '1771700400',
      });
      const $ = cheerio.load(html);

      const extract = (svcInstance: any, sectionId: string) =>
        svcInstance.extractSectionTimestamp($, sectionId);

      const mainCardStartAt = extract(service as any, '#main-card');
      const prelimsStartAt = extract(service as any, '#prelims-card');

      expect(mainCardStartAt).toBeInstanceOf(Date);
      expect(prelimsStartAt).toBeInstanceOf(Date);
      expect(mainCardStartAt?.getTime()).toBe(1771711200 * 1000);
      expect(prelimsStartAt?.getTime()).toBe(1771700400 * 1000);
    });

    it('T007: should extract only mainCardStartAt when only #main-card has timestamp', () => {
      const cheerio = require('cheerio');
      const html = buildEventHtml({ mainCardTimestamp: '1771711200' });
      const $ = cheerio.load(html);

      const extract = (svcInstance: any, sectionId: string) =>
        svcInstance.extractSectionTimestamp($, sectionId);

      const mainCardStartAt = extract(service as any, '#main-card');
      const prelimsStartAt = extract(service as any, '#prelims-card');

      expect(mainCardStartAt).toBeInstanceOf(Date);
      expect(mainCardStartAt?.getTime()).toBe(1771711200 * 1000);
      expect(prelimsStartAt).toBeUndefined();
    });

    it('T008: should return undefined for both when no timestamps are present', () => {
      const cheerio = require('cheerio');
      const html = buildEventHtml(); // no timestamps
      const $ = cheerio.load(html);

      const extract = (svcInstance: any, sectionId: string) =>
        svcInstance.extractSectionTimestamp($, sectionId);

      expect(extract(service as any, '#main-card')).toBeUndefined();
      expect(extract(service as any, '#prelims-card')).toBeUndefined();
    });
  });

  describe('scrapeNextEvent', () => {
    it('should return null when no event links are found in the HTML', async () => {
      // Mock the private fetchHtml method so no real HTTP call is made
      jest
        .spyOn(service as any, 'fetchHtml')
        .mockResolvedValue('<html><body></body></html>');

      const result = await service.scrapeNextEvent();
      expect(result).toBeNull();
    });

    it('T005: should parse recent form correctly', async () => {
      // Mock fetchHtml to return a static HTML representing a fighter with a recent win and a loss
      jest.spyOn(service as any, 'fetchHtml').mockResolvedValue(`
        <html><body>
          <h1 class="hero-profile__name">Jon Jones</h1>
          <p class="hero-profile__division-body">27-1-0, 1 NC (W-L-D)</p>
          <div class="athlete-record">
            <div class="c-card-event--athlete-results">
              <div class="c-card-event--athlete-results__image c-card-event--athlete-results__red-image">
                <a href="/athlete/jon-jones"></a>
                <div class="c-card-event--athlete-results__plaque win"></div>
              </div>
              <div class="c-card-event--athlete-results__result">
                 <div class="c-card-event--athlete-results__result-label">Method</div>
                 <div class="c-card-event--athlete-results__result-text">KO/TKO</div>
              </div>
            </div>
            <div class="c-card-event--athlete-results">
              <div class="c-card-event--athlete-results__image c-card-event--athlete-results__red-image">
                <a href="/athlete/jon-jones"></a>
              </div>
              <div class="c-card-event--athlete-results__image c-card-event--athlete-results__blue-image win">
                <a href="/athlete/dominick-reyes"></a>
                <div class="c-card-event--athlete-results__plaque win"></div>
              </div>
              <div class="c-card-event--athlete-results__result">
                 <div class="c-card-event--athlete-results__result-label">Method</div>
                 <div class="c-card-event--athlete-results__result-text">Decision</div>
              </div>
            </div>
          </div>
        </body></html>
      `);

      const fighter = await (service as any).scrapeFighter('jon-jones');
      expect(fighter.recentForm).toBeDefined();
      expect(fighter.recentForm.length).toBe(2);
      expect(fighter.recentForm[0].result).toBe('W');
      expect(fighter.recentForm[0].method).toBe('KO/TKO');
      expect(fighter.recentForm[1].result).toBe('L'); // No win banner for Jon Jones
      expect(fighter.recentForm[1].method).toBe('Decision');
    });
  });

  describe('scrapeFighter - nickname extraction', () => {
    const buildFighterHtml = (nicknameHtml: string) => `
      <html><body>
        <h1 class="hero-profile__name">Test Fighter</h1>
        <p class="hero-profile__division-body">10-2-0 (W-L-D)</p>
        ${nicknameHtml}
      </body></html>
    `;

    it('should scrape and strip typographic double quotes from nickname', async () => {
      jest.spyOn(service as any, 'fetchHtml').mockResolvedValue(
        buildFighterHtml('<p class="hero-profile__nickname">\u201cThe Machine\u201d</p>'),
      );
      const fighter = await (service as any).scrapeFighter('test-fighter');
      expect(fighter.nickname).toBe('The Machine');
    });

    it('should scrape and strip ASCII double quotes from nickname', async () => {
      jest.spyOn(service as any, 'fetchHtml').mockResolvedValue(
        buildFighterHtml('<p class="hero-profile__nickname">"The Notorious"</p>'),
      );
      const fighter = await (service as any).scrapeFighter('test-fighter');
      expect(fighter.nickname).toBe('The Notorious');
    });

    it('should return undefined when no nickname element is present', async () => {
      jest.spyOn(service as any, 'fetchHtml').mockResolvedValue(
        buildFighterHtml(''),
      );
      const fighter = await (service as any).scrapeFighter('test-fighter');
      expect(fighter.nickname).toBeUndefined();
    });

    it('should return undefined when nickname element is empty', async () => {
      jest.spyOn(service as any, 'fetchHtml').mockResolvedValue(
        buildFighterHtml('<p class="hero-profile__nickname"></p>'),
      );
      const fighter = await (service as any).scrapeFighter('test-fighter');
      expect(fighter.nickname).toBeUndefined();
    });

    it('should return undefined when nickname element contains only whitespace', async () => {
      jest.spyOn(service as any, 'fetchHtml').mockResolvedValue(
        buildFighterHtml('<p class="hero-profile__nickname">   </p>'),
      );
      const fighter = await (service as any).scrapeFighter('test-fighter');
      expect(fighter.nickname).toBeUndefined();
    });
  });
});
