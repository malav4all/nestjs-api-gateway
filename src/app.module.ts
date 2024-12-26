// src/app.module.ts

import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { GatewayModule } from './gateway/gateway.module';
import { MicroserviceModule } from './microservice/microservice.module';

@Module({
  imports: [
    // Import AuthModule so the global guard is active for the entire app
    AuthModule,
    GatewayModule,
    MicroserviceModule,
  ],
})
export class AppModule {}
