import { Injectable } from '@nestjs/common';
import { Transaction, type DB } from 'src/db/client';
import { memberships } from './schemas/memberships.schema';
import { InjectDb } from 'src/db/db.provider';
import { CreateMembershipParams } from './types/permissions.types';

@Injectable()
export class MembershipService {
  constructor(@InjectDb() private readonly db: DB) {}

  async create(params: CreateMembershipParams, tx?: Transaction) {
    const queryBuilder = tx ? tx : this.db;
    const [membership] = await queryBuilder
      .insert(memberships)
      .values(params)
      .returning();
    return membership;
  }
}
