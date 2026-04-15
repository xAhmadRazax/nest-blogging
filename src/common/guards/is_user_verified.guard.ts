import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class IsUserVerifiedGuard implements CanActivate {
  constructor(private readonly logger: Logger) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    console.log(request.user);
    if (!request.user) {
      throw new UnauthorizedException(
        `Unauthorized access to ${request.protocol}://${request.get('host')}${request.url},  please login to access ${request.protocol}://${request.get('host')}${request.url}`,
      );
    }
    if (!request.user.isVerified) {
      throw new UnauthorizedException(
        `User is not verified, pleased Verified Your account before creating a publication`,
      );
    }
    return true;
  }
}
