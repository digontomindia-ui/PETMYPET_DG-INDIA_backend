# Deployment Guide

## Prerequisites

- Node.js >= 20 (only needed for local, non-Docker development)
- Docker + Docker Compose
- A MongoDB deployment that is a **replica set** (even a single node) — the
  wallet ledger and order placement use multi-document transactions, which
  MongoDB only allows on a replica set.
- A Redis instance (cache, rate-limit store, BullMQ broker)

## Local development

```bash
cp .env.example .env
docker compose up mongo redis mongo-init   # infra only
npm install
npm run dev                                 # API on :4000, auto-reload
npm run worker                              # in a second terminal, notification workers
```

`mongo-init` is a one-shot container that runs `rs.initiate(...)` on the
`mongo` service so the single-node replica set is ready before the app
connects; it exits after running once.

If you'd rather not touch `/etc/hosts` to resolve the `mongo` hostname from
the host machine, run the whole stack in Docker instead (see below) — no
extra setup required.

## Full stack via Docker Compose

```bash
cp .env.example .env   # fill in real secrets before going to production
docker compose up --build
```

This starts: `app` (API), `worker` (BullMQ consumers), `mongo` (replica-set
single node), `mongo-init`, `redis`, `prometheus`, and `grafana`.

| Service | URL |
|---|---|
| API | http://localhost:4000/api/v1 |
| Swagger UI | http://localhost:4000/api-docs |
| Health check | http://localhost:4000/health |
| Metrics | http://localhost:4000/metrics |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

## Environment variables

All variables are validated at boot by a Zod schema (`src/common/config/env.ts`)
— the process refuses to start if a required one is missing or malformed.
See `.env.example` for the full, commented list. Highlights:

| Variable | Purpose |
|---|---|
| `MONGO_URI` | Must include `?replicaSet=<name>` |
| `REDIS_URL` | Shared by cache, rate limiter, and BullMQ |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | >= 32 chars, rotate independently of each other |
| `CORS_ORIGINS` | Comma-separated allow-list; lock this down in production |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Payments; the client is lazily instantiated so the app still boots without them (e.g. in review environments) |
| `CLOUDINARY_*` | Media uploads |
| `FIREBASE_*` | Push notifications |
| `SMTP_*` / `SMS_*` | Transactional email/SMS |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Trace export target |
| `DEFAULT_PLATFORM_COMMISSION_PERCENT`, `BOOKING_AUTO_CANCEL_MINUTES`, `CURRENCY` | Business rules — never hardcoded in source |

## Production checklist

- [ ] `NODE_ENV=production` (Docker Compose sets this explicitly, overriding
      any stale value in `.env`'s `env_file` — don't rely on the Dockerfile
      default alone).
- [ ] Real, unique `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (32+ chars,
      generated with a CSPRNG, not the placeholder values in `.env.example`).
- [ ] `MONGO_URI` points at a real multi-node replica set (or a managed
      service like MongoDB Atlas) — single-node is fine for dev/staging only.
- [ ] `REDIS_URL` points at a persistent Redis (AOF or RDB enabled) — losing
      Redis loses in-flight BullMQ jobs and rate-limit state.
- [ ] `CORS_ORIGINS` restricted to real client origins.
- [ ] Razorpay: live-mode keys, and the webhook secret matches what's
      configured in the Razorpay dashboard for this endpoint's URL.
- [ ] Firebase service account key is a production project's, not a dev one.
- [ ] TLS terminated at the load balancer/reverse proxy in front of `app`.
- [ ] `app` and `worker` run as separate, independently scalable deployments
      (see below) — don't run `worker`'s command inside the `app` container.
- [ ] Prometheus/Grafana (or your existing observability stack) scraping
      `/metrics` and an OTLP collector receiving traces.
- [ ] Structured logs (Pino JSON) shipped to a log aggregator; `LOG_LEVEL=info`
      or stricter in production (never `debug`).
- [ ] Backups configured for the MongoDB replica set.

## Scaling

- **API (`app`)** is stateless — scale horizontally behind the load balancer.
  Socket.io is mounted on the same Express server; if you run multiple `app`
  replicas, add the Redis adapter for Socket.io so real-time events fan out
  across instances (not required for a single replica).
- **Worker** scales independently of the API — increase replica count to
  raise notification throughput without touching request-serving capacity.
- **MongoDB** — scale reads via replica set secondaries; the app always
  transacts against the primary (transactions require it).
- **Redis** — a single instance is enough for moderate load; move to a
  Redis Cluster or managed Redis (e.g. ElastiCache) once BullMQ throughput
  or rate-limit key volume outgrows one node.

## CI pipeline (suggested)

The repo doesn't ship a CI config, but the local scripts map directly onto
one:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
docker build -t patmypets-backend .
```

Run these in order on every PR; only build/push the Docker image and deploy
after all five pass.

## API documentation for Postman / Insomnia

The live OpenAPI spec is served at `/api-docs` (Swagger UI) and as raw JSON
at `/api-docs.json`. A static snapshot is also checked in at
[`docs/openapi.json`](./openapi.json) — import either URL directly into
Postman or Insomnia via "Import > OpenAPI" to get a full request collection
without hand-maintaining a separate Postman export.
