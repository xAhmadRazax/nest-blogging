import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from 'src/auth/token.service';
import {
  NotBeforeError,
  TokenExpiredError,
  JsonWebTokenError,
} from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly logger: Logger,
    private readonly userService: UsersService,
    private readonly tokenService: TokenService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const token = this.extractAccessToken(req);
    if (!token) {
      throw new UnauthorizedException('Access token not provided');
    }
    try {
      const payload = this.tokenService.decodeJwtToken(token);
      const user = await this.userService.findOne(payload.sub);

      if (!user) {
        this.logger.error({
          event: 'USER_NOT_FOUND',
          email: payload.email,
          userId: payload.sub,
          route: req.url,
        });
        throw new UnauthorizedException(
          `User with ${payload.email} no longer exists`,
        );
      }

      if (
        user.passwordChangedAt &&
        user.passwordChangedAt.getTime() / 1000 >= payload.iat!
      ) {
        this.logger.error({
          event: 'EXPIRE_TOKEN',
          email: payload.email,
          userId: payload.sub,
          route: req.url,
        });
        throw new UnauthorizedException(`Token is expire, please login again.`);
      }

      req.user = user;
      return true;
    } catch (error) {
      let errorType = '';

      if (error instanceof JsonWebTokenError) {
        errorType = 'JWT_INVALID_TOKEN';
      }

      if (error instanceof TokenExpiredError) {
        errorType = 'JWT_EXPIRE_TOKEN';
      }
      if (error instanceof NotBeforeError) {
        errorType = 'JWT_NOT_ACTIVE_YET';
      }

      if (
        error instanceof JsonWebTokenError ||
        error instanceof TokenExpiredError ||
        error instanceof NotBeforeError
      ) {
        const payload = this.tokenService.decodeJwtToken(token, false);
        this.logger.error({
          event: errorType,
          email: payload.email,
          userId: payload.sub,
          route: req.url,
        });
      }
      throw error;
    }
  }
  private extractAccessToken(request: Request): string | undefined {
    const token =
      (request?.cookies['accessToken'] as string) ||
      (request.headers.authorization &&
      request.headers.authorization.startsWith('Bearer')
        ? request.headers.authorization.split(' ')[1]
        : undefined);

    return token ?? undefined;
  }
}
