export interface ErrorResponse {
  statusCode: number;
  message: string;
  errorType?: string;
  errors?: Record<string, string>[]; // for field level errors
  path?: string;
  timestamp: string;
}
