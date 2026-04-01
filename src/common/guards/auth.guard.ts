import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { TokenService } from 'src/auth/token.service';
import { NotBeforeError, TokenExpiredError } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly logger: Logger,
    private readonly tokenService: TokenService,
  ) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const token = this.extractAccessToken(req);
    if (!token) {
      throw new UnauthorizedException('Access token not provided');
    }
    try {
      const payload = this.tokenService.decodeJwtToken(token);

      if (payload?.sub) {
        req.user = { userId: payload?.sub };
        return true;
      }
      return false;
    } catch (error) {
      let errorType = 'JWT_INVALID_TOKEN';

      if (error instanceof TokenExpiredError) {
        errorType = 'JWT_EXPIRE_TOKEN';
      }
      if (error instanceof NotBeforeError) {
        errorType = 'JWT_NOT_ACTIVE_YET';
      }
      const payload = this.tokenService.decodeJwtToken(token, false);
      this.logger.error({
        event: errorType,
        email: payload.email,
        userId: payload.sub,
        route: req.url,
      });
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
