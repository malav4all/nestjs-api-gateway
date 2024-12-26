// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';

interface ApiKeyInfo {
  apiKey: string;
  dailyLimit: number;
  usedToday: number;
  owner: string;
}

@Injectable()
export class AuthService {
  // In-memory store for demonstration
  private apiKeysStore: ApiKeyInfo[] = [
    {
      apiKey: 'TEST_KEY_ABC123', // a default key
      dailyLimit: 100,
      usedToday: 0,
      owner: 'user1',
    },
  ];

  // Validate if key exists
  async validateApiKey(apiKey: string): Promise<boolean> {
    const found = this.apiKeysStore.find((k) => k.apiKey === apiKey);
    return !!found;
  }

  // Check usage within daily limit
  async checkUsage(apiKey: string): Promise<boolean> {
    const info = this.apiKeysStore.find((k) => k.apiKey === apiKey);
    if (!info) return false;
    return info.usedToday < info.dailyLimit;
  }

  // Increment usage count by 1
  async incrementUsage(apiKey: string) {
    const index = this.apiKeysStore.findIndex((k) => k.apiKey === apiKey);
    if (index !== -1) {
      this.apiKeysStore[index].usedToday += 1;
    }
  }

  // Generate new API key with default daily limit 100
  async generateApiKey(owner: string): Promise<string> {
    const newKey = `KEY_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    this.apiKeysStore.push({
      apiKey: newKey,
      dailyLimit: 100,
      usedToday: 0,
      owner,
    });
    return newKey;
  }

  // Reset usage for all keys (call via a cron job if you want daily resets)
  async resetDailyUsage() {
    this.apiKeysStore.forEach((key) => {
      key.usedToday = 0;
    });
  }
}
