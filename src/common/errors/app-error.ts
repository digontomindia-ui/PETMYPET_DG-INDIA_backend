import { HTTP_STATUS } from '../constants/http-status.js';

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: ErrorCode, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST', details);
  }

  static validation(message: string, details?: unknown): AppError {
    return new AppError(message, HTTP_STATUS.BAD_REQUEST, 'VALIDATION_ERROR', details);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError(message, HTTP_STATUS.CONFLICT, 'CONFLICT', details);
  }

  static unprocessable(message: string, details?: unknown): AppError {
    return new AppError(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, 'UNPROCESSABLE_ENTITY', details);
  }

  static tooManyRequests(message = 'Too many requests'): AppError {
    return new AppError(message, HTTP_STATUS.TOO_MANY_REQUESTS, 'TOO_MANY_REQUESTS');
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR');
  }
}
