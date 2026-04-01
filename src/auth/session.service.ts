import { Logger } from '@nestjs/common';
import type { DB } from 'src/db/client';
import { InjectDb } from 'src/db/db.provider';
import { sessions } from './schemas/sessions.entity';
import { TypeConfigService } from 'src/config/type.config.service';
import ms from 'ms';
import { TypeUserMeta } from './types/auth.type';

export class SessionService {
  constructor(
    @InjectDb() private readonly db: DB,
    private readonly configService: TypeConfigService,
    private readonly logger: Logger,
  ) {}
  async create({
    meta,
    tokenFamily,
    tokenHash,
    userId,
  }: {
    meta: TypeUserMeta;
    tokenFamily: string;
    tokenHash: string;
    userId: string;
  }) {
    const session = await this.db
      .insert(sessions)
      .values({
        ...meta,
        tokenFamily,
        tokenHash,
        userId,
        expiresAt: new Date(
          Date.now() +
            ms(
              this.configService.get('auth', { infer: true })!.refreshToken
                .expiresIn,
            ),
        ),
      })
      .returning();

    return session;
  }
}
