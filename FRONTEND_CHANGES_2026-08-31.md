# Backend changes — 2026-08-31

For each item Madhab reported. Base URL unchanged: `http://dxz8l4rvj5ckw3p10k6hwdf9.187.127.210.144.sslip.io/api/v1`

**Before any of this is testable on that URL, the backend needs to be redeployed AND reseeded** — see "Deploy note" at the bottom. Everything below was verified locally end-to-end (real login, real booking, real DB) before writing this doc.

---

## 1. AI chat endpoints (new)

There was no AI/bot chat before — only human-to-human chat (`/chat/rooms`, unchanged). Added a new module backed by **Google Gemini**:

```
GET  /ai-chat/messages          — paginated history for the logged-in user, newest first
POST /ai-chat/messages          — { "text": "..." } → saves the message, calls Gemini, saves + returns the reply
```

```jsonc
// POST /ai-chat/messages response
{
  "success": true,
  "data": {
    "userMessage": { "id": "...", "role": "USER", "text": "How often should I bathe my golden retriever?", "createdAt": "..." },
    "assistantMessage": { "id": "...", "role": "ASSISTANT", "text": "A weekly bath is usually enough...", "createdAt": "..." }
  }
}
```

**Not live yet** — needs a `GEMINI_API_KEY` in the server `.env` (get one free at ai.google.dev). Until it's set, `POST /ai-chat/messages` returns a clean `500 Gemini is not configured` instead of a reply. `GET` works either way (returns `[]` with no key).

Scope: this is a general pet-care Q&A assistant, not tied to bookings/payments — it can't see or change a user's account, and says so if asked. It's a separate thread per user, not per booking.

## 2. Boarding detail page — no gallery, no certifications, no reviews

**Not a code bug** — `certifications` and `galleryUrls` have been on the `Provider` model since the [Aug 27 changes](FRONTEND_CHANGES_2026-08-27.md), but the **staging DB was never reseeded** after that, so the provider docs there predate those fields and show `[]`. Confirmed locally: after reseeding, every provider has both populated.

Reviews were never part of the provider object — they're a separate list:
```
GET /reviews?providerId=<id>   → array of { id, bookingId, userId, rating, comment, createdAt }
```
Call it alongside `GET /providers/:id` to build the boarding detail page (rating/ratingCount summary comes from the provider object; individual reviews come from this endpoint). `POST /reviews` lets a user leave one after a booking completes.

## 3. Kolkata Paw Stay Boarding Center — real photo

Used the storefront photo you sent instead of a placeholder. No Cloudinary account is configured yet (`.env` had empty `CLOUDINARY_*`), so rather than block on that, the photo is now served directly by this backend:

```
GET /static/seed/kolkata-boarding-center.jpg
```

`profileImageUrl` and the first `galleryUrls` entry for that one provider now point at `${PUBLIC_BASE_URL}/static/seed/kolkata-boarding-center.jpg`. **`PUBLIC_BASE_URL` must be set to the real staging host before reseeding** (see Deploy note) or the URL will be wrong. All other seeded providers still use `picsum.photos` placeholders as before.

If/when you get Cloudinary creds, give them to me and I'll switch this (and future uploads) over — that's the more scalable path for provider-uploaded photos going forward; `/static` is a stopgap for this one seeded image.

## 4. `GET /bookings/me` — no service name/description

`Booking` only ever stored `serviceId`. Every booking response (create, get-by-id, list, accept, cancel, etc.) now also includes:

```jsonc
{
  "serviceId": "...",
  "serviceName": "Standard Boarding",        // new
  "serviceDescription": "Per-day boarding with daily walks"  // new
}
```

Verified against a real created booking — both fields come back correctly.

## 5. User payment history (new)

```
GET /payments/me?page=1&limit=20   — the logged-in user's own payments, newest first
```

Same shape as the existing (admin-only) `GET /payments` and `GET /payments/:id`, just scoped to the caller. `category`/service info isn't on the Payment record itself — join with `GET /bookings/:id` (via the payment's `bookingId`) if the screen needs it, since #4 now puts the service name there.

## 6. Category images were always blank

`categorySchema` had an `iconUrl` field, but the seed script never set it — so it was `null` for every category regardless of reseeding. Fixed: categories now seed with a real `iconUrl` (same `picsum.photos` pattern as everything else). No API shape change, `GET /categories` already returned the field, it was just empty.

## 7. Pet companion "discover" returning empty

Root cause was thin seed data, not a query bug: only **2** pets in the whole dataset had `companionProfile.isEnabled: true` (Bruno and Luna) — and the seed script *also* pre-creates a mutual match between those exact two pets for demo purposes. So Bruno's only possible candidate was always pre-swiped, and discover was empty for every account by construction.

Added a third companion-enabled pet (Max, owned by Rahul, no pre-existing swipe) so there's always at least one real unswiped candidate nearby. Verified locally: `GET /pet-companion/discover?petId=<bruno>&lat=12.9716&lng=77.5946&radiusMeters=50000` now returns Max.

The endpoint itself works as designed — no code change there, just needs pets with `companionProfile.isEnabled: true` who haven't already swiped each other.

## 8. Razorpay

Added the test key you sent (`rzp_test_TRI9WXJEerKDua`) to `.env` locally. `RAZORPAY_WEBHOOK_SECRET` is still empty — get that from the Razorpay dashboard's webhook config when you set one up, otherwise `POST /payments/webhook` will reject every event. Same three vars need to be set in the staging `.env` too (they're currently blank there).

---

## Deploy note

None of this is visible on the staging URL until:

1. **Rebuild the Docker image** — `Dockerfile` now also copies `public/` (the boarding photo lives there); the old image doesn't have it.
2. **Set new env vars on staging** before starting the container:
   - `PUBLIC_BASE_URL=http://dxz8l4rvj5ckw3p10k6hwdf9.187.127.210.144.sslip.io` (no trailing slash)
   - `GEMINI_API_KEY=` (leave empty for now, or set once you have one — AI chat degrades gracefully either way)
   - `RAZORPAY_KEY_ID=rzp_test_TRI9WXJEerKDua`, `RAZORPAY_KEY_SECRET=3jm4Nc1uHOIethIDk3XYnBlB`
3. **Reseed** (`npm run seed` against the staging DB, or drop it and let the container's start script reseed) — the script is idempotent and skips if data already exists, so the existing staging city/provider docs need to be dropped first for the new fields (gallery, certs, category icons, the boarding photo, the extra companion pet) to appear.
