import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { userRoutes } from '../modules/users/user.routes.js';
import { cityRoutes, zoneRoutes } from '../modules/zones/zone.routes.js';
import { providerRoutes } from '../modules/providers/provider.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/cities', cityRoutes);
apiRouter.use('/zones', zoneRoutes);
apiRouter.use('/providers', providerRoutes);

// Remaining module routers are mounted here incrementally as each module is implemented,
// so the app remains buildable and runnable at the end of every phase.
