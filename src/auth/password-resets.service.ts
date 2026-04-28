import { Injectable, Logger } from '@nestjs/common';
import { eq, and, gt, isNull } from 'drizzle-orm';
import ms from 'ms';
import { InjectDb } from 'src/db/db.provider';
import { TypeConfigService } from 'src/config/type.config.service';
import type { DB, Transaction } from 'src/db/client';
import { passwordResets } from './schemas/password-resets.schema';
import { EmailService } from 'src/common/services/email.service';
import { TokenService } from 'src/common/services/token.service';

@Injectable()
export class PasswordResetsService {
  constructor(
    @InjectDb() private readonly db: DB,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly configService: TypeConfigService,
    private readonly logger: Logger,
  ) {}

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

  async passwordResets({
    userId,
    email,
    name,
    url,
  }: {
    userId: string;
    email: string;
    name: string;
    url: string;
  }) {
    const res = await this.create({ userId });
    await this.emailService.sendPasswordResetEmail({
      url: `${url}/${res.token}`,
      recipientAddress: email,
      recipientName: name,
    });
  }

  private async create({ userId }: { userId: string }) {
    const passwordResetToken = this.tokenService.generateCryptoToken();
    const hashedPasswordResetToken =
      this.tokenService.encryptCryptoToken(passwordResetToken);

    const validUpTo = new Date(
      Date.now() +
        +ms(
          this.configService.get('auth', { infer: true })!.tokensExpiry
            .passwordResetsTokenExpiry,
        ),
    );
    await this.db
      .insert(passwordResets)
      .values({
        userId,
        token: hashedPasswordResetToken,
        expiresAt: validUpTo,
      })
      .returning();

    return {
      token: passwordResetToken,
    };
  }
}
