import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../constants/roles.js';
import { AppError } from '../errors/app-error.js';

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(AppError.forbidden('You do not have permission to perform this action'));
      return;
    }
    next();
  };
}

/** Allows access if the authenticated user owns the resource (matches :paramName) or has one of the bypass roles. */
export function requireOwnershipOrRole(paramName: string, ...bypassRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }
    const isOwner = req.params[paramName] === req.user.userId;
    const hasBypass = bypassRoles.includes(req.user.role);
    if (!isOwner && !hasBypass) {
      next(AppError.forbidden('You do not have permission to access this resource'));
      return;
    }
    next();
  };
}
