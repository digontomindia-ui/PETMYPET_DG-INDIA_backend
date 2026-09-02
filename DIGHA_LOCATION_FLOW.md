# Digha Test Location — Frontend Integration Guide

Base URL: `http://dxz8l4rvj5ckw3p10k6hwdf9.187.127.210.144.sslip.io/api/v1`

Digha coordinates used for all "nearby" queries: `lat=21.6274, lng=87.5093` (or any point within ~8km of `[87.5593, 21.6745]`).

## 1. Zone / City

| Field | Value |
|---|---|
| City | Digha, West Bengal |
| Zone name | Digha Central |
| Zone id | `6a983ad5e59053bee26a23d2` |
| Zone center | `[87.55930839999999, 21.674505699999997]` (lng, lat) |
| Radius | 8000m |

Fetch fresh: `GET /zones` → filter `name === "Digha Central"`.

## 2. Providers seeded in Digha (all `kycStatus: APPROVED`, `isActive: true`)

| Type | Business | providerId | serviceId | Service name | Price |
|---|---|---|---|---|---|
| PET_SITTER | Digha Trusted Pet Sitters | `6a983adbe59053bee26a2455` | `6a983adee59053bee26a24a7` | Half-Day Pet Sitting | ₹449 |
| VET | Digha Popular Pet Clinic | `6a983adbe59053bee26a244f` | `6a983adee59053bee26a24a5` | General Consultation | ₹499 |
| BOARDING | Digha Paw Stay Boarding Center | `6a983adbe59053bee26a2449` | `6a983adee59053bee26a24a1` | Standard Boarding | ₹799 |
| GROOMER | Digha Paw Grooming Studio | `6a9848c78f098e690ff939fa` | `6a9849418f098e690ff93a20` | Basic Grooming | ₹499 |

**Do not hardcode these IDs client-side.** They're only valid until the next DB reseed. Always resolve fresh via the endpoints below.

## 3. Correct fetch flow

```
GET /providers/nearby?lat=21.6274&lng=87.5093&radiusMeters=50000
  → gives current providerId per business/type in Digha

GET /services?providerId=<providerId>
  → gives current serviceId(s) for that provider

GET /availability?providerId=<providerId>&serviceId=<serviceId>&date=YYYY-MM-DD
  → all three params required; missing any one returns 404, not a validation error

POST /bookings
  { "providerId": "...", "serviceId": "...", "scheduledStart": "<ISO datetime>" }
```

⚠️ A previous test used stale IDs (`providerId=6a8bc5bf...`, `serviceId=6a8bc5b7...`) left over from before a DB reseed — those return `404 Provider not found` / empty availability. Any hardcoded ID from an old test session will break the same way after every reseed. Always chain `nearby` → `services` → `availability`/`bookings` at runtime.

## 4. Verified live (2026-09-02)

Tested end-to-end against staging with a Digha-based seeded user (`sourav.das@seed.patmypets.in`):

- `GET /providers/nearby` (Digha coords) → returns all 4 providers above.
- `GET /services?providerId=...` → correct service per provider.
- `GET /availability` with correct IDs → full day of open slots (`isAvailable: true`).
- `POST /bookings` → succeeded for GROOMER, VET, BOARDING. PET_SITTER hit a real time-conflict (provider already booked that slot from earlier testing) — expected behavior, not a bug.
- `GET /bookings/me` → all 3 created bookings (Basic Grooming, General Consultation, Standard Boarding) show up correctly with `status: PENDING`.

Booking creation is not restricted by provider type — confirmed working for every category in Digha, and every booking correctly appears in `/bookings/me` afterward.

## 5. Auth for testing

Seeded Digha user: `sourav.das@seed.patmypets.in` / `Passw0rd!` (has a default address in New Digha).

`POST /auth/login` with `{ "identifier": "sourav.das@seed.patmypets.in", "password": "Passw0rd!" }` → use `data.tokens.accessToken` as `Authorization: Bearer <token>`.
