import { Injectable } from '@nestjs/common';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { Transaction, type DB } from 'src/db/client';
import { InjectDb } from 'src/db/db.provider';
import slugify from 'slugify';
import { RolesService } from './roles.service';
import { PermissionsService } from './permissions.service';
import { publications } from './schemas/publication.schema';
import { DEFAULT_ROLES } from './constants/publications.constant';
import { MembershipService } from './membership.service';
import { and, eq, isNull } from 'drizzle-orm';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { PublicationsHistoryService } from './publicationsHistory.service';

@Injectable()
export class PublicationsService {
  constructor(
    @InjectDb() private readonly db: DB,
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
    private readonly publicationsHistoryService: PublicationsHistoryService,
    private readonly membershipService: MembershipService,
  ) {}

  async create(userId: string, createPublicationDto: CreatePublicationDto) {
    return await this.db.transaction(async (tx) => {
      // so what is the idea here what i want to do?
      // so the idea here is that when a user send request for publication
      // create a new record in publication table
      // add defaults permission
      // add user into members table as owner
      const [publicationRecord] = await tx
        .insert(publications)
        .values({
          ...createPublicationDto,
          owner: userId,
          slug: this.slugify(createPublicationDto.name),
        })
        .returning();

      // getting all the permission

      const permissions = await this.permissionsService.find();
      const permissionMap = new Map(
        permissions.map((permission) => [
          `${permission.resource}:${permission.action}`,
          permission.id,
        ]),
      );

      let roleId = '';
      // adding roles and permissions
      for (const roleTemplate of DEFAULT_ROLES) {
        const role = await this.rolesService.createOne(
          {
            name: roleTemplate.name,
            publicationId: publicationRecord.id,
          },
          tx,
        );

        if (role.name === 'Owner') {
          roleId = role.id;
        }
        if (
          roleTemplate.permissions === 'all' ||
          roleTemplate.permissions.length > 0
        ) {
          let roleToAssign: { roleId: string; permissionId: string }[] = [];
          if (roleTemplate.permissions === 'all') {
            // if user is owner of publication add all permission that are in in db
            roleToAssign = permissions.map((permission) => ({
              roleId: role.id,
              permissionId: permission.id,
            }));
          }
          // else
          else if (
            Array.isArray(roleTemplate.permissions) &&
            roleTemplate.permissions.length > 0
          ) {
            roleToAssign = roleTemplate.permissions.flatMap(
              (permission: string) => {
                const permissionId = permissionMap.get(permission);
                if (!permissionId) return [];
                return {
                  roleId: role.id,
                  permissionId,
                };
              },
            );
          }

          await this.rolesService.assignPermissions(roleToAssign, tx);
        }
      }

      //add user in the membership table as owner
      await this.membershipService.create(
        [
          {
            isOwner: true,
            publicationId: publicationRecord.id,
            userId: userId,
            roleId,
          },
        ],
        tx,
      );

      return publicationRecord;
    });
  }

  async findOne(slug: string, tx?: Transaction) {
    const queryBuilder = tx ?? this.db;
    const publicationRecord = await queryBuilder.query.publications.findFirst({
      where: and(eq(publications.slug, slug), isNull(publications.deletedAt)),
      with: { posts: true, roles: true, members: { with: { role: true } } },
    });

    return publicationRecord;
  }

  async update(
    userId: string,
    publicationId: string,
    updatePublicationDto: UpdatePublicationDto,
  ) {
    return await this.db.transaction(async (tx) => {
      const [publication] = await tx
        .select()
        .from(publications)
        .where(eq(publications.id, publicationId));

      console.log(publication.version);

      await this.publicationsHistoryService.create({
        name: publication.name,
        description: publication.description,
        logo: publication.logo,
        publicationId: publication.id,
        slug: publication.slug,
        createdBy: userId,
        version: (publication.version ?? 0) + 1,
      });
      const [res] = await this.db
        .update(publications)
        .set({
          ...updatePublicationDto,
          version: (publication.version ?? 0) + 1,
        })
        .where(eq(publications.id, publicationId))
        .returning();

      return res;
    });
  }

  async delete(publicationId: string) {
    await this.db
      .update(publications)
      .set({ deletedAt: new Date() })
      .where(eq(publications.id, publicationId));
  }
  private slugify(title: string) {
    return slugify(title);
  }
}
