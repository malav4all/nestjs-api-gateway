// src/microservice-proxy/microservice.module.ts
import { Module } from '@nestjs/common';
import { MicroserviceService } from './microservice.service';

@Module({
  providers: [MicroserviceService],
  exports: [MicroserviceService],
})
export class MicroserviceModule {}
