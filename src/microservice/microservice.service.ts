// src/microservice-proxy/microservice.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class MicroserviceService {
  fetchData(param: string): string {
    return `Data from microservice for param: ${param}`;
  }
}
