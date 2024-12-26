// src/gateway/gateway.module.ts
import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { MicroserviceModule } from 'src/microservice/microservice.module';
import { AuthModule } from 'src/auth/auth.module';

// We must import MicroserviceModule to access MicroserviceService
// import { MicroserviceModule } from '../microservice-proxy/microservice.module';

@Module({
  imports: [MicroserviceModule, AuthModule],
  providers: [GatewayService],
  controllers: [GatewayController],
})
export class GatewayModule {}
