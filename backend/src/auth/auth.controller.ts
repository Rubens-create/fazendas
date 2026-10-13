import { Body, Controller, Get, Header, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { CreateInitialAdminDto } from './dto/create-initial-admin.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Header('Cache-Control', 'no-store')
  @Get('setup-status')
  setupStatus() {
    return this.auth.setupStatus();
  }

  @Post('setup')
  setup(@Body() dto: CreateInitialAdminDto) {
    return this.auth.setup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() request: Request & { user: { sub: string } }) {
    return this.auth.me(request.user.sub);
  }
}
