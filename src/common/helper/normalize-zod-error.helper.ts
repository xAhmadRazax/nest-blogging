import { ZodError } from 'zod';

export const normalizeZodErrors = (
  error: ZodError,
): Record<string, string>[] => {
  return error.issues.map((issue) => {
    const field = issue.path.join('.') || 'root';

    const message =
      issue.code === 'invalid_union' ? 'Invalid value' : issue.message;

    return {
      field,
      message,
      code: issue.code,
    };
  });
};
