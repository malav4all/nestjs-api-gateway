import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  // Request,
  UseGuards,
} from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { JwtManualGuard } from 'src/auth/jwt-manual.guard';

@Controller('gateway')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @UseGuards(JwtManualGuard)
  @Get('listClient')
  async getAllUsers() {
    return this.gatewayService.getAllClient();
  }

  @UseGuards(JwtManualGuard)
  @Post('createClient')
  async createClient(
    @Body()
    creds: {
      name: string;
      email: string;
      password: string;
      apiKey: string;
      apiKeyExpiresAt: any;
      roles: string[];
      permissionMatrix: Record<string, any>;
      usageCounters: Record<string, any>;
    }
  ) {
    return this.gatewayService.createClient(creds);
  }

  @UseGuards(JwtManualGuard)
  @Patch('clientChangePassword/:id')
  async changePassword(
    @Param('id') id: string,
    @Body() creds: { oldPassword: string; newPassword: string }
  ) {
    return this.gatewayService.clientChangePassword(creds, id);
  }

  @Post('ssologin')
  async login(@Body() creds: { email: string; password: string }) {
    return this.gatewayService.ssoUserLogin(creds);
  }

  @Post('clientLogin')
  async clientLogin(@Body() creds: { email: string; password: string }) {
    return this.gatewayService.clientLogin(creds);
  }

  @UseGuards(JwtManualGuard)
  @Post('createSsoUser')
  async createSsoUser(
    @Body()
    creds: {
      name: string;
      email: string;
      password: string;
      company: string;
      role: string[];
    }
  ) {
    return this.gatewayService.createSsoUser(creds);
  }

  @UseGuards(ApiKeyGuard)
  @Get('listProducts')
  async getAllProducts() {
    return this.gatewayService.getAllProducts();
  }

  @UseGuards(ApiKeyGuard)
  @Post('createProduct')
  async createProduct(
    @Body()
    creds: {
      name: string;
      price: number;
      description: string;
      isActive: boolean;
    }
  ) {
    return this.gatewayService.createProduct(creds);
  }

  @UseGuards(ApiKeyGuard)
  @Get('fetchById/:id')
  async findOne(@Param('id') id: string) {
    return this.gatewayService.getProductsById(id);
  }
}
