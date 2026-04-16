import { Injectable } from '@nestjs/common';
import { InjectDb } from 'src/db/db.provider';
import { Transaction, type DB } from 'src/db/client';
import { publicationVersions } from './schemas/publication-versions.schema';
import { and, desc, eq } from 'drizzle-orm';

@Injectable()
export class PublicationVersionsService {
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

    await queryBuilder.insert(publicationVersions).values({
      publicationId,
      name,
      description,
      slug,
      logo,
      version: version,
      changedBy: createdBy,
    });
  }

  async find(publicationId: string, tx?: Transaction) {
    const queryBuilder = tx ?? this.db;
    return await queryBuilder.query.publicationVersions.findMany({
      where: eq(publicationVersions.publicationId, publicationId),
      orderBy: [desc(publicationVersions.version)],
    });
  }

  async findOne(
    publicationId: string,
    publicationVersionId: string,
    tx?: Transaction,
  ) {
    const queryBuilder = tx ?? this.db;

    return await queryBuilder.query.publicationVersions.findFirst({
      where: and(
        eq(publicationVersions.publicationId, publicationId),
        eq(publicationVersions.id, publicationVersionId),
      ),
      orderBy: [desc(publicationVersions.version)],
    });
  }
}
