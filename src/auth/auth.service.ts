import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UsersService } from 'src/users/users.service';
import { LoginUserDto } from './dto/login-user.dto';
import { TokenService } from './token.service';
import { TypeUserMeta } from './types/auth.type';
import { SessionService } from './session.service';
import { HashingService } from './hashing.service';

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

  async login(userMeta: TypeUserMeta, loginUserDto: LoginUserDto) {
    const user = await this.userService.findOneByEmail(loginUserDto.email);
    if (
      !user ||
      !(await this.hashingService.comparePassword(
        loginUserDto.password,
        user.hashedPassword,
      ))
    ) {
      this.logger.warn(
        `Unauthorized access attempt by user ${loginUserDto.email}`,
      );
      throw new UnauthorizedException('Invalid Credentials');
    }

    // generate Session

    const accessToken = this.tokenService.generateJwtToken(user.id);
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
