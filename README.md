# Patmypets Backend

Production REST API for Patmypets, a multi-service pet-care marketplace
connecting pet owners with vets, groomers, boarding facilities, walkers,
trainers, and other service providers.

## Tech stack

Node.js · Express · TypeScript · MongoDB/Mongoose (replica set, ACID
transactions) · Redis · BullMQ · Socket.io · Cloudinary · Razorpay · Zod ·
Pino · OpenTelemetry · Prometheus · Firebase Cloud Messaging · Swagger/OpenAPI
· Vitest/Supertest · ESLint/Prettier · Docker.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the layered module
structure, request flow, and data model (ER diagram), and
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for running this in Docker and
production.

## Roles

Three roles share one authentication system:

- **USER** — pet owner: books services, buys marketplace products, manages pets.
- **SERVICE_PROVIDER** — one role with a `providerType` enum (`VET`,
  `GROOMER`, `BOARDING`, `PET_WALKER`, `TRAINER`, `CLEANER`, `PHARMACY`,
  `RELOCATION`, `OTHER`) instead of separate tables per vertical.
- **SUPER_ADMIN** — platform operations: KYC approval, moderation, refunds,
  feature flags, dashboards.

## Modules

`auth`, `users`, `admin`, `providers`, `services`, `categories`, `zones`
(cities + zones), `pets`, `bookings`, `availability`, `reviews`, `wallet`,
`coupons`, `payments`, `marketplace` (products/cart/wishlist/orders),
`notifications`, `chat`, `community` (posts/comments/likes/bookmarks/reports),
`blogs`, `support`, `lost-and-found`, `uploads`, `search`, `analytics`,
`referrals`, `pet-taxi`, `pet-relocation`, `pet-insurance`, `pet-companion`.

See [`SCREEN_TO_API_GUIDE.md`](SCREEN_TO_API_GUIDE.md) for a screen-by-screen
mapping of every app UI screen to the exact endpoint(s) it calls.

## Quick start

```bash
cp .env.example .env
docker compose up mongo redis mongo-init   # infra only
npm install
npm run dev        # API on http://localhost:4000
npm run worker      # in a second terminal: BullMQ notification workers
```

Or run the entire stack (API, worker, MongoDB, Redis, Prometheus, Grafana) in
Docker — see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md):

```bash
cp .env.example .env
docker compose up --build
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | API with hot reload (`tsx watch`) |
| `npm run worker` | BullMQ notification workers with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build (`dist/server.js`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `lint:fix` | ESLint over `src/` and `tests/` |
| `npm run format` / `format:check` | Prettier |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Vitest with coverage |
| `npm run seed` | Seed a full cross-referenced dev dataset — cities/zones/categories, an admin, 3 end users (one referred by another), 8 providers (one per `providerType`) with services/packages, products, coupons, bookings in different lifecycle states, a Pet Companion match, pet-taxi/relocation/insurance records, and more. Idempotent — skips if city "Bangalore" already exists. Prints test credentials to the console on completion. |

## Testing

Integration tests spin up an isolated `MongoMemoryReplSet` per test file (real
multi-document transaction support, no shared state between files) and drive
the API through Supertest end-to-end — no service-layer mocking of the
database. External services (Cloudinary, Razorpay, mailer, SMS, Firebase) are
mocked at the integration boundary. Run the whole suite with:

```bash
npm test
```

## API documentation

- Swagger UI: `GET /api-docs` (interactive, try-it-out enabled)
- Raw OpenAPI 3.0 JSON: `GET /api-docs.json` — import directly into Postman
  or Insomnia via "Import > OpenAPI", or use the checked-in snapshot at
  [`docs/openapi.json`](docs/openapi.json)
- Health check: `GET /health`
- Prometheus metrics: `GET /metrics`

## Environment variables

All variables are validated at boot (`src/common/config/env.ts`) — the
process refuses to start if a required one is missing or malformed. See
[`.env.example`](.env.example) for the full, commented reference and
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for a production checklist.

## Project structure

```
src/
  app.ts                Express app wiring (middleware, routes, error handling)
  server.ts              API process entry point
  worker.ts               BullMQ worker process entry point
  common/                 Cross-cutting: config, errors, middlewares, database,
                           integrations (Cloudinary/Razorpay/Firebase/mailer/sms),
                           jobs, observability, swagger, utils
  modules/<name>/          One folder per domain module (see Modules above),
                           each following the same layered structure —
                           see docs/ARCHITECTURE.md
  routes/index.ts          Central router aggregator
  sockets/                 Socket.io server + gateways
tests/                    Mirrors src/modules/, plus tests/helpers/ for
                           shared signup/provider/booking fixtures
docs/                     Architecture, deployment, and OpenAPI snapshot
docker/                   Prometheus config, etc.
```
