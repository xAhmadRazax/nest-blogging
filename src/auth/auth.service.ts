import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UsersService } from 'src/users/users.service';
import { LoginUserDto } from './dto/login-user.dto';
import { TokenService } from './token.service';
import { TypeUserMeta } from './types/auth.type';
import { SessionService } from './session.service';
import { HashingService } from './hashing.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { PasswordResetsService } from './password-resets.service';
import { PasswordResetsDto } from './dto/password-resets.dto';
import { InjectDb } from 'src/db/db.provider';
import { type DB } from 'src/db/client';
import { EmailVerificationsService } from './email-verification.service';
import { PublicUser } from 'src/db/schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectDb() private readonly db: DB,
    private readonly userService: UsersService,
    private readonly tokenService: TokenService,
    private readonly sessionsService: SessionService,
    private readonly hashingService: HashingService,
    private readonly passwordResetsService: PasswordResetsService,
    private readonly emailVerificationService: EmailVerificationsService,
    private readonly logger: Logger,
  ) {}

  async register(registerUserDto: RegisterUserDto, context: { url: string }) {
    const hashedPassword = await this.hashingService.hashPassword(
      registerUserDto.password,
    );
    const user = await this.userService.create({
      ...registerUserDto,
      hashedPassword,
    });

    await this.emailVerificationService.sendWelcomeVerification({
      userId: user.id,
      email: user.email,
      name: user.username,
      url: context.url,
    });

    this.logger.log(`A user with ${user.email} has been registered`);
    return user;
  }

  async login(
    userMeta: TypeUserMeta,
    loginUserDto: LoginUserDto,
    context: { url: string },
  ) {
    const user = await this.userService.findOneByEmail(loginUserDto.email);
    if (
      !user ||
      !(await this.hashingService.comparePassword(
        loginUserDto.password,
        user.hashedPassword,
      ))
    ) {
      this.logger.warn({
        errorType: 'UNAUTHORIZED_USER_ACCESS',
        email: loginUserDto.email,
        path: context?.url,
      });
      throw new UnauthorizedException('Invalid Credentials');
    }

    // generate Session

    const accessToken = this.tokenService.generateJwtToken({
      userId: user.id,
      email: user.email,
    });
    const { selector, verifier, hashedVerifier } =
      this.tokenService.generateRefreshTokenPair();

    await this.sessionsService.create({
      meta: userMeta,
      tokenFamily: selector,
      tokenHash: hashedVerifier,
      userId: user.id,
    });

    return {
      user: this.userService.sanitize(user),
      accessToken,
      refreshToken: `${selector}.${verifier}`,
    };
  }

  async changePassword(
    { userId, email }: { userId: string; email: string },
    changePasswordDto: ChangePasswordDto,
    userMeta: TypeUserMeta,
    context: { url: string; email: string },
    refreshToken: { selector: string; hashedVerifier: string },
    resetCookieHandler: () => void,
  ) {
    return await this.db.transaction(async (tx) => {
      const user = await this.userService.findOne(userId, tx);

      if (
        !user ||
        !(await this.hashingService.comparePassword(
          changePasswordDto.password,
          user.hashedPassword,
        ))
      ) {
        this.logger.warn({
          errorType: 'UNAUTHORIZED_USER_ACCESS',
          email,
          userId,
          path: context?.url,
        });
        throw new UnauthorizedException('Invalid Credentials');
      }
      const session = await this.sessionsService.findValidSession(
        {
          tokenFamily: refreshToken.selector,
          hashedVerifier: refreshToken.hashedVerifier,
        },
        tx,
        resetCookieHandler,
      );

      const hashedPassword = await this.hashingService.hashPassword(
        changePasswordDto.newPassword,
      );

      const updatedUser = await this.userService.update(
        user.id,
        {
          hashedPassword,
          // Fix: Add 2-second buffer to passwordChangedAt to ensure it's always less than JWT iat,
          // preventing false-positive token invalidations in the auth guard.
          passwordChangedAt: new Date(Date.now() - 2000),
        },
        tx,
      );

      const accessToken = this.tokenService.generateJwtToken({
        userId: user.id,
        email: user.email,
      });

      const { hashedVerifier, verifier } =
        this.tokenService.generateRefreshTokenPair();

      await this.sessionsService.sessionRotation({
        meta: userMeta,
        tokenHash: hashedVerifier,
        sessionRec: session,
        tx,
      });

      return {
        user: this.userService.sanitize(updatedUser),
        accessToken,
        refreshToken: `${refreshToken.selector}.${verifier}`,
      };
    });
  }

  async forgotPassword(
    { email }: ForgotPasswordDto,
    context: { baseUrl: string },
  ) {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      return;
    }

    await this.passwordResetsService.passwordResets({
      userId: user.id,
      email: user.email,
      name: user.username,
      url: context.baseUrl,
    });
  }

  async verifyPasswordRestsToken(token: string, context: { url: string }) {
    const hashedToken = this.hashingService.encryptCryptoToken(token);
    const passwordResetsRecord = await this.passwordResetsService.find({
      hashedToken,
    });
    if (!passwordResetsRecord) {
      this.logger.warn({
        errorType: 'EXPIRE_OR_INVALID_PASSWORD_RESET_TOKEN',
        message: 'Token is invalid or has expired',
        path: context.url,
      });
      throw new BadRequestException('Token is invalid or has expired');
    }
  }

  async resetsPassword(
    passwordResetsDto: PasswordResetsDto,
    token: string,
    context: { url: string },
  ) {
    await this.db.transaction(async (tx) => {
      const hashedToken = this.hashingService.encryptCryptoToken(token);
      const passwordResetsRecord = await this.passwordResetsService.find({
        transaction: tx,
        hashedToken,
      });
      if (!passwordResetsRecord) {
        this.logger.warn({
          errorType: 'EXPIRE_OR_INVALID_PASSWORD_RESET_TOKEN',
          message: 'Token is invalid or has expired',
          path: context.url,
        });
        throw new BadRequestException('Token is invalid or has expired');
      }

      const hashedPassword = await this.hashingService.hashPassword(
        passwordResetsDto.password,
      );

      const user = await this.userService.update(
        passwordResetsRecord.userId,
        {
          hashedPassword,
          passwordChangedAt: new Date(),
        },
        tx,
      );
      await this.passwordResetsService.update(hashedToken);

      return this.userService.sanitize(user);
    });
  }

  async sendVerifyEmail(user: PublicUser, context: { url: string }) {
    if (user.isVerified) {
      throw new ConflictException('User is already verified');
    }

    await this.emailVerificationService.sendEmailVerification({
      userId: user.id,
      email: user.email,
      name: user.username,
      url: context.url,
    });
  }

  async verifyEmail(token: string) {
    await this.db.transaction(async (tx) => {
      const emailVerificationRecord = await this.emailVerificationService.find(
        token,
        tx,
      );
      await this.userService.update(
        emailVerificationRecord.userId,
        {
          isVerified: true,
        },
        tx,
      );
      await this.emailVerificationService.verifyEmail(token, tx);
    });
  }

  async refreshRotation(
    {
      selector,
      hashedVerifier,
      userMeta,
    }: {
      selector: string;
      userMeta: TypeUserMeta;
      hashedVerifier: string;
    },
    resetCookieHandler: () => void,
  ) {
    return await this.db.transaction(async (tx) => {
      const session = await this.sessionsService.findValidSession(
        {
          tokenFamily: selector,
          hashedVerifier: hashedVerifier,
        },
        tx,
        resetCookieHandler,
      );

      const user = await this.userService.findOne(session.userId, tx);
      const accessToken = this.tokenService.generateJwtToken({
        userId: user.id,
        email: user.email,
      });
      const updatedTokenPairs = this.tokenService.generateRefreshTokenPair();

      await this.sessionsService.sessionRotation({
        meta: userMeta,
        tokenHash: updatedTokenPairs.hashedVerifier,
        sessionRec: session,
        tx,
      });
      return {
        accessToken,
        refreshToken: `${selector}.${updatedTokenPairs.verifier}`,
      };
    });
  }

  async logout(tokenFamily: string) {
    await this.sessionsService.revokeTokenFamily(tokenFamily);
  }
}
