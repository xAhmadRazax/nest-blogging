import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { ZodError, ZodRealError } from 'zod';
import { Request, Response } from 'express';
import { buildResponseErrorObject } from 'src/common/helper/error-response-object-builder.helper';
import { normalizeZodErrors } from 'src/common/helper/normalize-zod-error.helper';

interface ZodValidationError extends ZodError {
  response: ZodError;
  error: unknown;
}

@Catch(ZodError, ZodRealError)
export class ZodExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger();

  catch(exception: ZodValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getResponse<Request>();

    const normalizeError = normalizeZodErrors(exception.error as ZodError);

    const message = 'validation Error';
    const errorType = 'VALIDATION_ERROR';

    this.logger.error({
      errorType,
      normalizeError,
    });
    response.status(401).json(
      buildResponseErrorObject({
        statusCode: 400,
        message,
        errorType,
        path: request.url,
        errors: normalizeError,
      }),
    );
  }
}
