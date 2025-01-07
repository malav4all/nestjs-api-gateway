import {
  Body,
  Controller,
  Get,
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

  @Post('login')
  async login(@Body() creds: { email: string; password: string }) {
    return this.gatewayService.loginUser(creds);
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
}
