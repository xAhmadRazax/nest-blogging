import { Injectable } from '@nestjs/common';
import { InjectDb } from 'src/db/db.provider';
import { Transaction, type DB } from 'src/db/client';
import { publicationsHistory } from './schemas/publication-history.schema';

@Injectable()
export class PublicationsHistoryService {
  constructor(@InjectDb() private readonly db: DB) {}

  async create(
    {
      name,
      slug,
      logo,
      description,
      publicationId,
      createdBy,
      version,
    }: {
      publicationId: string;
      name: string;
      description: string | null;
      logo: string | null;
      slug: string;
      createdBy: string;
      version: number;
    },
    tx?: Transaction,
  ) {
    const queryBuilder = tx ?? this.db;

    await queryBuilder.insert(publicationsHistory).values({
      publicationId,
      name,
      description,
      slug,
      logo,
      version: version,
      changedBy: createdBy,
    });
  }
}
