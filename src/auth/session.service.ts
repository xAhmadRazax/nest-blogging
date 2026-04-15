import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type { DB, Transaction } from 'src/db/client';
import { InjectDb } from 'src/db/db.provider';
import { sessions, SessionsType } from './schemas/sessions.schema';
import { TypeConfigService } from 'src/config/type.config.service';
import ms from 'ms';
import { TypeUserMeta } from './types/auth.type';
import { and, eq, gt, or, SQL } from 'drizzle-orm';

@Injectable()
export class SessionService {
  constructor(
    @InjectDb() private readonly db: DB,
    private readonly configService: TypeConfigService,
    private readonly logger: Logger,
  ) {}
  async create(
    {
      meta,
      tokenFamily,
      tokenHash,
      userId,
    }: {
      meta: TypeUserMeta;
      tokenFamily: string;
      tokenHash: string;
      userId: string;
    },
    tx?: Transaction,
  ) {
    const queryBuilder = tx ? tx : this.db;
    const [session] = await queryBuilder
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

  async sessionRotation({
    meta,
    tokenHash,
    sessionRec,
    tx,
  }: {
    meta: TypeUserMeta;
    sessionRec: SessionsType;
    tokenHash: string;
    tx: Transaction;
  }) {
    const [updatedSession] = await tx
      .insert(sessions)
      .values({
        ...meta,
        tokenFamily: sessionRec.tokenFamily,
        tokenHash,
        userId: sessionRec.userId,
        expiresAt: new Date(
          Date.now() +
            ms(
              this.configService.get('auth', { infer: true })!.tokensExpiry
                .refreshTokenExpiry,
            ),
        ),
      })
      .returning();

    await tx
      .update(sessions)
      .set({ isUsed: true, replacedBy: updatedSession.id })
      .where(eq(sessions.id, sessionRec.id));

    return updatedSession;
  }

  async findByToken(filters?: SQL, tx?: Transaction) {
    const queryBuilder = tx ? tx : this.db;
    const [session] = await queryBuilder.select().from(sessions).where(filters);

    return session;
  }
  async findValidSession(
    {
      hashedVerifier,
      tokenFamily,
    }: {
      hashedVerifier: string;
      tokenFamily: string;
    },
    tx?: Transaction,
    resetCookieHandler?: () => void,
  ) {
    const queryBuilder = tx ? tx : this.db;
    const [session] = await queryBuilder
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.tokenHash, hashedVerifier),
          eq(sessions.tokenFamily, tokenFamily),
          eq(sessions.isRevoked, false),
          eq(sessions.isUsed, false),
          gt(sessions.expiresAt, new Date()),
        ),
      );

    return await this.handleReuseDetection(
      session,
      {
        hashedVerifier,
        tokenFamily,
      },
      tx,
      resetCookieHandler,
    );
  }

  async update(
    updateDto: Partial<SessionsType>,
    filters?: SQL,
    tx?: Transaction,
  ) {
    const queryBuilder = tx ? tx : this.db;
    const [session] = await queryBuilder
      .update(sessions)
      .set(updateDto)
      .where(filters)
      .returning();

    return session;
  }

  async revokeTokenFamily(tokenFamily: string, tx?: Transaction) {
    const queryBuilder = tx ? tx : this.db;
    await queryBuilder
      .update(sessions)
      .set({ isRevoked: true })
      .where(eq(sessions.tokenFamily, tokenFamily));
  }

  private async handleReuseDetection(
    session: SessionsType,
    filters: { hashedVerifier: string; tokenFamily: string },
    tx?: Transaction,
    resetCookiesHandler?: () => void,
  ) {
    if (!session) {
      // if we found no token then we need to check for token reuse
      const sessionExist = await this.findByToken(
        or(
          and(
            eq(sessions.tokenHash, filters.hashedVerifier),
            eq(sessions.tokenFamily, filters.tokenFamily),
          ),
          eq(sessions.tokenFamily, filters.tokenFamily),
        ),
      );
      resetCookiesHandler?.();
      console.log(sessionExist, 'sessionExists');
      // token reuse detected revoke all token with this family
      if (sessionExist) {
        await this.revokeTokenFamily(filters.tokenFamily, tx);

        throw new UnauthorizedException({
          errorType: 'REFRESH_TOKEN_ERROR',
          message: 'token is either reused or expires',
        });
      }

      throw new UnauthorizedException({
        errorType: 'REFRESH_TOKEN_ERROR',
        message: 'Invalid Refresh Token detected',
      });
    }

    return session;
  }
}
