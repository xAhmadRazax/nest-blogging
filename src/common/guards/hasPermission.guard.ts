import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { and, eq, isNull } from 'drizzle-orm';
import { Request } from 'express';
import { type DB } from 'src/db/client';
import { InjectDb } from 'src/db/db.provider';
import { memberships, publications } from 'src/db/schema';

// common/guards/permission.guard.ts
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectDb() private readonly db: DB,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<string>(
      'permission',
      context.getHandler(),
    );

    // no permission required on this route
    if (!required) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const publicationId = req.params.id as string;

    const user = req.user;

    if (!user) {
      throw new UnauthorizedException(
        `Unauthorized access to ${req.protocol}://${req.get('host')}${req.url},  please login to access ${req.protocol}://${req.get('host')}${req.url}`,
      );
    }

    const membersWithPublicationsAndRoles =
      await this.db.query.memberships.findFirst({
        where: and(
          eq(memberships.publicationId, publicationId),
          eq(memberships.userId, user.id),
        ),
        with: {
          publication: true,
          role: { with: { rolePermissions: { with: { permission: true } } } },
        },
      });

    if (!membersWithPublicationsAndRoles) {
      throw new ForbiddenException(
        'You do not have the permission to perform this actions',
      );
    }

    if (membersWithPublicationsAndRoles?.publication.deletedAt) {
      throw new NotFoundException(
        `Publication with ${publicationId} no longer exist`,
      );
    }

    // bypassing the check for owner allowing him full access
    if (membersWithPublicationsAndRoles.isOwner) {
      return true;
    }

    const userPermissions = new Map(
      membersWithPublicationsAndRoles.role.rolePermissions.map(
        (rolePermission) => [
          `${rolePermission.permission.resource}:${rolePermission.permission.action}`.trim(),
          true,
        ],
      ),
    );

    if (!userPermissions.has(required)) {
      throw new ForbiddenException(
        'You do not have the permission to perform this actions',
      );
    }

    return true;
  }
}
