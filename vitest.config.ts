import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Each test file spins up its own MongoMemoryServer and connects mongoose's single
    // global connection to it; running files in parallel makes that connection race across
    // files, so they run sequentially instead.
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/worker.ts', 'src/**/*.routes.ts', 'src/**/index.ts'],
    },
    setupFiles: ['./tests/setup.ts'],
  },
});
