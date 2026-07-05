import 'dotenv/config';
import { startTracing, shutdownTracing } from './common/observability/tracing.js';

// Tracing must be initialized before any other module is imported so that
// auto-instrumentation can patch http/express/mongoose/ioredis on load.
startTracing();

const { createServer } = await import('node:http');
const { createApp } = await import('./app.js');
const { connectDatabase, disconnectDatabase } = await import('./common/database/mongoose.js');
const { connectRedis, disconnectRedis } = await import('./common/database/redis.js');
const { closeAllQueues } = await import('./common/jobs/queue.factory.js');
const { initSocketServer } = await import('./sockets/index.js');
const { logger } = await import('./common/utils/logger.js');
const { env } = await import('./common/config/env.js');

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  const app = createApp();
  const httpServer = createServer(app);
  initSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`${env.APP_NAME} backend listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    httpServer.close();
    disconnectRedis();
    await Promise.all([disconnectDatabase(), closeAllQueues(), shutdownTracing()]);
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal error during bootstrap', err);
  process.exit(1);
});
