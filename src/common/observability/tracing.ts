import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let sdk: NodeSDK | undefined;

export function startTracing(): void {
  sdk = new NodeSDK({
    resource: new Resource({ [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME }),
    traceExporter: new OTLPTraceExporter({ url: env.OTEL_EXPORTER_OTLP_ENDPOINT }),
    instrumentations: [
      getNodeAutoInstrumentations({ '@opentelemetry/instrumentation-fs': { enabled: false } }),
    ],
  });

  try {
    sdk.start();
    logger.info('OpenTelemetry tracing started');
  } catch (err) {
    logger.error({ err }, 'Failed to start OpenTelemetry tracing');
  }
}

export async function shutdownTracing(): Promise<void> {
  await sdk?.shutdown();
}
