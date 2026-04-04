import {
  BadRequestException,
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

@Injectable()
export class AuthService {
  constructor(
    @InjectDb() private readonly db: DB,
    private readonly userService: UsersService,
    private readonly tokenService: TokenService,
    private readonly sessionsService: SessionService,
    private readonly hashingService: HashingService,
    private readonly passwordResetsService: PasswordResetsService,
    private readonly logger: Logger,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const hashedPassword = await this.hashingService.hashPassword(
      registerUserDto.password,
    );
    const user = await this.userService.create({
      ...registerUserDto,
      hashedPassword,
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
  ) {
    const user = await this.userService.findOne(userId);

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

    const hashedPassword = await this.hashingService.hashPassword(
      changePasswordDto.newPassword,
    );

    const updatedUser = await this.userService.update(user.id, {
      hashedPassword,
      passwordChangedAt: new Date(),
    });

    const accessToken = this.tokenService.generateJwtToken({
      userId: user.id,
      email: user.email,
    });
    const { selector, hashedVerifier, verifier } =
      this.tokenService.generateRefreshTokenPair();

    await this.sessionsService.sessionRotation(
      {
        meta: userMeta,
        tokenHash: hashedVerifier,
        userId: user.id,
      },
      context,
    );

    return {
      user: this.userService.sanitize(updatedUser),
      accessToken,
      refreshToken: `${selector}.${verifier}`,
    };
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    const user = await this.userService.findOneByEmail(email);
    if (!user.id) {
      return;
    }

    const passwordResetsRes = await this.passwordResetsService.create({
      userId: user.id,
    });

    return passwordResetsRes;
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
}
