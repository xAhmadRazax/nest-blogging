import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type { DB } from 'src/db/client';
import { InjectDb } from 'src/db/db.provider';
import { sessions } from './schemas/sessions.schema';
import { TypeConfigService } from 'src/config/type.config.service';
import ms from 'ms';
import { TypeUserMeta } from './types/auth.type';
import { and, eq } from 'drizzle-orm';

@Injectable()
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
              this.configService.get('auth', { infer: true })!.tokensExpiry
                .refreshTokenExpiry,
            ),
        ),
      })
      .returning();

    return session;
  }

  async sessionRotation(
    {
      meta,
      tokenHash,
      userId,
    }: {
      meta: TypeUserMeta;
      tokenHash: string;
      userId: string;
    },
    context: { url: string; email: string },
  ) {
    await this.db.transaction(async (tx) => {
      const [session] = await tx
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            eq(sessions.isUsed, false),
            eq(sessions.isRevoked, false),
          ),
        );

      if (!session.id) {
        this.logger.warn({
          errorType: 'INVALID_SESSION',
          userId,
          email: context.email,
          path: context.url,
        });
        throw new UnauthorizedException('Invalid Session Please Login again');
      }

      const [updatedSession] = await this.db
        .insert(sessions)
        .values({
          ...meta,
          tokenFamily: session.tokenFamily,
          tokenHash,
          userId,
          expiresAt: new Date(
            Date.now() +
              ms(
                this.configService.get('auth', { infer: true })!.tokensExpiry
                  .refreshTokenExpiry,
              ),
          ),
        })
        .returning();

      await this.db
        .update(sessions)
        .set({ isUsed: true, replacedBy: updatedSession.id })
        .where(eq(sessions.id, session.id));

      return updatedSession;
    });
  }
}
