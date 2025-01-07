// src/auth/api-key.guard.ts
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
    console.log(req);
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    // 1. Lookup user by API key
    const user = await this.gatewayService.findApiKeyUser(apiKey);
    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }

    // 2. Optional: Check if API key is expired
    if (user.apiKeyExpiresAt) {
      const expiryDate = new Date(user.apiKeyExpiresAt);
      const currentDate = new Date();

      console.log(`API Key Expiry: ${expiryDate}`);
      console.log(`Current Time: ${currentDate}`);

      if (expiryDate.getTime() < currentDate.getTime()) {
        throw new UnauthorizedException('API key has expired');
      }
    }

    // 3. Extract the resource from the path (e.g., "users")
    const resource = this.extractResource(req.path, user.permissionMatrix);
    if (resource === 'unknown') {
      throw new ForbiddenException(`No permissions for resource ${req.path}`);
    }

    // 4. Map the HTTP method to a domain-specific action (read/write/update/delete)
    const action = this.mapHttpToAction(req.method);

    // 5. Check if the user has permission for the extracted resource and action
    const resourcePerm = user.permissionMatrix[resource];
    if (!resourcePerm) {
      throw new ForbiddenException(`No permissions for resource ${resource}`);
    }

    const perm = resourcePerm[action];
    if (!perm || !perm.allowed) {
      throw new ForbiddenException(`Not allowed to ${action} on ${resource}`);
    }

    // 6. Optional: Check if the endpoint is in the allowed list for this action
    if (perm.allowedEndpoints && perm.allowedEndpoints.length > 0) {
      const subPath = this.extractSubPath(req.path);
      const match = perm.allowedEndpoints.some(
        (endpoint) => endpoint === subPath
      );
      if (!match) {
        throw new ForbiddenException(
          `Endpoint ${subPath} not allowed for ${action} on ${resource}`
        );
      }
    }

    // // 7. Enforce usage limits if defined
    if (perm.limit !== undefined) {
      const usageKey: string = `${resource}.${action}`;

      // Ensure usageCounters is initialized
      if (!user.usageCounters) {
        user.usageCounters = {};
      }

      // Check if the limit is 0 and immediately reject
      if (perm.limit === 0) {
        throw new ForbiddenException(
          `${action} is not allowed for ${resource}`
        );
      }

      // Increment usage counter
      user.usageCounters[usageKey] = (user.usageCounters[usageKey] || 0) + 1;

      // Check if the usage limit is exceeded
      if (user.usageCounters[usageKey] > perm.limit) {
        throw new ForbiddenException(`${action} limit exceeded on ${resource}`);
      }

      // Save updated usageCounters and permissionMatrix
      await this.gatewayService.updateUserUsage(
        user._id,
        user.usageCounters,
        user.permissionMatrix
      );
    }

    // 8. Attach user to request (for downstream use)
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
        return 'read'; // Default to "read" for unhandled methods
    }
  }

  // Extract the resource name from the path
  private extractResource(
    fullPath: string,
    permissionMatrix: Record<string, any>
  ): string {
    const parts = fullPath.split('/').filter(Boolean); // e.g., ["gateway", "listUsers"]

    if (parts[0] === 'gateway' && parts.length > 1) {
      const subPath = parts[1]; // e.g., "listUsers"

      // Dynamically determine the resource from the permission matrix
      for (const [resource, actions] of Object.entries(permissionMatrix)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [action, details] of Object.entries(actions) as any) {
          if (details?.allowedEndpoints?.includes(subPath)) {
            return resource; // Return the matched resource
          }
        }
      }
    }

    return 'unknown'; // Return 'unknown' if no resource matches
  }

  private extractSubPath(fullPath: string): string {
    const parts = fullPath.split('/').filter(Boolean); // e.g., ["gateway", "fetchById", "12345"]

    if (parts.length > 1) {
      const endpoint = parts[1];

      // Define a mapping of dynamic patterns to their normalized keys
      const dynamicPatterns = [
        { pattern: /^fetchById$/, normalized: 'fetchById' },
        { pattern: /^getDetails$/, normalized: 'getDetails' }, // Add more dynamic patterns as needed
      ];

      // Match the current endpoint against the dynamic patterns
      const matchedPattern = dynamicPatterns.find((entry) =>
        endpoint.match(entry.pattern)
      );

      if (matchedPattern) {
        return matchedPattern.normalized; // Return the normalized key for the dynamic endpoint
      }
    }

    return parts.slice(1).join('/') || ''; // Default behavior for other paths
  }
}
