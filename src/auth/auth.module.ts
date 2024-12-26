// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  // <-- CRITICAL: Export AuthService so other modules can use it
  exports: [AuthService],
})
export class AuthModule {}
