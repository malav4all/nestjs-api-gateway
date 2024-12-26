// src/auth/api-key.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);
    if (!apiKey) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    const isValid = await this.authService.validateApiKey(apiKey);
    if (!isValid) {
      throw new UnauthorizedException('Invalid API key');
    }

    const underLimit = await this.authService.checkUsage(apiKey);
    if (!underLimit) {
      throw new ForbiddenException('API usage limit exceeded');
    }

    // If OK, increment usage
    await this.authService.incrementUsage(apiKey);
    return true;
  }

  private extractApiKey(request: any): string | null {
    // Reading from x-api-key header
    return request.headers['x-api-key'] || null;
  }
}
