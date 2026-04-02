import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { ZodError } from 'zod';
import { ZodValidationException } from 'nestjs-zod';
import { Request, Response } from 'express';
import { buildResponseErrorObject } from 'src/common/helper/error-response-object-builder.helper';
import { normalizeZodErrors } from 'src/common/helper/normalize-zod-error.helper';

@Catch(ZodError, ZodValidationException)
export class ZodExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ZodExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let zodError: ZodError;

    if (exception instanceof ZodValidationException) {
      zodError = exception.getZodError() as ZodError;
    } else if (exception instanceof ZodError) {
      zodError = exception;
    } else {
      return;
    }

    const normalizeError = normalizeZodErrors(zodError);
    const errorType = 'VALIDATION_ERROR';

    this.logger.error({ errorType, errors: normalizeError });

    response.status(400).json(
      buildResponseErrorObject({
        statusCode: 400,
        message: 'Validation failed',
        errorType,
        path: request.url,
        errors: normalizeError,
      }),
    );
  }
}
