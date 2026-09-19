// Diffs actual Express routes against swagger-jsdoc documented paths.
// Usage: npx tsx scripts/audit-swagger.mts

import type { Router } from 'express';
import { apiRouter } from '../src/routes/index.js';
import { swaggerSpec } from '../src/common/swagger/swagger.config.js';

type Endpoint = { method: string; path: string };

function toOpenApiPath(expressPath: string): string {
  // /providers/:id -> /providers/{id}; drop trailing slash from a bare `/` sub-route.
  const withParams = expressPath.replace(/:([^/]+)/g, '{$1}');
  return withParams.length > 1 && withParams.endsWith('/') ? withParams.slice(0, -1) : withParams;
}

function walk(stack: unknown[], prefix: string, out: Endpoint[]): void {
  for (const layer of stack as any[]) {
    if (layer.route) {
      const routePath = layer.route.path as string;
      const methods = Object.keys(layer.route.methods).filter((m) => layer.route.methods[m]);
      for (const method of methods) {
        out.push({ method: method.toUpperCase(), path: toOpenApiPath(prefix + routePath) });
      }
    } else if (layer.name === 'router' && layer.handle?.stack) {
      // Recover the mount path this sub-router was `.use()`d at.
      let mount = '';
      if (layer.regexp && layer.regexp.source !== '^\\/?(?=\\/|$)') {
        const match = layer.regexp.source
          .replace('^\\/', '/')
          .replace('\\/?(?=\\/|$)', '')
          .replace(/\\\//g, '/');
        mount = match;
      }
      walk(layer.handle.stack, prefix + mount, out);
    }
  }
}

const actual: Endpoint[] = [];
walk((apiRouter as Router).stack, '/api/v1', actual);
actual.sort((a, b) => (a.path + a.method).localeCompare(b.path + b.method));

const documented = new Set<string>();
for (const [docPath, methods] of Object.entries(swaggerSpec.paths ?? {})) {
  for (const method of Object.keys(methods as object)) {
    documented.add(`${method.toUpperCase()} /api/v1${docPath}`);
  }
}

const actualKeys = new Set(actual.map((e) => `${e.method} ${e.path}`));

console.log(`--- ${actual.length} actual routes, ${documented.size} documented paths ---\n`);

console.log('=== MISSING FROM SWAGGER (route exists, no @openapi doc) ===');
for (const e of actual) {
  const key = `${e.method} ${e.path}`;
  if (!documented.has(key)) console.log(key);
}

console.log('\n=== STALE IN SWAGGER (documented, route no longer exists) ===');
for (const key of [...documented].sort()) {
  if (!actualKeys.has(key)) console.log(key);
}
