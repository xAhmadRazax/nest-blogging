import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionService } from '../session.service';
import { HashingService } from '../hashing.service';

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(
    private readonly sessionsService: SessionService,
    private readonly hashingService: HashingService,
  ) {}
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const token = this.extractRefreshToken(req);
    if (!token) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const [selector, verifier] = token.split('.');
    const hashedVerifier = this.hashingService.encryptCryptoToken(verifier);

    req.session = { selector, verifier, hashedVerifier };

    return true;
  }
  private extractRefreshToken(request: Request): string | undefined {
    const token =
      (request?.cookies['refreshToken'] as string) ||
      request.headers['x-refresh-token']?.[0];

    return token ?? undefined;
  }
}
