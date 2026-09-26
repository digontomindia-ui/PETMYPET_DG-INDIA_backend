# Provider App — Screen → API Guide

Standalone, provider-app-only extract of [`SCREEN_TO_API_GUIDE.md`](SCREEN_TO_API_GUIDE.md)
("Part 2 — Service-Provider App"), for handing to the provider app team without
the end-user sections in the way. **Source of truth is the combined doc** — if
these two ever disagree, trust `SCREEN_TO_API_GUIDE.md` and update this file to
match.

**Base URL**: `/api/v1` (Swagger UI at `/api-docs`, spec at `/api-docs.json` or
[`docs/openapi.json`](docs/openapi.json) — every endpoint below has a full
request/response schema + example there; this doc gives you the field names
and the flow).

**Envelope** (every response): `{ success, message, data, meta? }` on success;
`{ success: false, error: "CODE", message }` on error. Check `success`, not
just HTTP status.

**Auth header**: `Authorization: Bearer <accessToken>`.

A provider is a `USER` account (`role: SERVICE_PROVIDER`) that has also
created a separate `Provider` business-profile document — login/signup is
identical to the end-user app, the business profile is a distinct, later step.

---

## 1. Onboarding / Auth

| Screen | Endpoint(s) |
|---|---|
| `Select your role` | Client-side only — the 7 role cards map to `providerType` enum values: `GROOMER`, `VET` (both "Pet Clinics" and "Vets" cards map to `VET` — no separate distinction exists), `BOARDING`, `TRAINER`, `PET_WALKER`, `PET_SITTER`, `OTHER`. Pass the chosen role into `POST /auth/login/otp/request`'s `role` field. |
| `LogIn`, `LogIn OTP` | `POST /auth/login/otp/request {identifier: <phone>, role}` → `{isRegistered}` → `POST /auth/login/otp/verify {identifier, code}` → `{user, tokens}`. Same auto-signup-on-first-OTP flow as the end-user app: a phone with no account gets one created here with `role: SERVICE_PROVIDER`, then sent an OTP like a returning number. `isRegistered: false` → route to onboarding after verify; `true` → straight to Dashboard. `POST /auth/otp/resend {identifier, purpose: "LOGIN"}` for the resend-timer button. |
| `LogIn-1` ("Login with Password" option) | `POST /auth/login {identifier, password}` — secondary path, only works once a password has been set via `POST /auth/reset-password` or `POST /auth/update-password`. |
| (post-login, first time) | `POST /providers/me {providerType, businessName, description?, experienceYears?, languages?, coordinates:[lng,lat], address, zoneIds?, workingHours?, metadata?}` — creates the business profile, `kycStatus` starts `PENDING`. |
| KYC upload | `POST /providers/me/kyc-documents {type, url}` (upload the file via `POST /uploads` with category `KYC_DOCUMENT` first, then pass the returned URL here). `DELETE /providers/me/kyc-documents/{documentId}` to remove one. `GET /providers/me` returns the uploaded `kycDocuments` list plus `kycStatus`/`kycRejectionReason`. |
| `Start Otp` / `End otp` (mid-booking, not login) | `POST /bookings/{id}/otp/start {code}`, `POST /bookings/{id}/otp/end {code}` — see section 5. |

## 2. Dashboard / Home

Composed client-side from several calls, same pattern as the end-user Home:

- `GET /providers/me` — identity card, `isActive` toggle state, `kycStatus`, `experienceYears`, `languages`.
- `PATCH /providers/me/active {isActive}` — Available/Offline toggle.
- `GET /providers/me/analytics?range=week|month` — the whole Dashboard earnings/rating section, see section 3.
- `GET /bookings/provider/me?status=PENDING` — today's/upcoming visits list. (Or `GET /bookings/me` with a `SERVICE_PROVIDER` token — same handler, same response shape; `/bookings/provider/me` is kept only for existing clients, see the note in section 4.)
- `GET /reviews?providerId=<own id>` — Recent Reviews.
- `GET /wallet/me` — wallet balance tile. ⚠️ See Known Gaps below: provider payouts aren't wired to the wallet automatically yet.

## 3. Analytics / Earnings

`GET /providers/me/analytics?range=week` (or `month`) returns everything this
screen needs in one call:

- `earningsByDay`, `bookingCount`, `ratingBreakdown`, `repeatClientPercent` (retention rate)
- `caseMix: [{categoryId, categoryName, count, percent}]` — "Case Mix" donut
- `topServices: [{serviceId, name, price, bookingCount}]` — "Top-Rated Services" list, ranked by booking volume (not a per-service rating — reviews are linked to the provider as a whole, not a specific service)
- `avgServiceDurationMinutes` — "Avg Consult Time"
- `satisfactionScore` — weighted average rating, as a single number
- `previousPeriodEarnings` — compute "Monthly Growth %" client-side as `(earningsByDay.sum - previousPeriodEarnings) / previousPeriodEarnings`

No "Activity Pulse" daily-intensity sparkline endpoint exists — see Known Gaps.

## 4. Appointments / Bookings Management

- List/filter → `GET /bookings/me?status=PENDING,ACCEPTED,ON_THE_WAY,STARTED` for "Upcoming" (comma-separated status list), plus `from=YYYY-MM-DD&to=YYYY-MM-DD` for "Today"/"This Week" chips. Called with a `SERVICE_PROVIDER` token this returns bookings **against your provider profile**, not a customer's own bookings — same endpoint the end-user app calls, the backend dispatches on the caller's role.
  - `GET /bookings/provider/me` is the same handler under its old path — **deprecated**, kept only so existing app builds don't break; point new/updated builds at `GET /bookings/me`.
- Accept → `PATCH /bookings/{id}/accept`
- Mark en route → `PATCH /bookings/{id}/on-the-way`
- Cancel → `PATCH /bookings/{id}/cancel {reason}`
- Get one → `GET /bookings/{id}`

## 5. Live Service Execution (Start → In Progress → Complete)

1. **Start Service** (booking detail before arrival) → `GET /bookings/{id}` for customer/pet/package info.
2. **Verify Start OTP** → `POST /bookings/{id}/otp/start {code}` — status becomes `STARTED`.
3. **Service In Progress** → `PATCH /bookings/{id}/notes {notes}` for the free-text special-instructions box; `POST /bookings/{id}/photos {url, phase: "BEFORE"}` per photo (upload via `POST /uploads` first, category `PROVIDER_PORTFOLIO`, then attach the URL here). Both are only allowed while the booking is `ACCEPTED`, `ON_THE_WAY`, or `STARTED`, and only by the assigned provider.
4. **Complete Service** → `POST /bookings/{id}/otp/end {code, lat, lng}` — caller must be within range of the customer's default address (server-checked); status becomes `COMPLETED`. Upload after-photos the same way with `phase: "AFTER"`.
5. **Service Completed screen** → `GET /bookings/{id}` for the summary (earnings = `price - discountAmount`, `photos`, `providerNotes`).

**Live walk tracking** (dog-walking bookings only): join `booking:{bookingId}`
via the `walk:join` socket event, then emit `walk:update {bookingId,
distanceMeters, durationSeconds, steps, calories}` periodically while
walking — this both persists the stats (`bookingService.updateWalkStats`) and
re-broadcasts `walk:update` to the room so the customer app can show live
tracking. `walk:started`/`walk:ended` are server→room-only events fired when
the start/end OTP is verified. A provider-side "Live Walk Tracker" screen that
reads back its own in-progress stats isn't implemented — see Known Gaps.

## 6. Messages

`GET /chat/rooms?isUrgent=true` for the "Emergency" filter pill, `GET
/chat/rooms` for "All Chats", `GET /chat/rooms/{roomId}/messages`, `POST
/chat/rooms/{roomId}/messages`, `PATCH /chat/rooms/{roomId}/read`. Flag a room
urgent (e.g. from a keyword or manual triage): `PATCH
/chat/rooms/{roomId}/urgent {isUrgent: true}`.

Realtime delivery: connect a socket with `handshake.auth.token = <accessToken>`,
listen for `chat:message` (also delivered to your personal `user:{userId}`
room even if you haven't joined the chat room), `chat:typing`, `chat:read`.
Emit `chat:join {roomId}` on opening a conversation.

## 7. Notifications & Push

- `POST /users/me/device-tokens {token, platform}` — register FCM token on login/app-open; `DELETE /users/me/device-tokens {token}` on logout.
- `GET /notifications` — in-app notification list (new booking request, cancellation, etc.).
- `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all`, `DELETE /notifications/{id}`.

There is no push-specific "new booking" socket event — booking-status changes
arrive via FCM push (if device token registered) + the in-app notification
list above; refresh booking screens by re-calling `GET /bookings/me` /
`GET /bookings/{id}`.

## 8. Profile / Account Management

- `GET /providers/me` / `PUT /providers/me` — business info, `experienceYears`, `languages`, working hours, metadata.
- `PUT /providers/me/bank-account {accountHolderName, accountNumber, ifscCode, bankName}` — payout destination; `GET /providers/me` echoes it back masked as `{accountHolderName, bankName, last4}`.
- `GET /providers/me/attendance` — full check-in/check-out history; `POST /providers/me/attendance/check-in`, `POST /providers/me/attendance/check-out`.
- **Holidays / blocked dates** → `POST /providers/me/unavailable-dates {date}`, `DELETE /providers/me/unavailable-dates/{date}` — excluded from `GET /availability`'s bookable slots automatically.
- **Staff Management** (Boarding Center) and **My Packages** (Groomer) menu items — **not implemented**, see Known Gaps.

⚠️ **Privacy note**: `kycDocuments`, `kycRejectionReason`, `bankAccount`, and
`attendance` are only ever returned on `GET`/`PUT /providers/me` (your own
authenticated view) — the public `GET /providers/{id}` and `GET
/providers/nearby` (used by the end-user app to browse providers) omit all
four. `experienceYears`, `languages`, and `unavailableDates` ARE public.

---

## Known Gaps affecting the provider app

- **Live GPS walk tracking** has no location-ping ingestion beyond the
  `walk:update` socket event above — no server-side route/distance
  validation, steps/calories are trusted as sent by the device.
- **Reschedule a booking** — only cancel exists.
- **Partial refunds** — a refund is always full amount; providers can't
  initiate a refund at all (`SUPER_ADMIN` only).
- **Provider wallet payouts are not automatic.** `providerPayoutAmount` is
  computed and stored on each completed booking, and a
  `BOOKING_PAYOUT` wallet-transaction reason exists, but nothing currently
  credits it — `GET /wallet/me` will not reflect completed bookings until
  this is wired up.
- **Provider Analytics "Activity Pulse"** (daily intensity sparkline) — no
  time-series endpoint for this; every other Analytics field is covered.
- **Boarding Center Staff Management, Groomer "My Packages"** — no backing
  endpoints; nothing concrete to build against yet.
- **Add-on catalogs are empty by default** — a provider must configure
  `Service.addOnCatalog` themselves (via `PUT /services/{id}`) before any
  add-on chips will validate on a customer's booking.
- Razorpay/Firebase credentials are blank in this repo's `docker-compose.yml`
  — push notifications and wallet top-up will fail until real keys are
  configured; not a code gap.

---

## 2026-09-26 update — provider-app (bare-path) endpoints for the new UI

Every endpoint below reads the provider type from the bearer token — one URL for all roles
(groomer, vet, clinic, boarding, trainer, walker, sitter). Full schemas + examples in Swagger
under the **ProviderApp** tag.

| Screen | Endpoint |
|---|---|
| Home / Dashboard | `GET /home` — VET now returns the same dashboard shape as GROOMER (designation "Veterinary Specialist"). New fields: `stats_overview.wallet_balance / appointments_today / new_today`, `todays_sessions[]` (all of today's visits with phone, mode HOME/CLINIC/VIDEO, map coords), `earnings_overview.this_month_completed`, `recent_services[]`, `recent_prescriptions[]` (vet: visits with an uploaded prescription). CLINIC "Revenue Today" is now today's revenue (was month). |
| Start Service / Start Visit / Boarding Details | `GET /appointments/{booking_id}` — client (name, initials, phone, address, coords), pet (breed, gender, age, weight, `is_vaccinated`), package `includes`, add-ons, price, notes, photos, `past_sessions` |
| Appointments list | `GET /appointments` (vet rows now also have `time`, `gender`, `mode`, `service_name`) |
| Upload prescription / receipt / captioned photos | `POST /bookings/{id}/photos {url, phase: BEFORE\|AFTER\|PRESCRIPTION\|RECEIPT, caption?}` |
| Service Completed | `GET /end-Session` — `summary` now also has booking_code, pet, service_name, completed_at, duration_minutes, amount, earnings, photos |
| Reviews & Ratings / Reply Review | `GET /reviews-ratings?rating=&page=` → summary (avg, total, 5→1 breakdown) + reviews (reviewer, pet, service, reply); `POST /reviews-ratings/{review_id}/reply {reply}` |
| Earnings / View wallet | `GET /earnings?range=week\|month\|year` → wallet_balance, today/week/month/lifetime, zero-filled chart, growth %, per-booking transactions |
| Withdraw | `POST /earnings/withdraw {amount}` (min ₹100, needs approved KYC + bank account); `GET /earnings/withdrawals` |
| Personal Info | `GET/PUT /profile/personal-info` (full_name, email, date_of_birth, gender, address, profile_image; phone read-only) |
| Experience & Skills | `GET/PUT /profile/experience-skills` (full replace of work_experience[] and skills[]) |
| Documents | `GET /profile/documents` (Aadhaar/PAN/DL/Police Verification with VERIFIED/PENDING/REJECTED/MISSING), `POST /profile/documents {name, url}` |
| Bank Details | `GET/PUT /profile/bank-account` (confirm_account_number must match; account_type SAVINGS/CURRENT; only last 4 digits ever returned) |
| Messages | `GET /message?filter=all\|unread\|emergency&search=` — rows now have `title` "Owner (Pet)", pet_name/pet_image, is_urgent, is_online, last_seen, user_id; image messages preview as "Photo". `GET /message/{room_id}/history?page=` now really paginates and returns `type: IMAGE` + `media_url` |

**Wallet money flow.** Online-paid (Razorpay/wallet) bookings credit `providerPayoutAmount`
to the provider wallet automatically when both COMPLETED and PAID (either order). Cash
bookings count in earnings but aren't credited. A refund of a credited booking reverses it.
Withdrawals debit the wallet immediately; admin marks them PAID (with UTR) or REJECTED
(money returns to wallet).

### Realtime chat (socket.io) — provider-app contract

Connect with `io(BASE_URL, { auth: { token } })` (logged-out tokens are now rejected).

- Emit `join_room {room_id}` when opening a chat → you get `user_status {user_id, is_online, last_seen}` for the other person immediately, and again whenever they go online/offline. Only the room's two participants can join.
- Emit `send_message {room_id, temp_id, message, media_url?}` → `message_ack {temp_id, id, status: SENT|FAILED}` (also returned via socket ack callback).
- Listen `new_message` — fires for every message from the other side, whether they sent via REST, owner-app `chat:message`, or `send_message`; delivered even if you haven't joined the room (inbox badges).
- `typing_start` / `typing_stop` → `user_typing {room_id, user_id, is_typing}`; `mark_read {room_id}` → other side gets `messages_read`.
