import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { GatewayService } from 'src/gateway/gateway.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly gatewayService: GatewayService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    // Extract API key
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    // 1. Validate API Key
    const user = await this.gatewayService.findApiKeyUser(apiKey);
    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }

    // 2. Check API Key Expiry
    if (user.apiKeyExpiresAt) {
      const expiryDate = new Date(user.apiKeyExpiresAt);
      if (expiryDate.getTime() < Date.now()) {
        throw new UnauthorizedException('API key has expired');
      }
    }

    // 3. Extract the resource
    const resource = this.extractResource(req.path, user.permissionMatrix);
    if (resource === 'unknown') {
      throw new ForbiddenException(`No permissions for resource ${req.path}`);
    }

    // 4. Map HTTP Method to Action
    const action = this.mapHttpToAction(req.method);

    // 5. Check Permissions
    const resourcePerm = user.permissionMatrix[resource];
    if (!resourcePerm || !resourcePerm[action]?.allowed) {
      throw new ForbiddenException(`Not allowed to ${action} on ${resource}`);
    }

    // 6. Validate Endpoint
    const perm = resourcePerm[action];
    if (perm.allowedEndpoints && perm.allowedEndpoints.length > 0) {
      const subPath = this.extractSubPath(req.path);
      const isAllowed = perm.allowedEndpoints.some(
        (endpoint) => endpoint.name === subPath && endpoint.allowed
      );
      if (!isAllowed) {
        throw new ForbiddenException(
          `Endpoint ${subPath} not allowed for ${action} on ${resource}`
        );
      }
    }

    // 7. Enforce Usage Limits
    if (perm.limit !== undefined) {
      const usageKey = `${resource}.${action}`;
      user.usageCounters = user.usageCounters || {};

      if (
        perm.limit === 0 ||
        (user.usageCounters[usageKey] || 0) >= perm.limit
      ) {
        throw new ForbiddenException(`${action} limit exceeded on ${resource}`);
      }

      // Increment usage counter
      user.usageCounters[usageKey] = (user.usageCounters[usageKey] || 0) + 1;

      // Update user's usage counters and permission matrix
      await this.gatewayService.updateUserUsage(
        user._id,
        user.usageCounters,
        user.permissionMatrix
      );
    }

    // Attach user to the request
    (req as any).user = user;

    return true;
  }

  // Map HTTP methods to domain actions
  private mapHttpToAction(
    method: string
  ): 'read' | 'write' | 'update' | 'delete' {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'read';
      case 'POST':
        return 'write';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'read'; // Default to "read"
    }
  }

  // Extract resource from path
  private extractResource(
    fullPath: string,
    permissionMatrix: Record<string, any>
  ): string {
    const parts = fullPath.split('/').filter(Boolean); // e.g., ["gateway", "listUsers"]

    if (parts[0] === 'gateway' && parts.length > 1) {
      const subPath = parts[1]; // e.g., "listUsers"

      // Check all resources and their allowed endpoints
      for (const [resource, actions] of Object.entries(permissionMatrix)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [action, details] of Object.entries(actions) as any) {
          if (
            details?.allowedEndpoints?.some(
              (endpoint: any) => endpoint.name === subPath
            )
          ) {
            return resource;
          }
        }
      }
    }

    return 'unknown'; // Default if no resource matches
  }

  // Extract normalized sub-path for dynamic patterns
  private extractSubPath(fullPath: string): string {
    const parts = fullPath.split('/').filter(Boolean); // e.g., ["gateway", "fetchById"]

    if (parts.length > 1) {
      const endpoint = parts[1];

      // Define dynamic patterns
      const dynamicPatterns = [
        { pattern: /^fetchById$/, normalized: 'fetchById' },
        { pattern: /^getDetails$/, normalized: 'getDetails' },
      ];

      const matchedPattern = dynamicPatterns.find((entry) =>
        endpoint.match(entry.pattern)
      );

      if (matchedPattern) {
        return matchedPattern.normalized;
      }
    }

    return parts.slice(1).join('/') || '';
  }
}
