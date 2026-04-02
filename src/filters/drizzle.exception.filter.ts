import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { DrizzleQueryError } from 'drizzle-orm';
import { Response, Request } from 'express';
import { buildResponseErrorObject } from 'src/common/helper/error-response-object-builder.helper';
import { ErrorResponse } from 'src/common/interfaces/errors-response.interface';

interface DrizzleError extends DrizzleQueryError {
  cause: {
    code: string;
    detail: string;
    table: string;
    name: string;
    message: string;
    column: string;
  };
}

@Catch(DrizzleQueryError)
export class DrizzleExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DrizzleExceptionFilter.name);

  catch(exception: DrizzleError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errObj: ErrorResponse = {
      statusCode: 500,
      errorType: 'DB_ERR',
      message: exception.message ?? 'An unexpected database error occurred',
      errors: [],
      timestamp: new Date().toISOString(),
    };

    switch (exception.cause.code) {
      case '23505': {
        const match = exception.cause.detail.match(
          /Key \((.+)\)=\((.+)\) already exists/,
        );
        errObj.statusCode = 409;
        errObj.errorType = 'DB_UNIQUE_CONSTRAINT_ERROR';
        errObj.message = 'A record with this value already exists';
        errObj.errors?.push({
          field: match?.[1] ?? 'unknown',
          message: match
            ? `"${match[2]}" is already used in the "${match[1]}" column.`
            : exception.cause.detail,
          code: 'DB_UNIQUE_CONSTRAINT_ERROR',
        });
        break;
      }

      case '23503': {
        const match = exception.cause.detail.match(
          /Key \((.+)\)=\((.+)\) is not present in table "(.+)"/,
        );
        errObj.statusCode = 400;
        errObj.errorType = 'DB_INVALID_REFERENCE_KEY_VALUE';
        errObj.message = 'Related record does not exist';
        errObj.errors?.push({
          field: match?.[1] ?? 'unknown',
          message: match
            ? `Invalid reference: "${match[2]}" does not exist in "${match[3]}"`
            : exception.cause.detail,
          code: 'DB_INVALID_REFERENCE_KEY_VALUE',
        });
        break;
      }

      case '23502': {
        errObj.statusCode = 400;
        errObj.errorType = 'DB_MISSING_REQUIRED_FIELD';
        errObj.message = 'A required field is missing';
        errObj.errors?.push({
          field: exception.cause.column,
          message: `Missing required value in "${exception.cause.column ?? 'unknown'}" column`,
          code: 'DB_MISSING_REQUIRED_FIELD',
        });
        break;
      }

      case '22P02': {
        errObj.statusCode = 400;
        errObj.errorType = 'DB_INVALID_DATA_VALUE_TYPE';
        errObj.message = 'Invalid value format provided';
        errObj.errors?.push({
          message: exception.cause.message ?? 'Invalid data value format',
          code: 'DB_INVALID_DATA_VALUE_TYPE',
        });
        break;
      }

      default: {
        this.logger.error({
          message: `Unhandled DB error code: ${exception.cause.code}`,
          detail: exception.cause.detail,
          path: request.url,
        });
        break;
      }
    }

    this.logger.error({
      message: `${errObj.errorType}: ${errObj.message}`,
      path: request.url,
    });

    response.status(errObj.statusCode).json(buildResponseErrorObject(errObj));
  }
}
