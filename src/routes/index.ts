import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { userRoutes } from '../modules/users/user.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);

// Remaining module routers are mounted here incrementally as each module is implemented,
// so the app remains buildable and runnable at the end of every phase.
