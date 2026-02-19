import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseStrategy } from './supabase.strategy';
import { ConfigService } from '@nestjs/config';

describe('SupabaseStrategy', () => {
    let strategy: SupabaseStrategy;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SupabaseStrategy,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('some-jwt-secret'),
                    },
                },
            ],
        }).compile();

        strategy = module.get<SupabaseStrategy>(SupabaseStrategy);
        configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
        expect(strategy).toBeDefined();
    });

    it('should validate and return the payload', async () => {
        const payload = { sub: 'user-123', email: 'test@example.com' };
        const result = await strategy.validate(payload);
        expect(result).toEqual(payload);
    });
});
