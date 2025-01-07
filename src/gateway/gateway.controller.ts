import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  // Request,
  UseGuards,
} from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
// import { JwtManualGuard } from 'src/auth/jwt-manual.guard';

@Controller('gateway')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @UseGuards(ApiKeyGuard)
  @Get('listUsers')
  async getAllUsers() {
    return this.gatewayService.getAllUsers();
  }

  @Post('ssologin')
  async login(@Body() creds: { email: string; password: string }) {
    return this.gatewayService.ssoUserLogin(creds);
  }

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
