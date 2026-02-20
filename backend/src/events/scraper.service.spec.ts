import { Test, TestingModule } from '@nestjs/testing';
import { ScraperService } from './scraper.service';

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

    describe('scrapeNextEvent', () => {
        it('should return null if not implemented yet', async () => {
            const result = await service.scrapeNextEvent();
            expect(result).toBeNull();
            // TODO: This test will fail when actually implemented and mocked to return data.
            // When T009 is implemented, we should mock `fetch` or Axios and assert cheerio selectors behavior.
        });
    });
});
