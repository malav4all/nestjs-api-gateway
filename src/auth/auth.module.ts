// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GatewayService } from 'src/gateway/gateway.service';

@Module({
  providers: [AuthService, GatewayService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
