import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Transaction, type DB } from 'src/db/client';
import { InjectDb } from 'src/db/db.provider';
import { TypeConfigService } from 'src/config/type.config.service';
import { emailVerifications } from './schemas/email-verification.schema';
import ms from 'ms';
import { EmailService } from 'src/common/services/email.service';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { TokenService } from 'src/common/services/token.service';

@Injectable()
export class EmailVerificationsService {
  constructor(
    @InjectDb() private readonly db: DB,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly configService: TypeConfigService,
    private readonly logger: Logger,
  ) {}

  async sendWelcomeVerification({
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
    if (res.record.id) {
      await this.emailService.sendWelcomeAndVerificationEmail({
        url: `${url}/${res.token}`,
        recipientAddress: email,
        recipientName: name,
      });
    }
  }

  async sendEmailVerification({
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
    if (res.record.id) {
      await this.emailService.sendVerificationEmail({
        url: `${url}/${res.token}`,
        recipientAddress: email,
        recipientName: name,
      });
    }
  }

  async verifyEmail(token: string, tx?: Transaction) {
    const queryBuilder = tx ? tx : this.db;
    const hashedToken = this.tokenService.encryptCryptoToken(token);

    await queryBuilder
      .update(emailVerifications)
      .set({ verified_at: new Date() })
      .where(eq(emailVerifications.token, hashedToken));
  }

  async find(token: string, tx?: Transaction) {
    const queryBuilder = tx ? tx : this.db;
    const hashedToken = this.tokenService.encryptCryptoToken(token);
    const [verificationRec] = await queryBuilder
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.token, hashedToken),
          isNull(emailVerifications.verified_at),
          gt(emailVerifications.expires_at, new Date()),
        ),
      );

    if (!verificationRec) {
      throw new BadRequestException('Token is invalid or has expired');
    }
    return verificationRec;
  }

  private async create({ userId }: { userId: string }) {
    const token = this.tokenService.generateCryptoToken();
    const hashedPassword = this.tokenService.encryptCryptoToken(token);
    const validUpTo = new Date(
      Date.now() +
        +ms(
          this.configService.get('auth', { infer: true })!.tokensExpiry
            .passwordResetsTokenExpiry,
        ),
    );
    const [res] = await this.db
      .insert(emailVerifications)
      .values({ token: hashedPassword, userId, expires_at: validUpTo })
      .returning();
    return { token, record: res };
  }
}
