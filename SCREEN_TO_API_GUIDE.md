# Screen → API Guide

Screen-by-screen map of every UI screen in `/helper` to the exact backend
endpoint(s) it calls. Companion to [`INTEGRATION.md`](INTEGRATION.md) (which
is endpoint-first); this doc is screen-first, for building the app without
guessing.

**Base URL**: `/api/v1` (Swagger UI at `/api-docs`, spec at `/api-docs.json`
or [`docs/openapi.json`](docs/openapi.json) — every endpoint below has a full
request/response schema + example there; this doc gives you the field names
and the flow, the OpenAPI spec gives you the exact types/validation rules).

**Envelope** (every response): `{ success, message, data, meta? }` on
success; `{ success: false, error: "CODE", message }` on error. Check
`success`, not just HTTP status.

**Auth**: `Authorization: Bearer <accessToken>` from `/auth/login` or
`/auth/*/verify`. Three roles share one system: `USER`, `SERVICE_PROVIDER`,
`SUPER_ADMIN` — a service provider is a `USER`-table row with
`role: SERVICE_PROVIDER` plus a separate `Provider` business-profile document
(`POST /providers/me`).

---

# Part 1 — End-User App

## 1. Onboarding / Auth

| Screen | Endpoint(s) | Notes |
|---|---|---|
| `Splash screen` | — | Client-only; check stored token, route to Login or Home. |
| `LogIn` | `POST /auth/signup` `{name, email, phone, password, role: "USER", referralCode?}` (new account) or `POST /auth/login` `{email, password}` (returning) | Response includes `isRegistered: boolean` — use it to route to signup-completion vs. straight to Home (see memory: this field was added specifically for that routing decision). `referralCode` is optional — if it matches an existing user's code, `referredBy` is set silently (bad code is ignored, doesn't fail signup). |
| `LogIn OTP` | `POST /auth/signup/verify` `{identifier, code}` (new account) or `POST /auth/login/otp/request` → `POST /auth/login/otp/verify` `{identifier, code}` (OTP login) | `POST /auth/otp/resend` `{identifier, purpose}` for the resend-timer button. Both request-OTP endpoints also return `isRegistered`. |
| `Your Profile` (onboarding step 1) | `PUT /users/me` `{name, avatarUrl}` then `POST /users/me/addresses` `{label, addressLine1, addressLine2?, city, state, postalCode, country?, coordinates:[lng,lat], isDefault}` | |
| `Pet Profile` (onboarding step 2) | `POST /pets` `{name, species, breed?, gender?, dateOfBirth?, weightKg?, avatarUrl?, notes?}` per pet ("Add More Pet" repeats this call) | |
| `Preferences` (onboarding step 3) | `PUT /users/me` `{preferences: {language?, smsNotifications?, emailNotifications?, pushNotifications?}}` | Service-interest chips (Grooming/Vet/etc.) are **not persisted anywhere** — no field exists for this. See Known Gaps. Emergency contact has no field either — see Known Gaps. |

## 2. Home / Discovery

`Home` and `Pet Care Service` are **composed client-side from several
endpoints** — there is no single "home feed" endpoint:

- Greeting/profile: `GET /users/me`
- Featured/trending service tiles: `GET /categories` (icons/names) then
  `GET /services?categoryId=<id>` per category, or `GET
  /providers/nearby?lat=&lng=&providerType=` for provider-style tiles
  (Vet/Groomer/etc.)
- "Your Bookings" card: `GET /bookings/me?status=PENDING` (or `ACCEPTED`),
  take the soonest one
- "Boardings near you": `GET /providers/nearby?providerType=BOARDING`
- "Popular Vet Doctor": `GET /providers/nearby?providerType=VET` sorted by
  `rating` client-side (no server-side sort-by-rating param exists yet)
- "Pet Care Tips" article cards: `GET /blogs?tag=pet-care`
- Search bar: `GET /search?q=` (see `search` module for cross-entity search)
- Promo banners: `GET /banners`

## 3. Generic Booking Wizard (Grooming, Vaccination, Vet Consultation)

These three screens sets (`Pacakage*`, `Pet*` choose-pet, `Schedule*`,
`Confirm*`) are the same 4-step flow re-skinned. There is no separate
"packages" entity — a **Service document IS the package** (its `price`,
`durationMinutes`, and now `addOnCatalog` cover what the screens call a
"package"), scoped to a category and a provider.

1. **Package select** (`Pacakage*`, `Pacakage details`) — `GET
   /categories` to find the right category id, then `GET
   /services?categoryId=<id>&providerId=<optional>` for the list; `GET
   /services/{id}` for the detail modal.
2. **Choose pet** (`Pet*`) — `GET /pets` (the caller's own).
3. **Schedule** (`Schedule*`) — `GET
   /availability?providerId=&serviceId=&date=YYYY-MM-DD` → returns `{date,
   slots: [{start, end, isAvailable}]}`. Consultation's Clinic/Online toggle
   has no backend field — it's cosmetic only right now (no
   `consultationType` on Booking). See Known Gaps.
4. **Confirm** (`Confirm*`) — `POST /bookings` `{providerId, serviceId,
   petId, scheduledStart, couponCode?, notes?, addOns?: [{name, price}]}`.
   `addOns` must exactly match an entry in that service's `addOnCatalog`
   (server rejects unknown name/price combos — prevents price tampering).
   Coupon: validate first with `POST /coupons/validate
   {code, bookingAmount, providerType?}` to show the discount before
   committing, then pass `couponCode` into the booking call itself (it
   re-validates and applies server-side). "Pay at Home"/"Pay at Clinic" =
   don't call `/payments/...` yet, booking is created with
   `paymentStatus: PENDING`; "Pay Now" = immediately follow with `POST
   /payments/bookings/{bookingId}/order {method: "RAZORPAY"}`.

## 4. Dog Walking

| Screen | Endpoint(s) |
|---|---|
| `Dog Walking` (landing) | `GET /providers/nearby?lat=&lng=&providerType=PET_WALKER` |
| `Dog walk booking` | `GET /pets`, `GET /availability?...`, then `POST /bookings {..., durationDays: null, addOns: [{name:"Poo Pickup", price:49}, ...]}` — add-ons must be in the walker's service's `addOnCatalog`. |
| `Walker Profile` | `GET /providers/{id}` (public summary — no KYC docs/bank info, that's owner-only), `GET /reviews?providerId={id}` |
| `Live Walk Tracker` | **Not implemented — see Known Gaps.** No GPS-ping ingestion or live-location read endpoint exists yet. |

## 5. Boarding

| Screen | Endpoint(s) |
|---|---|
| `Boarding` / `No Boarding` | `GET /providers/nearby?providerType=BOARDING` — an empty `data: []` array is the "No Boarding" state (not an error), so render that screen on a zero-length success response, not on a 4xx. |
| `Boarding Details` | `GET /providers/{id}`, `GET /reviews?providerId={id}` |
| `Boarding Details-1` (booking form) | `POST /bookings {providerId, serviceId, petId, scheduledStart: <drop-off date+time>, durationDays: <N>, dropOffTime: "HH:mm", pickupTime: "HH:mm", addOns: [{name:"Extra Playtime", price:150}, ...]}` — `scheduledEnd` is computed server-side as `scheduledStart + durationDays`. |

## 6. Pet Companion

Brand-new module this pass — a pet must opt in first.

| Screen | Endpoint(s) |
|---|---|
| (profile setup, no dedicated screen captured) | `PUT /pets/{id}/companion-profile {isEnabled: true, bio, personalityTraits[], interests[], lookingFor[], activityLevel, temperament, getsAlongWith: {dogs, cats, kids, families}}` |
| `Pet Companion` (swipe feed) | `GET /pet-companion/discover?petId=&lat=&lng=&radiusMeters=` |
| swipe action | `POST /pet-companion/swipe {swiperPetId, targetPetId, action: "LIKE"|"PASS"|"SUPERLIKE"}` → response includes `{matched: true, matchId, chatRoomId}` on mutual like |
| `Pet Companion-1` (likes received) | `GET /pet-companion/likes-received?petId=` |
| `Pet Companion-2` (match screen) | Triggered by the `matched: true` response above — no separate fetch needed |
| `Pet Companion-3` (pet detail) | `GET /pets/{id}` (now includes `companionProfile`) |
| `Pet Companion-4` (chat) | `GET /pet-companion/matches?petId=` for `chatRoomId`, then the existing chat module: `GET /chat/rooms/{roomId}/messages`, `POST /chat/rooms/{roomId}/messages {text}` |

## 7. Pet Relocation

Brand-new module — explicitly a **lead**, not an instant booking (no
payment step, matches the screens' "our team will contact you" copy).

- `POST /pet-relocation/requests {ownerName, ownerPhone, ownerEmail, petId,
  originAddress, destinationAddress, relocationDate, transportType:
  "ROAD"|"AIR"|"RAIL", preferredTimeSlot: "MORNING"|"AFTERNOON"|"EVENING"}`
- `GET /pet-relocation/requests/me` for status tracking (`SUBMITTED` →
  `CONTACTED` → `CONFIRMED`/`CANCELLED`, set by ops via the admin route)

## 8. Pet Taxi

Brand-new module — single-screen flow, fixed pricing (₹499 one-way / ₹899
round-trip, resolved server-side, never client-supplied).

- `POST /pet-taxi/bookings {tripType: "ONE_WAY"|"ROUND_TRIP", petIds:
  [...], pickupAddress, dropAddress, pickupDate, pickupTime}`
- `GET /pet-taxi/bookings/me`, `PATCH /pet-taxi/bookings/{id}/cancel
  {reason}`

## 9. Vet / Clinic Consultation

`Vets` (landing/search) → `GET /providers/nearby?providerType=VET`
(Clinic/Online tab is a client-side filter — see the wizard's Schedule step
note above about `consultationType` not being a real field yet). Booking
flow = the generic wizard in section 3.

## 10. Dog Training

`Dog Training at Home` → `GET /providers/nearby?providerType=TRAINER`.
`Trainer Profile` → `GET /providers/{id}` + `GET /reviews?providerId=`.
Booking → generic wizard (section 3) or the same add-ons pattern as Dog
Walking if the trainer's service has an `addOnCatalog`.

## 11. Lost & Found

Pre-existing module, screens map 1:1:

- `Lost & Found` → `GET /lost-and-found?type=LOST|FOUND&lat=&lng=&radiusMeters=`
- report flow → `POST /lost-and-found {type, petName?, species, breed?,
  description, photoUrls[], coordinates:[lng,lat], contactPhone}` (upload
  photos first via `POST /uploads` category `LOST_AND_FOUND`, pass the
  returned `url`s here) — starts `PENDING`, needs admin approval before it's
  publicly visible
- `Lost & Found (Details)` → `GET /lost-and-found/{id}`, resolve via `PATCH
  /lost-and-found/{id}/resolve`

## 12. Shopping & Pharmacy / Cart / Orders

| Screen | Endpoint(s) |
|---|---|
| `Shopping & Pharmacy` | `GET /products?category=&q=&minPrice=&maxPrice=` |
| product "Add to Cart" | `POST /cart/items {productId, quantity}` |
| Cart (in "My Bookings › Shopping › Carts" tab) | `GET /cart`, `PUT /cart/items/{productId} {quantity}`, `DELETE /cart/items/{productId}`, `POST /coupons/validate` for the coupon box, `POST /orders {shippingAddress, paymentMethod: "WALLET"|"CASH_ON_DELIVERY"}` on checkout |
| Recent Orders | `GET /orders?page=&limit=` |
| product rating (product cards showing "★") | `GET /reviews?productId=`, and after a purchase: `POST /reviews {productId, rating, comment}` — new this pass, previously reviews only existed for bookings |
| Wishlist | `GET /wishlist`, `POST /wishlist/{productId}`, `DELETE /wishlist/{productId}` |
| "Scan Prescription" | **Not implemented — see Known Gaps.** No OCR/prescription-parsing endpoint exists; `POST /uploads` alone just stores the image. |

## 13. Wallet / Referrals

- `Referrals` → `GET /referrals/me` (returns `referralCode`, `shareLink`,
  `totalReferrals`, `successfulReferrals`, `pendingReferrals`,
  `rewardPointsEarned`), `GET /referrals/me/history`, `POST
  /referrals/redeem` (converts earned points to wallet balance). Brand-new
  module this pass — the referral-code field already visible on the Login
  screen now actually does something.
- Wallet balance (no dedicated screen captured, but referenced from
  Dashboard-style balance tiles): `GET /wallet/me`, `GET
  /wallet/me/transactions`, and **new this pass** `POST /wallet/me/topup
  {amount}` → returns a Razorpay order to complete client-side; wallet is
  credited once the payment webhook confirms capture.
  ⚠️ See Known Gaps: booking-completion payouts do **not** currently credit
  a provider's wallet automatically.

## 14. Pet Insurance

Brand-new module — `pet-insurance-form.png` maps directly:

- `POST /pet-insurance/applications {ownerName, ownerEmail, ownerPhone,
  petName, petType, petAge, petBreed, previousIllness, illnessDocumentUrls[],
  previousSurgery, vaccinated, vaccinationDocumentUrls[]}` (upload docs via
  `POST /uploads` category `KYC_DOCUMENT` first, pass the URLs here;
  `illnessDocumentUrls`/`vaccinationDocumentUrls` are ignored server-side
  unless the matching boolean is `true`)
- `GET /pet-insurance/applications/me` for status tracking

## 15. My Bookings / Schedule

The "My Bookings" screen's two-axis tabs map to different endpoints
entirely — it's a client-side composition, not one API call:

- Shopping tab → section 12 above (`/cart`, `/orders`, `/wishlist`)
- Services tab (Upcoming/Past) → `GET /bookings/me?status=` — response
  includes `otpStart`/`otpEnd` fields (shown only while relevant to the
  current status) for the "START OTP"/"END OTP" codes shown on ongoing
  bookings, `addOns`, `photos` (provider-uploaded before/after shots),
  `dropOffTime`/`pickupTime` for boarding
- Cancel → `PATCH /bookings/{id}/cancel {reason}`
- Review → `POST /reviews {bookingId, rating, comment}`
- Reschedule → **not implemented, see Known Gaps** (cancel + rebook is the
  current workaround)

## 16. My Account / Profile

- `My Account` hub → `GET /users/me`
- Personal info edit → `PUT /users/me`
- Addresses → `POST /users/me/addresses`, **new this pass** `PUT
  /users/me/addresses/{addressId}` (edit in place — previously delete +
  recreate only), `DELETE /users/me/addresses/{addressId}`
- My Pets → `GET /pets`, `PUT /pets/{id}`, `DELETE /pets/{id}`,
  medical records/vaccinations: `POST /pets/{id}/medical-records`, **new
  this pass** `DELETE /pets/{id}/medical-records/{recordId}` (same pattern
  for `/vaccinations`)
- Notification settings → `PUT /users/me {preferences}`
- Device push token registration → `POST /users/me/device-tokens
  {deviceToken}`, `DELETE /users/me/device-tokens {deviceToken}`
- Emergency Contact → **not implemented, see Known Gaps**

---

# Part 2 — Service-Provider App

A provider is a `USER` account (`role: SERVICE_PROVIDER`) that has also
created a `Provider` business profile.

## 1. Onboarding / Auth

| Screen | Endpoint(s) |
|---|---|
| `Select your role` | Client-side only — the 7 role cards map to `providerType` enum values (`GROOMER`, `VET`/`CLINIC` → `VET`, `BOARDING` → `BOARDING`, `TRAINER`, `PET_WALKER`, `OTHER` for sitter) used in the next step. |
| `LogIn`, `LogIn OTP`, `LogIn-1` | Same `/auth/*` endpoints as the end-user app, with `role: "SERVICE_PROVIDER"` on signup. |
| (post-login, first time) | `POST /providers/me {providerType, businessName, description?, coordinates:[lng,lat], address, zoneIds?, workingHours?, metadata?}` — creates the business profile, `kycStatus` starts `PENDING`. |
| KYC upload | `POST /providers/me/kyc-documents {type, url}` (upload file via `/uploads` category `KYC_DOCUMENT` first). **Fixed this pass**: `GET /providers/me` now actually returns the uploaded `kycDocuments` list — previously a provider could upload but never see what they'd uploaded. |
| `Start Otp` / `End otp` (mid-booking, not login) | `POST /bookings/{id}/otp/start {code}`, `POST /bookings/{id}/otp/end {code}` |

## 2. Dashboard / Home

Composed client-side, same as the end-user Home:

- `GET /providers/me` (identity card, `isActive` toggle state, KYC status)
- `PATCH /providers/me/active {isActive}` (Available/Offline toggle)
- **New this pass** `GET /providers/me/analytics?range=week|month` — returns
  `earningsByDay`, `bookingCount`, `ratingBreakdown`, `repeatClientPercent`.
  This is the single biggest fix here: previously `/analytics/*` was
  `SUPER_ADMIN`-only, so a provider's own Dashboard had nothing to call for
  earnings/rating data.
- `GET /bookings/provider/me?status=PENDING` (today's/upcoming visits list)
- `GET /reviews?providerId=<own id>` (Recent Reviews)
- Wallet balance tile → `GET /wallet/me` — ⚠️ see Known Gaps, this won't
  reflect booking payouts automatically yet.

## 3. Analytics / Earnings

`GET /providers/me/analytics?range=week` (or `month`) — the one call this
whole screen needs (Weekly Earnings chart, Sessions/Hours/Repeat-Client
stats, Ratings Breakdown bars all come from this single response).

## 4. Appointments / Bookings Management

- List/filter → `GET /bookings/provider/me?status=PENDING|ACCEPTED|...`
- Accept → `PATCH /bookings/{id}/accept`
- Mark en route → `PATCH /bookings/{id}/on-the-way`
- Cancel → `PATCH /bookings/{id}/cancel {reason}`

## 5. Live Service Execution (Start → In Progress → Complete)

This is the clearest end-to-end lifecycle, and the one most extended this
pass:

1. **Start Service** (booking detail before arrival) → `GET
   /bookings/{id}` for customer/pet/package info.
2. **Verify Start OTP** → `POST /bookings/{id}/otp/start {code}` — status
   becomes `STARTED`.
3. **Grooming In Progress** → **new this pass**: `PATCH
   /bookings/{id}/notes {notes}` for the free-text special-instructions
   box, `POST /bookings/{id}/photos {url, phase: "BEFORE"}` per uploaded
   photo (upload via `/uploads` first, category `PROVIDER_PORTFOLIO`, then
   attach the URL here).
4. **Complete Service** → `POST /bookings/{id}/otp/end {code}` — status
   becomes `COMPLETED`; upload after-photos the same way with `phase:
   "AFTER"`.
5. **Service Completed screen** → `GET /bookings/{id}` for the summary
   (earnings = `price - discountAmount`, `photos`, `providerNotes`).

`Live Walk Tracker` (if built for the provider's own walk-in-progress view,
not just the customer's) — **not implemented, see Known Gaps**.

## 6. Messages

Same `chat` module as Pet Companion chat: `GET /chat/rooms`, `GET
/chat/rooms/{roomId}/messages`, `POST /chat/rooms/{roomId}/messages`,
`PATCH /chat/rooms/{roomId}/read`. The "Emergency" filter pill has no
backend priority field — client-side filtering only (see Known Gaps if this
needs to be a real flag later).

## 7. Profile / Account Management

- `GET /providers/me` / `PUT /providers/me` (business info, working hours,
  metadata)
- `PUT /providers/me/bank-account {accountHolderName, accountNumber,
  ifscCode, bankName}` — **fixed this pass**: the response (via `GET
  /providers/me`) now returns a masked `{accountHolderName, bankName,
  last4}` so the provider can confirm what's on file, instead of nothing.
- **New this pass** `GET /providers/me/attendance` — full check-in/check-out
  history (the check-in/out endpoints already existed, there was just no
  way to read the history back).
- Attendance/Holidays screens beyond simple check-in/out, Staff Management
  (Boarding Center Profile-1 screen), Packages management (Groomer
  Profile-2 screen) → **not implemented, see Known Gaps**.

⚠️ **Privacy note**: `kycDocuments`, `kycRejectionReason`, `bankAccount`, and
`attendance` are only ever returned on `GET/PUT /providers/me` (the
provider's own authenticated view) or admin routes — the public `GET
/providers/{id}` and `GET /providers/nearby` (used by the end-user app to
browse providers) deliberately omit all four. Don't expect them there.

---

# Known Gaps / Backlog

Not built this pass — either no screen shows enough detail to build
against, or it needs a product/business decision first:

- **Live GPS walk tracking** (`Live Walk Tracker`) — no location-ping
  ingestion or live-read endpoint. Needs a decision on transport (WebSocket
  vs. polling) and whether steps/calories are device-computed or
  server-computed.
- **Reschedule a booking** — only cancel exists. Needs a decision on
  reschedule limits/fees.
- **Partial refunds** — `refundBooking` always refunds in full. Needs a
  business rule for partial-refund eligibility.
- **Prescription OCR scan** (`Shopping & Pharmacy`'s "Scan Prescription") —
  `/uploads` stores the image only, nothing parses it.
- **Service-interest preferences & emergency contact** (onboarding
  `Preferences` screen) — no fields exist on the User model for either.
- **Consultation delivery mode** (Clinic vs. Online, `Schedule-2`/`Confirm
  *consultation` screens) — cosmetic only, no `consultationType` field on
  Booking.
- **Group chat / message edit-delete** — chat is 1:1 only, no edit/delete.
- **Admin draft-blog / inactive-category listings** — an admin can create a
  draft or deactivate a category but has no endpoint to list/recover it
  without already knowing its id.
- **Boarding Center Staff Management, Groomer Packages/Holidays** — menu
  items exist in the Profile screens, no screen shows their actual contents,
  nothing to build against yet.
- **Provider wallet payouts are not automatic.** `providerPayoutAmount` is
  computed and stored on each completed Booking, and `WALLET_TRANSACTION_
  REASONS.BOOKING_PAYOUT` exists as an enum value, but nothing currently
  calls `walletService.credit(...)` with it — a provider's wallet balance
  will not reflect completed bookings until this is wired up (likely a
  scheduled payout job or a hook on booking completion, whichever the
  business prefers).
- **Razorpay/Firebase credentials are blank** in `docker-compose.yml` (both
  `app` and `worker` services) — `POST /payments/bookings/{id}/order`,
  `POST /wallet/me/topup`, and push notifications will fail against
  production until real keys are added. Not a code gap — a deployment
  config one.
- `updatedAt` is missing from several DTOs (orders, products, payments,
  blogs, categories, zones/cities) even though the underlying schema tracks
  it — only matters if the app does cache invalidation off it; a one-line
  mapper fix per module if/when needed.
