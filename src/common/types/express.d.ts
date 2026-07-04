import type { Role } from '../constants/roles.js';

export interface AuthenticatedUser {
  userId: string;
  role: Role;
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId: string;
    }
  }
}

export {};
