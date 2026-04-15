import { Injectable } from '@nestjs/common';
import { Transaction, type DB } from 'src/db/client';
import { memberships } from './schemas/memberships.schema';
import { InjectDb } from 'src/db/db.provider';
import { AssignPermissionsParams } from './types/permissions.types';

@Injectable()
export class MembershipService {
  constructor(@InjectDb() private readonly db: DB) {}

  async create(
    assignPermissionsParams: AssignPermissionsParams,
    tx?: Transaction,
  ) {
    const queryBuilder = tx ? tx : this.db;
    const [membership] = await queryBuilder
      .insert(memberships)
      .values(assignPermissionsParams)
      .returning();
    return membership;
  }
}
