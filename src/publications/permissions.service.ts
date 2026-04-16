import { Injectable } from '@nestjs/common';
import { Transaction, type DB } from 'src/db/client';
import { InjectDb } from 'src/db/db.provider';
import { permissions } from './schemas/permissions.schema';
import { DEFAULT_PERMISSIONS } from './constants/publications.constant';

@Injectable()
export class PermissionsService {
  constructor(@InjectDb() private readonly db: DB) {
    // void this.seedDefaultPermission();
  }

  async find(tx?: Transaction) {
    const queryBuilder = tx ?? this.db;
    return await queryBuilder.select().from(permissions);
  }

  private async seedDefaultPermission() {
    await this.db.insert(permissions).values(DEFAULT_PERMISSIONS);
    console.log('permission seeded');
  }
}
