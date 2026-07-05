import type { NextFunction, Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { HTTP_STATUS } from '../constants/http-status.js';
import { logger } from '../utils/logger.js';
import { isProduction } from '../config/env.js';

interface ErrorBody {
  success: false;
  error: string;
  message: string;
  details?: unknown;
  stack?: string;
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const appError = normalizeError(err);

  logger.error(
    {
      requestId: req.requestId,
      err: { message: appError.message, code: appError.code, stack: appError.stack },
      path: req.originalUrl,
      method: req.method,
    },
    'Request failed',
  );

  const body: ErrorBody = {
    success: false,
    error: appError.code,
    message: appError.message,
    ...(appError.details ? { details: appError.details } : {}),
    ...(isProduction ? {} : { stack: appError.stack }),
  };

  res.status(appError.statusCode).json(body);
}

function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) {
    return err;
  }

  if (err instanceof ZodError) {
    return AppError.validation(
      'Validation failed',
      err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }

  if (err instanceof MongooseError.ValidationError) {
    return AppError.validation(
      'Validation failed',
      Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })),
    );
  }

  if (err instanceof MulterError) {
    return AppError.badRequest(err.message);
  }

  if (err instanceof MongooseError.CastError) {
    return AppError.badRequest(`Invalid value for field "${err.path}"`);
  }

  if (isMongoDuplicateKeyError(err)) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
    return AppError.conflict(`A record with this ${field} already exists`);
  }

  if (err instanceof Error) {
    return AppError.internal(isProduction ? 'Internal server error' : err.message);
  }

  return AppError.internal();
}

interface MongoDuplicateKeyError {
  code: 11000;
  keyPattern?: Record<string, number>;
}

function isMongoDuplicateKeyError(err: unknown): err is MongoDuplicateKeyError {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 11000;
}
