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
    const publication = await this.db.query.publications.findFirst({
      where: and(
        eq(publications.id, publicationId),
        isNull(publications.deletedAt),
      ),
    });

    if (!publication) {
      throw new NotFoundException(
        `Publication with ${publicationId} no longer exist`,
      );
    }

    const membersWithPublicationsAndRoles =
      await this.db.query.memberships.findFirst({
        where: and(
          eq(memberships.publicationId, publicationId),
          eq(memberships.userId, user.id),
        ),
        with: {
          role: { with: { rolePermissions: { with: { permission: true } } } },
        },
      });

    if (!membersWithPublicationsAndRoles) {
      throw new ForbiddenException(
        'You do not have the permission to perform this actions',
      );
    }

    const userPermissions = new Map(
      membersWithPublicationsAndRoles.role.rolePermissions.map(
        (rolePermission) => [
          `${rolePermission.permission.resource}:${rolePermission.permission.action}`.trim(),
          true,
        ],
      ),
    );

    console.log(userPermissions);

    if (!userPermissions.has(required)) {
      throw new ForbiddenException(
        'You do not have the permission to perform this actions',
      );
    }

    // check if owner first - owners bypass everything
    // const membership = await this.db.query.memberships.findFirst({
    //   where: and(
    //     eq(memberships.userId, user.id),
    //     eq(memberships.publicationId, publicationId),
    //   ),
    //   with: {
    //     role: {
    //       with: {
    //         rolePermissions: {
    //           with: { permission: true },
    //         },
    //       },
    //     },
    //   },
    // });

    // if (!membership) throw new ForbiddenException();
    // if (membership.isOwner) return true; // owner can do everything

    // // check if role has required permission
    // const hasPermission = membership.role.rolePermissions.some(
    //   (rp) =>
    //     rp.permission.resource === required.resource &&
    //     rp.permission.action === required.action,
    // );

    // if (!hasPermission) throw new ForbiddenException();
    return true;
  }
}
