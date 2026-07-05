import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { userRoutes } from '../modules/users/user.routes.js';
import { cityRoutes, zoneRoutes } from '../modules/zones/zone.routes.js';
import { providerRoutes } from '../modules/providers/provider.routes.js';
import { petRoutes } from '../modules/pets/pet.routes.js';
import { categoryRoutes } from '../modules/categories/category.routes.js';
import { serviceRoutes } from '../modules/services/service.routes.js';
import { bookingRoutes } from '../modules/bookings/booking.routes.js';
import { walletRoutes } from '../modules/wallet/wallet.routes.js';
import { couponRoutes } from '../modules/coupons/coupon.routes.js';
import { paymentRoutes } from '../modules/payments/payment.routes.js';
import { notificationRoutes } from '../modules/notifications/notification.routes.js';
import { chatRoutes } from '../modules/chat/chat.routes.js';
import { postRoutes } from '../modules/community/post.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/cities', cityRoutes);
apiRouter.use('/zones', zoneRoutes);
apiRouter.use('/providers', providerRoutes);
apiRouter.use('/pets', petRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/services', serviceRoutes);
apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/wallet', walletRoutes);
apiRouter.use('/coupons', couponRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/posts', postRoutes);

// Remaining module routers are mounted here incrementally as each module is implemented,
// so the app remains buildable and runnable at the end of every phase.
