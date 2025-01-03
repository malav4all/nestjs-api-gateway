// src/gateway/gateway.service.ts

import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';
import { Eureka } from 'eureka-js-client';

@Injectable()
export class GatewayService {
  private eurekaClient: Eureka;

  constructor() {
    // Initialize a Eureka client purely for discovery
    // (If you want to re-use the one in main.ts, you'll need a different approach.)
    this.eurekaClient = new Eureka({
      instance: {
        app: 'API-GATEWAY',
        instanceId: 'api-gateway-discovery',
        hostName: 'localhost',
        ipAddr: '127.0.0.1',
        port: { $: 3000, '@enabled': true },
        vipAddress: 'api-gateway',
        dataCenterInfo: {
          '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
          name: 'MyOwn',
        },
      },
      eureka: {
        host: 'localhost',
        port: 8761,
        servicePath: '/eureka/apps/',
      },
    });

    // Start the Eureka client for discovery
    this.eurekaClient.start((error) => {
      if (error) {
        console.error('Eureka discovery client failed to start:', error);
      } else {
        console.log('Eureka discovery client started successfully');
      }
    });
  }

  /**
   * Pick one instance of the given service from Eureka
   */
  private getServiceUrl(serviceName: string): string {
    // Eureka stores app IDs in uppercase
    const appId = serviceName.toUpperCase();

    // getInstancesByAppId returns an array of discovered instances
    const instances = this.eurekaClient.getInstancesByAppId(appId);
    if (!instances || instances.length === 0) {
      throw new HttpException(
        `No instances found for service: ${serviceName}`,
        503
      );
    }

    // For simplicity, pick the first instance
    // You could do round-robin or random if you want load balancing

    const instance = instances[0];
    const host = instance.ipAddr || instance.hostName;
    const port = instance.port.$;
    return `http://${host}:${port}`;
  }

  async getAllUsers() {
    try {
      // If your user microservice is registered as "USER-SERVICE" (for example)
      const serviceUrl = this.getServiceUrl('USER-MICROSERVICE');

      // e.g. calling GET /users
      const response = await axios.get(`${serviceUrl}/users`);
      return response.data;
    } catch (error) {
      console.error('Error calling user service:', error.message);
      throw new HttpException(
        error.response?.data || 'User service error',
        error.response?.status || 500
      );
    }
  }

  async loginUser(creds: { username: string; password: string }) {
    try {
      const serviceUrl = this.getServiceUrl('USER-MICROSERVICE');
      const response = await axios.post(`${serviceUrl}/users/login`, creds);
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'User microservice error',
        error.response?.status || 500
      );
    }
  }
}
