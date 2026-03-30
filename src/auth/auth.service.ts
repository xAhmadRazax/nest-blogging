import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UsersService } from 'src/users/users.service';
import argon2 from 'argon2';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly logger: Logger,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const hashedPassword = await this.hashPassword(registerUserDto.password);
    const user = await this.userService.create({
      ...registerUserDto,
      hashedPassword,
    });
    return user;
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.userService.findOneByEmail(loginUserDto.email);
    if (
      !user ||
      !(await this.comparePassword(loginUserDto.password, user.hashedPassword))
    ) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    return this.userService.sanitize(user);
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

  private async hashPassword(password: string) {
    try {
      const hashedPassword = await argon2.hash(password);
      return hashedPassword;
    } catch {
      this.logger.error('argon2 has failed hashing');
      throw new InternalServerErrorException('Failed to hash password');
    }
  }

  private async comparePassword(
    candidatePassword: string,
    hashedPassword: string,
  ) {
    try {
      return await argon2.verify(hashedPassword, candidatePassword);
    } catch {
      this.logger.error('argon2 has failed to verify password');
      throw new InternalServerErrorException('Failed to verify password');
    }
  }
}
