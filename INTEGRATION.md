# Integration Guide — App / Website

Base URL: `http://dxz8l4rvj5ckw3p10k6hwdf9.187.127.210.144.sslip.io`
All routes are under `/api/v1/...` (e.g. `/api/v1/auth/login`).
Swagger docs: `/api-docs` (spec JSON at `/api-docs.json`).
Health check: `/health`.

Ready-made test accounts and seeded IDs (city/category/service/provider/product/coupon/booking/etc.) are in `CREDENTIALS.md` (gitignored, local only) — use them instead of re-seeding.

## Response envelope

Every response is JSON:
```json
{ "success": true, "message": "Success", "data": { ... } }
```
List endpoints add pagination:
```json
{ "success": true, "message": "Success", "data": [...], "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 1 } }
```
Errors:
```json
{ "success": false, "error": "UNAUTHORIZED", "message": "Invalid email or password" }
```
Check `success`, not just HTTP status, when parsing responses.

## Auth flow

**Primary flow (both apps — this is what the actual LogIn screens use):**
phone number + OTP, self-registering. There is no separate signup form for
this path; a new phone number is auto-created on first OTP request.

1. `POST /auth/login/otp/request {identifier: <phone>, referralCode?, role?}`
   → `200`, `{isRegistered: boolean}`. If the phone has no account yet, one
   is created here (bare-minimum row) and sent an OTP exactly like a
   returning number. `role` (`USER`|`SERVICE_PROVIDER`) only applies to that
   auto-created account. `isRegistered: false` means route the client to
   onboarding after verify; `true` means route straight to Home.
2. `POST /auth/login/otp/verify {identifier, code}` → `{user, tokens}`,
   account marked verified.
   - **OTP is currently always `123456`** in this environment (no SMTP/SMS
     creds configured yet — see CREDENTIALS.md). Switches to a real random
     OTP automatically once SMTP/SMS creds are added.
3. New accounts (`isRegistered` was `false`): finish onboarding via `PUT
   /users/me {name, email?}` and whatever else the onboarding screens
   collect (pets, address, preferences) — none of it is required up front.

**Secondary flow** (email/phone + password — used by the provider app's
"Login with Password" option, or any account that has explicitly set a
password via reset/update-password):

- `POST /auth/signup {name, email, phone, password, role}` → `201`, account
  unverified, then `POST /auth/signup/verify {identifier: email, code}` to
  activate it. This is a distinct path from the OTP flow above — use it only
  for an explicit email+password signup form, not the real mobile LogIn
  screens.
- `POST /auth/login {identifier: email|phone, password}` → `{isRegistered,
  user, tokens}`. `400` if the account has no password set (phone-only
  accounts) — direct the client to the OTP flow instead.

**Common to both:**

- Send `Authorization: Bearer <accessToken>` on authenticated routes.
- **Access token expires in 15 minutes.** `POST /auth/refresh {refreshToken}`
  → new token pair before/when it expires. Refresh token lives 30 days.
- `POST /auth/logout {refreshToken}` invalidates one session;
  `POST /auth/logout-all` (authenticated) kills all sessions for the user.

Roles: `USER`, `SERVICE_PROVIDER`, `SUPER_ADMIN`. `SUPER_ADMIN` can't be created via signup — only seeded directly (see CREDENTIALS.md for the test admin).

### Rate limits to design around

- General API: 100 req / 15 min per IP (`RATE_LIMIT_*`).
- `/auth/*` specifically: 100 req / 15 min per IP as of this testing round (raised from the original 10 — see git history on `docker-compose.yml`). Build in exponential backoff / don't hammer login or OTP-resend in a tight loop, especially from a shared IP (office wifi, CI runner) where it adds up across testers.
- OTP resend has its own per-identifier cooldown (`OTP_RESEND_COOLDOWN_SECONDS`, 60s) — expect `429 TOO_MANY_REQUESTS` if resent faster than that.

## Module map

All mounted under `/api/v1`:

| Path | Covers |
|---|---|
| `/auth` | signup/login/OTP/refresh/logout/password reset |
| `/users` | profile, addresses, admin user list/block/delete |
| `/cities`, `/zones` | admin-managed geography (SUPER_ADMIN write, public read) |
| `/providers` | service provider profile + KYC approval (admin) |
| `/pets` | user's pets |
| `/categories` | service categories (admin write, public read) |
| `/services` | bookable services under a category (provider/admin write) |
| `/bookings` | create/accept/on-the-way/OTP-start/OTP-end/complete lifecycle |
| `/wallet` | balance, transactions, admin credit/debit — **admin adjust is currently broken, see below** |
| `/coupons` | admin CRUD + validate — **redemption during booking is currently broken, see below** |
| `/payments` | Razorpay order/verify/refund — **blocked, no Razorpay creds in this env** |
| `/notifications` | user notification feed |
| `/chat` | 1:1 rooms + messages |
| `/posts` | community posts/comments/likes, moderation |
| `/products`, `/cart`, `/wishlist`, `/orders` | marketplace — **order placement is currently broken, see below** |
| `/reviews` | reviews on completed bookings |
| `/support-tickets` | user support tickets, admin status updates |
| `/blogs` | admin-authored, publicly readable |
| `/lost-and-found` | user posts, admin approval gate |
| `/search` | cross-entity search |
| `/analytics`, `/admin` | SUPER_ADMIN dashboard/stats |
| `/uploads` | file upload — **needs Cloudinary creds, currently blank, fails cleanly now** |
| `/availability` | provider open-slot lookup |

## Known-limited flows

1. **Payments** (`/payments/*`, Razorpay order creation) are blocked until real Razorpay keys are added — fails cleanly with a 4xx now, not a crash.
2. **Uploads** (`/uploads`) need real Cloudinary keys — fails cleanly with a 4xx now, not a crash.
3. **Push notifications** (Firebase) and **real email/SMS** (SMTP/SMS) are unconfigured — in-app notification records still get created, just no external push/email/SMS actually sends.

Everything else — including coupon redemption on bookings, wallet admin credit/debit, and marketplace order placement — was tested end-to-end against this prod deployment and works. (Those three used to 500 on this standalone-MongoDB deployment because they relied on multi-document transactions; fixed by switching to atomic single-document updates with compensating rollback — see `CREDENTIALS.md` for detail.)

## Example: full booking flow (no coupon)

```
POST /bookings           {providerId, serviceId, scheduledStart, notes?}      → status PENDING
PATCH /bookings/:id/accept                                                    (provider)
PATCH /bookings/:id/on-the-way                                                (provider)
POST  /bookings/:id/otp/start   {code}                                        (provider, code = 123456 in this env)
POST  /bookings/:id/otp/end     {code}                                        (provider)
POST  /reviews            {bookingId, rating, comment}                       (user)
```
Use the seeded provider/service/city/zone/category IDs in `CREDENTIALS.md` to skip re-seeding this chain yourself.
