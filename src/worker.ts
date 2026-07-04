import 'dotenv/config';
import { connectDatabase } from './common/database/mongoose.js';
import { connectRedis } from './common/database/redis.js';
import { logger } from './common/utils/logger.js';

// Individual module workers (e.g. email, SMS, push notification, invoice) register
// themselves here as each background-job-producing module is implemented.

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis();
  logger.info('Background worker process started');
}

bootstrap().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error starting worker process', err);
  process.exit(1);
});
