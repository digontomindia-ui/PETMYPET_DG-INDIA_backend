import { Queue, Worker, type Job, type Processor } from 'bullmq';
import { createBullMQConnection } from '../database/redis.js';
import { logger } from '../utils/logger.js';
import type { QueueName } from './queue-names.js';

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: { count: 1000, age: 24 * 3600 },
  removeOnFail: { count: 5000 },
} as const;

const queues = new Map<QueueName, Queue>();

export function getQueue<TData = unknown>(name: QueueName): Queue<TData> {
  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, { connection: createBullMQConnection(), defaultJobOptions: DEFAULT_JOB_OPTIONS });
    queues.set(name, queue);
  }
  return queue as Queue<TData>;
}

export function createWorker<TData = unknown>(
  name: QueueName,
  processor: Processor<TData>,
  concurrency = 5,
): Worker<TData> {
  const worker = new Worker<TData>(name, processor, { connection: createBullMQConnection(), concurrency });

  worker.on('completed', (job: Job<TData>) => logger.debug({ jobId: job.id, queue: name }, 'Job completed'));
  worker.on('failed', (job: Job<TData> | undefined, err: Error) =>
    logger.error({ jobId: job?.id, queue: name, err }, 'Job failed'),
  );

  return worker;
}

export async function closeAllQueues(): Promise<void> {
  await Promise.all([...queues.values()].map((queue) => queue.close()));
}
