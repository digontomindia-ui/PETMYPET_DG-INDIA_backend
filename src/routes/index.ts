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
import { productRoutes } from '../modules/marketplace/product.routes.js';
import { cartRoutes } from '../modules/marketplace/cart.routes.js';
import { wishlistRoutes } from '../modules/marketplace/wishlist.routes.js';
import { orderRoutes } from '../modules/marketplace/order.routes.js';
import { reviewRoutes } from '../modules/reviews/review.routes.js';
import { supportRoutes } from '../modules/support/support.routes.js';
import { blogRoutes } from '../modules/blogs/blog.routes.js';
import { lostAndFoundRoutes } from '../modules/lost-and-found/lost-and-found.routes.js';
import { searchRoutes } from '../modules/search/search.routes.js';
import { analyticsRoutes } from '../modules/analytics/analytics.routes.js';
import {
  adminRoutes,
  publicBannerRoutes,
  publicFeatureFlagRoutes,
} from '../modules/admin/admin.routes.js';
import { uploadRoutes } from '../modules/uploads/upload.routes.js';
import { availabilityRoutes } from '../modules/availability/availability.routes.js';

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
apiRouter.use('/products', productRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/wishlist', wishlistRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/support-tickets', supportRoutes);
apiRouter.use('/blogs', blogRoutes);
apiRouter.use('/lost-and-found', lostAndFoundRoutes);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/feature-flags', publicFeatureFlagRoutes);
apiRouter.use('/banners', publicBannerRoutes);
apiRouter.use('/uploads', uploadRoutes);
apiRouter.use('/availability', availabilityRoutes);
