import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { GatewayService } from './gateway.service';
// import { ApiKeyGuard } from '../auth/api-key.guard';
import { JwtManualGuard } from 'src/auth/jwt-manual.guard';

@Controller('gateway')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @UseGuards(JwtManualGuard)
  @Get('users')
  async getAllUsers() {
    return this.gatewayService.getAllUsers();
  }

  @Post('login')
  async login(@Body() creds: { username: string; password: string }) {
    return this.gatewayService.loginUser(creds);
  }

  @Get('protected')
  @UseGuards(JwtManualGuard)
  getProtectedResource(@Request() req) {
    return {
      message: 'Protected data via API Gateway',
      userPayload: req.user,
    };
  }
}
