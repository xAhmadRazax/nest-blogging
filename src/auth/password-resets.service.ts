import { Logger } from '@nestjs/common';
import { eq, and, gt, isNull } from 'drizzle-orm';
import ms from 'ms';
import { InjectDb } from 'src/db/db.provider';
import { TypeConfigService } from 'src/config/type.config.service';
import type { DB, Transaction } from 'src/db/client';
import { HashingService } from './hashing.service';
import { passwordResets } from './schemas/password-resets.schema';

export class PasswordResetsService {
  constructor(
    @InjectDb() private readonly db: DB,
    private readonly hashingService: HashingService,
    private readonly configService: TypeConfigService,
    private readonly logger: Logger,
  ) {}
  async create({ userId }: { userId: string }) {
    const passwordResetToken = this.hashingService.generateCryptoToken();
    const hashedPasswordResetToken =
      this.hashingService.encryptCryptoToken(passwordResetToken);

    const validUpTo = new Date(
      Date.now() +
        +ms(
          this.configService.get('auth', { infer: true })!.tokensExpiry
            .passwordResetsTokenExpiry,
        ),
    );
    await this.db.insert(passwordResets).values({
      userId,
      token: hashedPasswordResetToken,
      expiresAt: validUpTo,
    });

    return {
      passwordResetToken,
      tokenValidUpTo: validUpTo,
      livedTime: this.configService.get('auth', { infer: true })!.tokensExpiry
        .passwordResetsTokenExpiry,
    };
  }

  async find({
    hashedToken,
    transaction,
  }: {
    transaction?: Transaction;
    hashedToken: string;
  }) {
    const queryBuilding = transaction ? transaction : this.db;

    const [passwordResetsRecord] = await queryBuilding
      .select()
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.token, hashedToken),
          isNull(passwordResets.usedAT),
          gt(passwordResets.expiresAt, new Date()),
        ),
      );

    return passwordResetsRecord;
  }

  async update(hashedToken: string, transaction?: Transaction) {
    const queryBuilding = transaction ? transaction : this.db;
    await queryBuilding
      .update(passwordResets)
      .set({ usedAT: new Date() })
      .where(eq(passwordResets.token, hashedToken));
  }
}
