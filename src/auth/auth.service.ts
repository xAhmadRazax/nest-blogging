import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UsersService } from 'src/users/users.service';
import { LoginUserDto } from './dto/login-user.dto';
import { TokenService } from './token.service';
import { TypeUserMeta } from './types/auth.type';
import { SessionService } from './session.service';
import { HashingService } from './hashing.service';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: Logger,
    private readonly userService: UsersService,
    private readonly tokenService: TokenService,
    private readonly sessionsService: SessionService,
    private readonly hashingService: HashingService,
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
    context?: { url: string },
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

    const updatedUser = await this.userService.update(user.id, {
      password: changePasswordDto.newPassword,
      passwordChangedAt: new Date(),
    });

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
      user: this.userService.sanitize(updatedUser),
      accessToken,
      refreshToken: `${selector}.${verifier}`,
    };
  }
  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  // update(id: number, updateAuthDto: UpdateAuthDto) {
  //   return `This action updates a #${id} auth`;
  // }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
