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
    // if (user.apiKeyExpiresAt && user.apiKeyExpiresAt.getTime() < Date.now()) {
    //   throw new UnauthorizedException('API key has expired');
    // }

    // 3. Extract the resource from the path (e.g., "users")
    const resource = this.extractResource(req.path);

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
    console.log(perm.limit);
    // // 7. Enforce usage limits if defined
    if (perm.limit) {
      const usageKey: string = `${resource}.${action}`;

      // Ensure usageCounters is initialized
      if (!user.usageCounters) {
        user.usageCounters = {};
      }

      // Increment usage counter
      user.usageCounters[usageKey] = (user.usageCounters[usageKey] || 0) + 1;

      console.log(
        `Current usage for ${usageKey}:`,
        user.usageCounters[usageKey]
      );

      // Decrease the limit dynamically
      perm.limit -= 1;

      console.log(`Remaining limit for ${action} on ${resource}:`, perm.limit);

      // Check if the usage limit is exceeded
      if (perm.limit < 0) {
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
  private extractResource(fullPath: string): string {
    const parts = fullPath.split('/').filter(Boolean); // e.g., ["gateway", "listUsers"]
    if (parts[0] === 'gateway' && parts.length > 1) {
      // Map sub-paths under "gateway" to specific resources
      const subPath = parts[1];
      if (subPath.startsWith('list') || subPath.startsWith('get')) {
        return 'users'; // Map "listUsers" or "getUser" to "users"
      }
      if (subPath.startsWith('create') || subPath.startsWith('add')) {
        return 'users'; // Map "createUser" or "addUser" to "users"
      }
      if (subPath.startsWith('update')) {
        return 'users'; // Map "updateUser" to "users"
      }
      if (subPath.startsWith('delete')) {
        return 'users'; // Map "deleteUser" to "users"
      }
    }
    return parts[0]?.toLowerCase() || 'unknown'; // Default to the first segment
  }

  // Extract the sub-path for endpoint-specific permissions
  private extractSubPath(fullPath: string): string {
    const parts = fullPath.split('/').filter(Boolean); // e.g., ["gateway", "listUsers"]
    return parts.slice(1).join('/') || ''; // e.g., "listUsers"
  }
}
