process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-please-ignore-me-1234567890';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-please-ignore-me-1234567890';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.RATE_LIMIT_MAX ??= '100000';
process.env.AUTH_RATE_LIMIT_MAX ??= '100000';
process.env.LOG_LEVEL ??= 'silent';

import { beforeAll, afterAll, afterEach } from 'vitest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoReplSet: MongoMemoryReplSet;

beforeAll(async () => {
  // A (single-node) replica set, not a plain standalone server, because the wallet ledger uses
  // multi-document transactions, which MongoDB only permits on a replica set.
  mongoReplSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  process.env.MONGO_URI = mongoReplSet.getUri('patmypets-test');
  await mongoose.connect(process.env.MONGO_URI);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoReplSet.stop();
});
