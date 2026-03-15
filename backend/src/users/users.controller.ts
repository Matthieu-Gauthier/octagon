import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(SupabaseGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@Req() req: { user: { sub: string } }) {
    return this.usersService.findMe(req.user.sub);
  }

  @Patch('me')
  updateMe(
    @Req() req: { user: { sub: string } },
    @Body() body: { username: string },
  ) {
    return this.usersService.updateDisplayName(req.user.sub, body.username);
  }
}
