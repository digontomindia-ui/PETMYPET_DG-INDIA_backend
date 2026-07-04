import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { corsOrigins, env } from './common/config/env.js';
import { logger } from './common/utils/logger.js';
import { requestIdMiddleware } from './common/middlewares/request-id.middleware.js';
import { generalRateLimiter } from './common/middlewares/rate-limit.middleware.js';
import { errorHandlerMiddleware, notFoundHandler } from './common/middlewares/error-handler.middleware.js';
import { metricsMiddleware, metricsRegistry } from './common/observability/metrics.js';
import { swaggerSpec } from './common/swagger/swagger.config.js';
import { apiRouter } from './routes/index.js';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as unknown as { requestId: string }).requestId,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins.length > 0 ? corsOrigins : true,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  // Razorpay webhook needs the raw request body to verify the HMAC signature,
  // so it is captured here before JSON parsing discards it.
  app.use(
    express.json({
      limit: '2mb',
      verify: (req, _res, buf) => {
        (req as unknown as { rawBody: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  app.use(mongoSanitize());
  app.use(hpp());

  if (env.METRICS_ENABLED) {
    app.use(metricsMiddleware);
  }

  app.use(generalRateLimiter);

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'OK', data: { uptime: process.uptime() } });
  });

  if (env.METRICS_ENABLED) {
    app.get('/metrics', (_req, res) => {
      metricsRegistry
        .metrics()
        .then((metrics) => {
          res.set('Content-Type', metricsRegistry.contentType);
          res.send(metrics);
        })
        .catch((err: unknown) => {
          logger.error({ err }, 'Failed to collect metrics');
          res.status(500).end();
        });
    });
  }

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(`/api/${env.API_VERSION}`, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandlerMiddleware);

  return app;
}
