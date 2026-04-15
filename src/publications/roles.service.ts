import { Injectable } from '@nestjs/common';
import { Transaction, type DB } from 'src/db/client';
import { CreateRoleDto } from './dto/create-role.dto';
import { roles } from './schemas/roles.schema';
import { InjectDb } from 'src/db/db.provider';
import { CreateManyRoleDto } from './dto/create-many-roles';
import { rolesPermissions } from './schemas/roles-permissions.schema';

@Injectable()
export class RolesService {
  constructor(@InjectDb() private readonly db: DB) {
    console.log('RolesService: im called');
  }

  async createOne(createRoleDto: CreateRoleDto, tx?: Transaction) {
    const queryBuilder = tx ? tx : this.db;
    const [role] = await queryBuilder
      .insert(roles)
      .values(createRoleDto)
      .returning();
    return role;
  }
  async createMany(createManyRoleDto: CreateManyRoleDto, tx?: Transaction) {
    const queryBuilder = tx ?? this.db;
    const role = await queryBuilder
      .insert(roles)
      .values(createManyRoleDto)
      .returning();
    return role;
  }

  async assignPermissions(
    permissions: {
      roleId: string;
      permissionId: string;
    }[],
    tx?: Transaction,
  ) {
    const queryBuilder = tx ?? this.db;

    return await queryBuilder
      .insert(rolesPermissions)
      .values(permissions)
      .returning();
  }
  async updatePermissions() {}

  async findWithPermissions() {}
}
