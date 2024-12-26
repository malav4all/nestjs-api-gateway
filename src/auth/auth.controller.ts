// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('generate-key')
  async generateApiKey(@Body('owner') owner: string) {
    if (!owner) {
      throw new Error('owner is required');
    }
    const apiKey = await this.authService.generateApiKey(owner);
    return { apiKey };
  }
}
