import 'dotenv/config';
import { connectDatabase } from './common/database/mongoose.js';
import { connectRedis } from './common/database/redis.js';
import { logger } from './common/utils/logger.js';
import { startNotificationWorkers } from './modules/notifications/notification.worker.js';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  startNotificationWorkers();

  logger.info('Background worker process started');
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal error starting worker process', err);
  process.exit(1);
});
