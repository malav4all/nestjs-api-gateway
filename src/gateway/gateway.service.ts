// src/gateway/gateway.service.ts

import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GatewayService {
  private USER_MS_BASE = 'http://localhost:4000';
  async getAllUsers() {
    try {
      const response = await axios.get(`${this.USER_MS_BASE}/users`);
      return response.data;
    } catch (error) {
      // If microservice returns an error, rethrow or transform it
      throw new HttpException(
        error.response?.data || 'User microservice error',
        error.response?.status || 500
      );
    }
  }

  async loginUser(creds: { username: string; password: string }) {
    try {
      // POST /auth/login with creds in the request body
      console.log(creds);
      const response = await axios.post(
        `${this.USER_MS_BASE}/users/login`,
        creds // { username, password }
      );
      console.log(response);
      // The microservice likely returns { accessToken: '...' }
      return response.data;
    } catch (error) {
      // Rethrow or transform the microservice error
      throw new HttpException(
        error.response?.data || 'User microservice error',
        error.response?.status || 500
      );
    }
  }
}
