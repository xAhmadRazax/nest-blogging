import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import {
  NotBeforeError,
  JsonWebTokenError,
  TokenExpiredError,
} from 'jsonwebtoken';
import { Response } from 'express';

@Catch(NotBeforeError, JsonWebTokenError, TokenExpiredError)
export class JwtExceptionFilter implements ExceptionFilter {
  cons;
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let message = 'Token is invalid, Please Login';

    if (exception instanceof TokenExpiredError) {
      message = 'Session is expire, Please Login';
    }
    if (exception instanceof NotBeforeError) {
      message = 'Token not active yet.';
    }
    response.status(401).json({ statusCode: 401, message });
  }
}
