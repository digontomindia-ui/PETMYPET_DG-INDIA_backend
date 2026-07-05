# Architecture

Patmypets is a modular monolith: one Express application and one BullMQ worker
process, sharing a single MongoDB replica set and Redis instance, structured
internally as a set of independent feature modules so it can be split into
services later without a rewrite.

## Layered design

Every module under `src/modules/<name>/` follows the same internal layering
(Clean Architecture / Repository Pattern):

```
routes.ts        Express router + Zod validation wiring + Swagger JSDoc
  -> controller.ts   HTTP concerns only: parse req, call service, shape response
    -> service.ts       Business logic, orchestration, transactions
      -> repository.ts     Mongoose queries, isolates the data layer
        -> schema.ts          Mongoose schema/model definition
validators.ts     Zod request schemas (source of truth for request shapes)
dto.ts            Types inferred from validators (no duplicate type defs)
mapper.ts         Converts Mongoose documents to public-safe response DTOs
constants.ts      Enums, model names, magic numbers
types.ts          Domain interfaces (I<Entity>) and HydratedDocument aliases
```

Controllers never touch Mongoose directly; services never touch `req`/`res`;
repositories are the only layer that imports a Mongoose model. Cross-module
calls go through another module's `service`, never its `repository`.

## Request flow

```mermaid
flowchart TB
    Client["Client Apps (Web / iOS / Android)"]

    subgraph Edge["Edge"]
        LB["Load Balancer / Reverse Proxy"]
    end

    subgraph AppTier["Application Tier (horizontally scalable)"]
        API1["Express API instance"]
        API2["Express API instance N"]
        WS["Socket.io Gateway (JWT-authenticated handshake)"]
    end

    subgraph WorkerTier["Worker Tier"]
        Worker["BullMQ Workers (push / email / sms)"]
    end

    subgraph DataTier["Data Tier"]
        Mongo[("MongoDB Replica Set (multi-doc transactions)")]
        Redis[("Redis (cache / rate-limit / BullMQ broker)")]
    end

    subgraph Observability["Observability"]
        Prom["Prometheus"]
        Grafana["Grafana"]
        OTel["OpenTelemetry"]
        LogsPino["Pino structured logs"]
    end

    subgraph External["External Integrations"]
        Cloudinary["Cloudinary (media)"]
        Razorpay["Razorpay (payments)"]
        Firebase["Firebase (push)"]
        SMTP["SMTP (email)"]
        SMSGW["SMS gateway"]
    end

    Client -->|HTTPS REST| LB
    Client <-->|WebSocket| LB
    LB --> API1
    LB --> API2
    LB --> WS

    API1 --> Mongo
    API2 --> Mongo
    API1 --> Redis
    API2 --> Redis
    WS --> Redis

    API1 -.->|enqueue job, fire-and-forget| Redis
    Redis -.-> Worker
    Worker --> Mongo
    Worker --> Firebase
    Worker --> SMTP
    Worker --> SMSGW

    API1 --> Cloudinary
    API1 --> Razorpay
    Razorpay -.->|webhook| API1

    API1 --> Prom
    API1 --> OTel
    API1 --> LogsPino
    Prom --> Grafana
```

Key production-safety decisions baked into this flow:

- **Job enqueue is fire-and-forget.** `notificationService.notify()` never
  `await`s the BullMQ `.add()` call on the request path — a down/slow Redis
  degrades push/email/SMS delivery, not booking/payment/signup latency.
- **MongoDB runs as a (single-node in dev, multi-node in prod) replica set**
  because the wallet ledger and order placement use multi-document ACID
  transactions (`session.withTransaction()`).
- **Razorpay webhooks** are verified against the raw request body (captured
  before `express.json()` parses it) using `RAZORPAY_WEBHOOK_SECRET`.
- **Refresh tokens rotate on every use** and are stored bcrypt-hashed; reuse
  of an already-rotated token revokes every session for that user (stolen
  refresh-token detection).

## Data model

Three roles share one `User` collection (`role: USER | SERVICE_PROVIDER |
SUPER_ADMIN`); a `SERVICE_PROVIDER` additionally owns one `Provider` document
carrying a `providerType` enum (VET, GROOMER, BOARDING, PET_WALKER, TRAINER,
CLEANER, PHARMACY, RELOCATION, OTHER) instead of splitting into per-vertical
tables.

```mermaid
erDiagram
    USER ||--o| PROVIDER : "has profile"
    USER ||--o{ PET : owns
    USER ||--o{ SESSION : "refresh sessions"
    USER ||--|| WALLET : has
    USER ||--o{ BOOKING : places
    USER ||--o{ ORDER : places
    USER ||--o{ REVIEW : writes
    USER ||--|| CART : has
    USER ||--|| WISHLIST : has
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ POST : authors
    USER ||--o{ SUPPORT_TICKET : opens
    USER ||--o{ LOST_AND_FOUND_POST : reports
    USER ||--o{ BLOG : authors

    CITY ||--o{ ZONE : contains
    ZONE }o--o{ PROVIDER : "serves"
    ZONE ||--o{ BOOKING : "booked in"

    CATEGORY ||--o{ SERVICE : classifies
    PROVIDER ||--o{ SERVICE : offers
    PROVIDER ||--o{ PRODUCT : sells
    PROVIDER ||--o{ BOOKING : fulfills
    PROVIDER ||--o{ REVIEW : "rated on"

    SERVICE ||--o{ BOOKING : "booked as"
    PET ||--o{ BOOKING : "booking for"
    BOOKING ||--o| PAYMENT : "paid via"
    BOOKING ||--o| REVIEW : "reviewed as"
    BOOKING ||--o| CHAT_ROOM : "has chat"
    BOOKING ||--o| COUPON_REDEMPTION : "coupon applied"

    COUPON ||--o{ COUPON_REDEMPTION : redeemed

    WALLET ||--o{ WALLET_TRANSACTION : ledger

    PRODUCT ||--o{ ORDER : "ordered as"
    CART }o--o{ PRODUCT : contains
    WISHLIST }o--o{ PRODUCT : contains

    POST ||--o{ COMMENT : has
    POST ||--o{ LIKE : has
    POST ||--o{ BOOKMARK : has
    POST ||--o{ REPORT : flagged

    SUPPORT_TICKET ||--o{ TICKET_MESSAGE : has
    CHAT_ROOM ||--o{ MESSAGE : has
    CHAT_ROOM }o--o{ USER : participants

    USER {
        ObjectId id PK
        string role "USER | SERVICE_PROVIDER | SUPER_ADMIN"
        string email
        string phone
        boolean isBlocked
    }
    PROVIDER {
        ObjectId id PK
        ObjectId userId FK
        string providerType
        string kycStatus
        Point location
    }
    BOOKING {
        ObjectId id PK
        ObjectId userId FK
        ObjectId providerId FK
        ObjectId serviceId FK
        string status "state machine"
    }
```

`FeatureFlag`, `Setting`, `Banner`, `AuditLog`, and `Otp` are standalone
collections with no foreign keys (key-value/log resources) and are omitted
above for readability.

## Module map

| Domain | Modules |
|---|---|
| Identity | `auth`, `users`, `admin` |
| Marketplace core | `providers`, `services`, `categories`, `zones` (cities + zones) |
| Booking | `bookings`, `availability`, `reviews` |
| Commerce | `wallet`, `coupons`, `payments`, `marketplace` (products, cart, wishlist, orders) |
| Engagement | `notifications`, `chat`, `community` (posts/comments/likes/bookmarks/reports), `blogs` |
| Support | `support`, `lost-and-found` |
| Platform | `pets`, `uploads`, `search`, `analytics` |

## Background jobs

`src/worker.ts` runs the BullMQ workers (`src/common/jobs/`) as a separate
process from the API (`src/server.ts`), so a burst of notification jobs never
competes with the API's event loop. Both processes share the same MongoDB and
Redis connections and can be scaled independently.

## Observability

- **Metrics**: `prom-client` exposes `/metrics`; `docker/prometheus.yml`
  scrapes it; Grafana is wired to Prometheus as a data source.
- **Tracing**: OpenTelemetry auto-instrumentation exports OTLP traces
  (`OTEL_EXPORTER_OTLP_ENDPOINT`).
- **Logs**: Pino structured JSON logs (pretty-printed only in development),
  with request IDs threaded through via `x-request-id`.
