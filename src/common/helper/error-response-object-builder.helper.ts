import { ErrorResponse } from '../interfaces/errors-response.interface';

export const buildResponseErrorObject = ({
  statusCode,
  message,
  path,
  errorType,
  errors,
}: {
  statusCode: number;
  message: string;
  path?: string;
  errorType?: string;
  errors?: Record<string, string>[];
}): ErrorResponse => {
  const errorData = {
    statusCode,
    errorType,
    message,
    errors,
    path,
    timestamp: new Date().toISOString(),
  };

  for (const key of Object.keys(errorData)) {
    if (errorData[key] === undefined) {
      delete errorData[key];
    }
  }

  return errorData;
};
