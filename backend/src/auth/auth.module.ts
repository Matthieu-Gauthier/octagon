import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { SupabaseStrategy } from './supabase.strategy';
import { SupabaseGuard } from './supabase.guard';

@Module({
    imports: [ConfigModule, PassportModule],
    providers: [SupabaseStrategy, SupabaseGuard],
    exports: [SupabaseStrategy, SupabaseGuard],
})
export class AuthModule { }
