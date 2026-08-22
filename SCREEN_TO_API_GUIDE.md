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

**Auth model — read this first.** The real LogIn screens (both apps) only
ever collect a **phone number** — never an email, never a password. So the
primary, and only, flow those screens need is:

1. `POST /auth/login/otp/request {identifier: <phone>, referralCode?, role?}`
   — this is ALSO the sign-up entry point. If the phone number has no
   account yet, one is auto-created here (bare minimum: just the phone) and
   sent an OTP exactly like a returning number would be. `role` (`USER` or
   `SERVICE_PROVIDER`) only takes effect on that auto-created account —
   pass it based on the provider app's "Select your role" step. Response:
   `{isRegistered: boolean}` — `false` means brand new, route to onboarding
   after verify; `true` means returning, route straight to Home.
2. `POST /auth/login/otp/verify {identifier, code}` → `{user, tokens}`.
3. If `isRegistered` was `false`: run onboarding (`PUT /users/me` for name/
   email, `POST /pets` etc. — see section 1 below) to fill in the rest.

`POST /auth/signup` (email+password) and `POST /auth/login` (identifier +
password) still exist as a **secondary** path — this is what the provider
app's `LogIn-1` screen's "Login with Password" button uses, for an account
that has explicitly set a password via `/auth/reset-password` or
`/auth/update-password`. `POST /auth/login`'s `identifier` field accepts
either an email or a phone number.

**Auth header**: `Authorization: Bearer <accessToken>`. Three roles share
one system: `USER`, `SERVICE_PROVIDER`, `SUPER_ADMIN` — a service provider
is a `USER`-table row with `role: SERVICE_PROVIDER` plus a separate
`Provider` business-profile document (`POST /providers/me`, a distinct,
later step from login/signup — a brand-new phone-only account has no
business name yet).

---

# Part 1 — End-User App

## 1. Onboarding / Auth

| Screen | Endpoint(s) | Notes |
|---|---|---|
| `Splash screen` | — | Client-only; check stored token, route to Login or Home. |
| `LogIn` | `POST /auth/login/otp/request {identifier: <phone>, referralCode?}` | See the auth model above — this single call handles both new and returning phone numbers. `referralCode` is optional — if it matches an existing user's code, `referredBy` is set silently (bad code is ignored, doesn't fail the call). |
| `LogIn OTP` | `POST /auth/login/otp/verify {identifier, code}` → `{user, tokens}` | `POST /auth/otp/resend {identifier, purpose: "LOGIN"}` for the resend-timer button. |
| `Your Profile` (onboarding step 1) | `PUT /users/me {name, email?, avatarUrl?}` then `POST /users/me/addresses {label, addressLine1, addressLine2?, city, state, postalCode, country?, coordinates:[lng,lat], isDefault}` | `email` on `PUT /users/me` is new this pass — previously there was no way to ever set it on a phone-only account; the screen's Email field now actually persists. Returns `409` if the email is already taken by another account. |
| `Pet Profile` (onboarding step 2) | `POST /pets {name, species, breed?, gender?, dateOfBirth?, weightKg?, avatarUrl?, notes?}` per pet ("Add More Pet" repeats this call) | |
| `Preferences` (onboarding step 3) | `PUT /users/me {serviceInterests: string[], emergencyContact: {name, phone}, preferences: {smsNotifications?, emailNotifications?, pushNotifications?}}` | `serviceInterests` and `emergencyContact` are new top-level fields this pass — previously nothing on this screen was persisted. |

## 2. Home / Discovery

`Home` and `Pet Care Service` are **composed client-side from several
endpoints** — there is no single "home feed" endpoint:

- Greeting/profile: `GET /users/me`
- Featured/trending service tiles: `GET /categories` (icons/names) then
  `GET /services?categoryId=<id>` per category, or `GET
  /providers/nearby?lat=&lng=&providerType=` for provider-style tiles
  (Vet/Groomer/etc.)
- "Your Bookings" card: `GET /bookings/me?status=PENDING,ACCEPTED,ON_THE_WAY,STARTED`
  (comma-separated status list = "Upcoming" bucket in one call), take the
  soonest one
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
`originalPrice`, `durationMinutes`, and `addOnCatalog` cover what the
screens call a "package"), scoped to a category and a provider.

1. **Package select** (`Pacakage*`, `Pacakage details`) — `GET
   /categories` to find the right category id, then `GET
   /services?categoryId=<id>&providerId=<optional>` for the list; `GET
   /services/{id}` for the detail modal. `originalPrice` (struck-through
   list price, new this pass) is present on the service DTO whenever a
   discount applies — `null` otherwise.
2. **Choose pet** (`Pet*`) — `GET /pets` (the caller's own).
3. **Schedule** (`Schedule*`) — `GET
   /availability?providerId=&serviceId=&date=YYYY-MM-DD` → returns `{date,
   slots: [{start, end, isAvailable}]}` (a date the provider has marked
   unavailable via `POST /providers/me/unavailable-dates` returns an empty
   `slots` array). Consultation's Clinic/Online toggle → `consultationMode`
   on the booking, see step 4.
4. **Confirm** (`Confirm*`) — `POST /bookings {providerId, serviceId,
   petId, scheduledStart, couponCode?, notes?, addOns?: [{name, price}],
   consultationMode?: "CLINIC"|"ONLINE"}`. `addOns` must exactly match an
   entry in that service's `addOnCatalog` (server rejects unknown
   name/price combos — prevents price tampering). `consultationMode` is new
   this pass — previously the Clinic/Online choice was never persisted, so
   a provider couldn't tell from the booking whether to show up in person
   or start a video call.
   Coupon: validate first with `POST /coupons/validate
   {code, bookingAmount, providerType?}` to show the discount before
   committing, then pass `couponCode` into the booking call itself (it
   re-validates and applies server-side). "Pay at Home"/"Pay at Clinic" =
   don't call `/payments/...` yet, booking is created with
   `paymentStatus: PENDING`; "Pay Now" = immediately follow with `POST
   /payments/bookings/{bookingId}/order {method: "RAZORPAY"}`.
   ⚠️ "Add other pets" (multi-pet in one order) has no backing — `petId` is
   a single optional field. Submit one `POST /bookings` per selected pet
   (separate bookings, separate OTPs/prices) until a true multi-pet order
   is built — see Known Gaps.

## 4. Dog Walking

| Screen | Endpoint(s) |
|---|---|
| `Dog Walking` (landing) | `GET /providers/nearby?lat=&lng=&providerType=PET_WALKER` |
| `Dog walk booking` | `GET /pets`, `GET /availability?...`, then `POST /bookings {..., addOns: [{name:"Poo Pickup", price:49}, ...]}` — add-ons must be in the walker's service's `addOnCatalog`. ⚠️ The 30/45/60-minute duration tiers shown as one screen's radio choice are actually 3 separate `Service` documents (a `Service.durationMinutes` is fixed per service, not choosable per booking) — the walker must have created three services (or however many tiers they offer); tapping a duration card should set `serviceId`, not a booking-time field. Nothing enforces a walker actually has all 3, so an empty list for a tier is a real possible state to handle. |
| `Walker Profile` | `GET /providers/{id}` (public summary — no KYC docs/bank info, that's owner-only; now also returns `experienceYears`, `languages`, `unavailableDates`) — `GET /reviews?providerId={id}` |
| `Live Walk Tracker` | **Not implemented — see Known Gaps.** No GPS-ping ingestion or live-location read endpoint exists yet. |

⚠️ **Add-on catalog is per-provider, not global.** The ₹79/₹49/₹29 chips on
this screen are only bookable once the specific walker's `Service.addOnCatalog`
contains an entry with that exact `name`+`price`. There's no seed data for
this — it's real configuration each provider must set via `POST/PUT
/services` before their add-on chips will actually work.

## 5. Boarding

| Screen | Endpoint(s) |
|---|---|
| `Boarding` / `No Boarding` | `GET /providers/nearby?providerType=BOARDING` — an empty `data: []` array is the "No Boarding" state (not an error), so render that screen on a zero-length success response, not on a 4xx. |
| `Boarding Details` | `GET /providers/{id}`, `GET /reviews?providerId={id}` |
| `Boarding Details-1` (booking form) | `POST /bookings {providerId, serviceId, petId, scheduledStart: <drop-off date+time>, durationDays: <N, 1-15>, dropOffTime: "HH:mm", pickupTime: "HH:mm", addOns: [{name:"Extra Playtime", price:150}, ...]}` — `scheduledEnd` is computed server-side as `scheduledStart + durationDays`. `durationDays` is capped at 15 server-side, matching the screen's stated max (was uncapped, fixed this pass). |

## 6. Pet Companion

| Screen | Endpoint(s) |
|---|---|
| profile setup | `PUT /pets/{id}/companion-profile {isEnabled: true, bio, personalityTraits[], interests[], lookingFor[], activityLevel, temperament, neutered: boolean, getsAlongWith: {dogs, cats, kids, families}}` — each `getsAlongWith` field is `"YES"\|"NO"\|"NEEDS_INTRODUCTION"` (tri-state, not boolean — matches the amber "Needs Introduction" badge on screen). `neutered` is new this pass. |
| `Pet Companion` (swipe feed) | `GET /pet-companion/discover?petId=&lat=&lng=&radiusMeters=` — each candidate now includes `ownerName` and `dateOfBirth` (compute age client-side), matching the "Bruno, 2 years · Owner: Ananya S." card text. |
| swipe action | `POST /pet-companion/swipe {swiperPetId, targetPetId, action: "LIKE"|"PASS"|"SUPERLIKE"}` → response includes `{matched: true, matchId, chatRoomId}` on mutual like |
| `Pet Companion-1` (likes received) | `GET /pet-companion/likes-received?petId=` |
| `Pet Companion-2` (match screen) | Triggered by the `matched: true` response above — no separate fetch needed |
| `Pet Companion-3` (pet detail) | `GET /pets/{id}` (includes `companionProfile` with `neutered` and tri-state `getsAlongWith`) |
| `Pet Companion-4` (chat) | `GET /pet-companion/matches?petId=` for `chatRoomId`, then the chat module: `GET /chat/rooms/{roomId}/messages`, `POST /chat/rooms/{roomId}/messages {text}` |

⚠️ The "Safety & Verification" checklist (Identity/Vaccination/Mobile/Location
verified) has no backing beyond `User.isVerified` (one generic flag, not four
per-category ones) — see Known Gaps.

## 7. Pet Relocation

Explicitly a **lead**, not an instant booking (no payment step, matches the
screens' "our team will contact you" copy).

- `POST /pet-relocation/requests {ownerName, ownerPhone, ownerEmail, petId,
  originAddress, destinationAddress, relocationDate, transportType:
  "ROAD"|"AIR"|"RAIL", preferredTimeSlot: "MORNING"|"AFTERNOON"|"EVENING"}`
- `GET /pet-relocation/requests/me` for status tracking (`SUBMITTED` →
  `CONTACTED` → `CONFIRMED`/`CANCELLED`, set by ops via the admin route)

## 8. Pet Taxi

Single-screen flow, fixed pricing (₹499 one-way / ₹899 round-trip, resolved
server-side, never client-supplied).

- `POST /pet-taxi/bookings {tripType: "ONE_WAY"|"ROUND_TRIP", petIds:
  [...], pickupAddress, dropAddress, pickupDate, pickupTime}`
- `GET /pet-taxi/bookings/me`, `PATCH /pet-taxi/bookings/{id}/cancel
  {reason}`

## 9. Vet / Clinic Consultation

`Vets` (landing/search) → `GET /providers/nearby?providerType=VET`
(Clinic/Online tab is a client-side filter for browsing; the actual choice
made during booking is `consultationMode`, see section 3 step 4). Booking
flow = the generic wizard in section 3.

## 10. Dog Training

`Dog Training at Home` → `GET /providers/nearby?providerType=TRAINER`.
`Trainer Profile` → `GET /providers/{id}` + `GET /reviews?providerId=`.
Booking → generic wizard (section 3) or the same add-ons pattern as Dog
Walking if the trainer's service has an `addOnCatalog`.

## 11. Lost & Found

- `Lost & Found` → `GET /lost-and-found?type=LOST|FOUND&lat=&lng=&radiusMeters=`
- report flow → `POST /lost-and-found {type, petName?, species, breed?,
  age?, gender?, rewardAmount?, description, photoUrls[],
  coordinates:[lng,lat], contactPhone}` (upload photos first via `POST
  /uploads` category `LOST_AND_FOUND`, pass the returned `url`s here) —
  starts `PENDING`, needs admin approval before it's publicly visible.
  `age` (free text, e.g. "3 years"), `gender` (`MALE`/`FEMALE`/`UNKNOWN`),
  and `rewardAmount` are new this pass — the screen's "3 years • Male" and
  "Reward ₹5,000" had no backing field before.
- `Lost & Found (Details)` → `GET /lost-and-found/{id}`, resolve via `PATCH
  /lost-and-found/{id}/resolve`

## 12. Shopping & Pharmacy / Cart / Orders

| Screen | Endpoint(s) |
|---|---|
| `Shopping & Pharmacy` | `GET /products?category=&q=&minPrice=&maxPrice=` — each product now returns `mrp` (struck-through list price) and a computed `discountPercent`, matching the "₹1,299 ~~₹1,599~~ 19% OFF" cards. |
| product "Add to Cart" | `POST /cart/items {productId, quantity}` |
| Cart (in "My Bookings › Shopping › Carts" tab) | `GET /cart` → `{items, subtotal, discountAmount, couponCode, deliveryFee, totalAmount}` (full price breakdown, new this pass — previously only a flat `totalAmount` with no discount/delivery line existed). `PUT /cart/items/{productId} {quantity}`, `DELETE /cart/items/{productId}`. Coupon box: `POST /cart/apply-coupon {code}` (validates + stores the discount on the cart), `DELETE /cart/coupon` to remove it — changing cart contents auto-clears an applied coupon, re-apply after. Checkout: `POST /orders {shippingAddress, paymentMethod: "WALLET"|"CASH_ON_DELIVERY"}` — carries the cart's coupon/discount over onto the order and adds the flat delivery fee. |
| Recent Orders | `GET /orders?page=&limit=` — each order includes `discountAmount`, `deliveryFee`, `couponCode` alongside `totalAmount`. |
| product rating (product cards showing "★") | `GET /reviews?productId=`, and after a purchase: `POST /reviews {productId, rating, comment}` |
| Wishlist | `GET /wishlist`, `POST /wishlist/{productId}`, `DELETE /wishlist/{productId}` |
| "Scan Prescription" | **Not implemented — see Known Gaps.** No OCR/prescription-parsing endpoint exists; `POST /uploads` alone just stores the image. |

⚠️ A cart-applied coupon's per-user usage limit is checked at apply-time
only — it is **not** logged against the coupons module's redemption ledger
the way booking coupons are (that ledger requires a `bookingId`, which an
order doesn't have). See Known Gaps if cross-order coupon-limit enforcement
becomes a requirement.

## 13. Wallet / Referrals

- `Referrals` → `GET /referrals/me` (returns `referralCode`, `shareLink`,
  `totalReferrals`, `successfulReferrals`, `pendingReferrals`,
  `rewardPointsEarned`), `GET /referrals/me/history` (each row now includes
  `refereeAvatarUrl` for the circular profile photo, new this pass), `POST
  /referrals/redeem` (converts earned points to wallet balance).
- Wallet balance (no dedicated screen captured, but referenced from
  Dashboard-style balance tiles): `GET /wallet/me`, `GET
  /wallet/me/transactions`, `POST /wallet/me/topup {amount}` → returns a
  Razorpay order to complete client-side; wallet is credited once the
  payment webhook confirms capture.
  ⚠️ See Known Gaps: booking-completion payouts do **not** currently credit
  a provider's wallet automatically.

## 14. Pet Insurance

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
- Services tab (Upcoming/Past) — "Upcoming" = `GET
  /bookings/me?status=PENDING,ACCEPTED,ON_THE_WAY,STARTED` (comma-separated
  status list, new this pass), "Past" = `?status=COMPLETED,CANCELLED,REFUNDED`.
  Response includes `otpStart`/`otpEnd` (shown only while relevant to the
  current status) for the "START OTP"/"END OTP" codes, `addOns`, `photos`
  (provider-uploaded before/after shots), `dropOffTime`/`pickupTime` for
  boarding, `consultationMode` for consultations.
- Date-range filters (if the UI adds "This Week"/"Today" chips) → same
  endpoint with `from=YYYY-MM-DD&to=YYYY-MM-DD`, new this pass.
- Cancel → `PATCH /bookings/{id}/cancel {reason}`
- Review → `POST /reviews {bookingId, rating, comment}`
- Reschedule → **not implemented, see Known Gaps** (cancel + rebook is the
  current workaround)

## 16. My Account / Profile

- `My Account` hub → `GET /users/me`
- Personal info edit → `PUT /users/me {name?, email?, avatarUrl?}`
- Addresses → `POST /users/me/addresses`, `PUT
  /users/me/addresses/{addressId}` (edit in place), `DELETE
  /users/me/addresses/{addressId}`
- My Pets → `GET /pets`, `PUT /pets/{id}`, `DELETE /pets/{id}`,
  medical records/vaccinations: `POST /pets/{id}/medical-records`, `DELETE
  /pets/{id}/medical-records/{recordId}` (same pattern for `/vaccinations`)
- Notification settings → `PUT /users/me {preferences}`
- Emergency Contact → `PUT /users/me {emergencyContact: {name, phone}}`
- Device push token registration → `POST /users/me/device-tokens
  {deviceToken}`, `DELETE /users/me/device-tokens {deviceToken}`

---

# Part 2 — Service-Provider App

A provider is a `USER` account (`role: SERVICE_PROVIDER`) that has also
created a `Provider` business profile.

## 1. Onboarding / Auth

| Screen | Endpoint(s) |
|---|---|
| `Select your role` | Client-side only — the 7 role cards map to `providerType` enum values: `GROOMER`, `VET` (both "Pet Clinics" and "Vets" cards map to `VET` — no separate distinction exists), `BOARDING`, `TRAINER`, `PET_WALKER`, `PET_SITTER` (added this pass — was previously missing, so selecting "Pet Sitter" would 400 on profile creation), `OTHER`. Pass the chosen role into `POST /auth/login/otp/request`'s `role` field. |
| `LogIn`, `LogIn OTP` | `POST /auth/login/otp/request {identifier: <phone>, role}` → `POST /auth/login/otp/verify` — same auto-signup flow as the end-user app, see the Auth model note at the top of this doc. |
| `LogIn-1` ("Login with Password" option) | `POST /auth/login {identifier, password}` — secondary path, only works once a password has been set via reset/update-password. |
| (post-login, first time) | `POST /providers/me {providerType, businessName, description?, experienceYears?, languages?, coordinates:[lng,lat], address, zoneIds?, workingHours?, metadata?}` — creates the business profile, `kycStatus` starts `PENDING`. `experienceYears`/`languages` are new this pass (the "12+ Years Experience"/"Eng, Hindi, Ben" profile fields had no field before). |
| KYC upload | `POST /providers/me/kyc-documents {type, url}` (upload file via `/uploads` category `KYC_DOCUMENT` first). `GET /providers/me` returns the uploaded `kycDocuments` list. |
| `Start Otp` / `End otp` (mid-booking, not login) | `POST /bookings/{id}/otp/start {code}`, `POST /bookings/{id}/otp/end {code}` |

## 2. Dashboard / Home

Composed client-side, same as the end-user Home:

- `GET /providers/me` (identity card, `isActive` toggle state, KYC status,
  `experienceYears`, `languages`)
- `PATCH /providers/me/active {isActive}` (Available/Offline toggle)
- `GET /providers/me/analytics?range=week|month` — see section 3, this is
  the one call the whole Dashboard earnings/rating section needs.
- `GET /bookings/provider/me?status=PENDING` (today's/upcoming visits list)
- `GET /reviews?providerId=<own id>` (Recent Reviews)
- Wallet balance tile → `GET /wallet/me` — ⚠️ see Known Gaps, this won't
  reflect booking payouts automatically yet.

## 3. Analytics / Earnings

`GET /providers/me/analytics?range=week` (or `month`) returns everything
this screen needs:

- `earningsByDay`, `bookingCount`, `ratingBreakdown`, `repeatClientPercent`
  (retention rate)
- `caseMix: [{categoryId, categoryName, count, percent}]` — powers the
  "Case Mix" donut (new this pass)
- `topServices: [{serviceId, name, price, bookingCount}]` — powers the
  "Top-Rated Services" list (ranked by booking volume, not a per-service
  rating — Reviews aren't linked to a specific service, only to the
  provider as a whole; new this pass)
- `avgServiceDurationMinutes` — powers "Avg Consult Time" (new this pass)
- `satisfactionScore` — weighted average rating, powers "Satisfaction
  Score" as a single number rather than the star-breakdown (new this pass)
- `previousPeriodEarnings` — compute "Monthly Growth %" client-side as
  `(earningsByDay.sum - previousPeriodEarnings) / previousPeriodEarnings`
  (new this pass)

No "Activity Pulse" daily-intensity time series exists — see Known Gaps if
that sparkline needs real data.

## 4. Appointments / Bookings Management

- List/filter → `GET /bookings/provider/me?status=PENDING,ACCEPTED,ON_THE_WAY,STARTED`
  for "Upcoming" (comma-separated status list, new this pass), plus
  `from=YYYY-MM-DD&to=YYYY-MM-DD` for "Today"/"This Week" chips (new this
  pass — previously neither was possible in one call).
- Accept → `PATCH /bookings/{id}/accept`
- Mark en route → `PATCH /bookings/{id}/on-the-way`
- Cancel → `PATCH /bookings/{id}/cancel {reason}`

## 5. Live Service Execution (Start → In Progress → Complete)

1. **Start Service** (booking detail before arrival) → `GET
   /bookings/{id}` for customer/pet/package info.
2. **Verify Start OTP** → `POST /bookings/{id}/otp/start {code}` — status
   becomes `STARTED`.
3. **Grooming In Progress** → `PATCH /bookings/{id}/notes {notes}` for the
   free-text special-instructions box, `POST /bookings/{id}/photos {url,
   phase: "BEFORE"}` per uploaded photo (upload via `/uploads` first,
   category `PROVIDER_PORTFOLIO`, then attach the URL here).
4. **Complete Service** → `POST /bookings/{id}/otp/end {code}` — status
   becomes `COMPLETED`; upload after-photos the same way with `phase:
   "AFTER"`.
5. **Service Completed screen** → `GET /bookings/{id}` for the summary
   (earnings = `price - discountAmount`, `photos`, `providerNotes`).

`Live Walk Tracker` (if built for the provider's own walk-in-progress view,
not just the customer's) — **not implemented, see Known Gaps**.

## 6. Messages

`GET /chat/rooms?isUrgent=true` for the "Emergency" filter pill (new this
pass — was cosmetic/client-side only before), `GET /chat/rooms` for "All
Chats", `GET /chat/rooms/{roomId}/messages`, `POST
/chat/rooms/{roomId}/messages`, `PATCH /chat/rooms/{roomId}/read`. Flag a
room urgent (e.g. from a keyword or manual triage): `PATCH
/chat/rooms/{roomId}/urgent {isUrgent: true}` (new this pass).

## 7. Profile / Account Management

- `GET /providers/me` / `PUT /providers/me` (business info, `experienceYears`,
  `languages`, working hours, metadata)
- `PUT /providers/me/bank-account {accountHolderName, accountNumber,
  ifscCode, bankName}` — the response (via `GET /providers/me`) returns a
  masked `{accountHolderName, bankName, last4}`.
- `GET /providers/me/attendance` — full check-in/check-out history.
- **Holidays** → `POST /providers/me/unavailable-dates {date}`, `DELETE
  /providers/me/unavailable-dates/{date}` (new this pass — this menu item
  had no backend at all before; blocked dates are excluded from `GET
  /availability`'s bookable slots automatically).
- Staff Management (Boarding Center `Profile-1` screen), Packages
  management (Groomer `Profile-2` screen) → **not implemented, see Known
  Gaps** — no screen shows their actual contents beyond the menu label, so
  there's nothing concrete to build against yet.

⚠️ **Privacy note**: `kycDocuments`, `kycRejectionReason`, `bankAccount`, and
`attendance` are only ever returned on `GET/PUT /providers/me` (the
provider's own authenticated view) or admin routes — the public `GET
/providers/{id}` and `GET /providers/nearby` (used by the end-user app to
browse providers) deliberately omit all four (`experienceYears`,
`languages`, and `unavailableDates` ARE public, since customers benefit
from seeing them before booking).

---

# Known Gaps / Backlog

Not built — either no screen shows enough detail to build against, or it
needs a product/business decision first:

- **Live GPS walk tracking** (`Live Walk Tracker`) — no location-ping
  ingestion or live-read endpoint. Needs a decision on transport (WebSocket
  vs. polling) and whether steps/calories are device-computed or
  server-computed.
- **Multi-pet single order** (Confirm screen's "Add other pets") — `POST
  /bookings` takes one `petId`. Needs a product decision: separate bookings
  per pet (current workaround) vs. a true multi-pet order with its own
  pricing/OTP model.
- **Reschedule a booking** — only cancel exists. Needs a decision on
  reschedule limits/fees.
- **Partial refunds** — `refundBooking` always refunds in full. Needs a
  business rule for partial-refund eligibility.
- **Prescription OCR scan** (`Shopping & Pharmacy`'s "Scan Prescription") —
  `/uploads` stores the image only, nothing parses it.
- **Group chat / message edit-delete** — chat is 1:1 only, no edit/delete.
- **Per-category "Safety & Verification" flags** (Pet Companion) — only one
  generic `User.isVerified` boolean exists, not separate identity/
  vaccination/mobile/location verification flags.
- **Cross-order coupon usage limits** — a cart-applied coupon's
  `perUserLimit` is checked at apply-time but not logged to the coupons
  module's redemption ledger (that ledger requires a `bookingId`); a
  determined user could reapply the same single-use coupon across multiple
  orders. Needs either a generic reference-id on `CouponRedemption` or a
  parallel ledger for marketplace redemptions.
- **Admin draft-blog / inactive-category listings** — an admin can create a
  draft or deactivate a category but has no endpoint to list/recover it
  without already knowing its id.
- **Boarding Center Staff Management, Groomer "My Packages"** — menu items
  exist in the Profile screens, no screen shows their actual contents,
  nothing to build against yet.
- **Provider Analytics "Activity Pulse"** (daily intensity sparkline) — no
  time-series endpoint for this exists; the other Analytics fields
  (earnings, case mix, top services, satisfaction) are all covered.
- **Provider wallet payouts are not automatic.** `providerPayoutAmount` is
  computed and stored on each completed Booking, and `WALLET_TRANSACTION_
  REASONS.BOOKING_PAYOUT` exists as an enum value, but nothing currently
  calls `walletService.credit(...)` with it — a provider's wallet balance
  will not reflect completed bookings until this is wired up (likely a
  scheduled payout job or a hook on booking completion, whichever the
  business prefers).
- **Add-on catalogs are empty by default.** The specific add-on chips shown
  on Dog Walking/Boarding screens (₹79 "Extra 15 Min", ₹150 "Extra
  Playtime", etc.) only work once each provider's `Service.addOnCatalog`
  is configured with matching name+price entries — this is real per-provider
  setup, not a platform-wide constant, and there's no seed data for it.
- **Fixed-duration Services for tiered pricing** (Dog Walking's 30/45/60-min
  cards) — each duration+price tier needs its own `Service` document per
  provider; a provider who only creates one "Dog Walking" service can't
  offer all three tiers as shown.
- **Razorpay/Firebase credentials are blank** in `docker-compose.yml` (both
  `app` and `worker` services) — `POST /payments/bookings/{id}/order`,
  `POST /wallet/me/topup`, and push notifications will fail against
  production until real keys are added. Not a code gap — a deployment
  config one.
- `updatedAt` is missing from several DTOs (orders, products, payments,
  blogs, categories, zones/cities) even though the underlying schema tracks
  it — only matters if the app does cache invalidation off it; a one-line
  mapper fix per module if/when needed.
