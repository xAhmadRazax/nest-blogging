import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import {
  NotBeforeError,
  JsonWebTokenError,
  TokenExpiredError,
} from 'jsonwebtoken';
import { Response } from 'express';
import { buildResponseErrorObject } from 'src/common/helper/error-response-object-builder.helper';

@Catch(NotBeforeError, JsonWebTokenError, TokenExpiredError)
export class JwtExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger();

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let message = 'Token is invalid, Please Login';
    let errorType = 'JWT_INVALID_TOKEN_ERROR';

    if (exception instanceof TokenExpiredError) {
      message = 'Session is expire, Please Login';
      errorType = 'JWT_EXPIRE_TOKEN_ERROR';
    }
    if (exception instanceof NotBeforeError) {
      message = 'Token not active yet.';
      errorType = 'JWT_NOT_ACTIVE_YET_TOKEN_ERROR';
    }

    this.logger.error(`${errorType}: ${message}`);
    response
      .status(401)
      .json(buildResponseErrorObject({ statusCode: 401, message, errorType }));
  }
}
