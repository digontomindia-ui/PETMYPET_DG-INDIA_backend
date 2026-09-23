// Read-only: calls every provider-app GET endpoint on the live API as each provider (token
// signed locally with JWT_ACCESS_SECRET) and prints, per providerType + endpoint, the JSON
// paths that come back blank ("" / null / [] / 0). Prints paths only, never values.
// Usage: MONGO_URI="<uri>" JWT_ACCESS_SECRET="<secret>" API="https://host/api/v1" node scripts/audit-providerapp-blanks.mjs

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const { MONGO_URI, JWT_ACCESS_SECRET, API } = process.env;
if (!MONGO_URI || !JWT_ACCESS_SECRET || !API) throw new Error('set MONGO_URI, JWT_ACCESS_SECRET, API');

const ENDPOINTS = ['/home', '/profile', '/my-appointments', '/appointments', '/analytics', '/patients', '/message'];

function blanks(v, path, out) {
  if (v === '' || v === null || v === 0 || v === '0' || (Array.isArray(v) && v.length === 0)) out.add(path);
  else if (Array.isArray(v)) blanks(v[0], `${path}[]`, out);
  else if (typeof v === 'object') for (const [k, x] of Object.entries(v)) blanks(x, path ? `${path}.${k}` : k, out);
}

await mongoose.connect(MONGO_URI);
const providers = await mongoose.connection.db.collection('providers').find({}).toArray();
await mongoose.disconnect();

const report = {};
for (const p of providers) {
  const token = jwt.sign({ userId: p.userId.toString(), role: 'SERVICE_PROVIDER', sessionId: 'audit' }, JWT_ACCESS_SECRET, { expiresIn: '5m' });
  for (const ep of ENDPOINTS) {
    const res = await fetch(API + ep, { headers: { Authorization: `Bearer ${token}` } });
    const key = `${p.providerType} ${ep}`;
    report[key] ??= { n: 0, status: new Set(), paths: {} };
    const r = report[key];
    r.n++;
    r.status.add(res.status);
    if (!res.ok) continue;
    const out = new Set();
    blanks(await res.json(), '', out);
    for (const path of out) r.paths[path] = (r.paths[path] ?? 0) + 1;
  }
}
for (const [key, r] of Object.entries(report)) {
  console.log(`\n## ${key} (${r.n} accounts, status ${[...r.status]})`);
  for (const [path, c] of Object.entries(r.paths)) console.log(`  ${path}: ${c}/${r.n}`);
}
