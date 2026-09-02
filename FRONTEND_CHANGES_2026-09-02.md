# Backend changes — 2026-09-02

Base URL: `http://dxz8l4rvj5ckw3p10k6hwdf9.187.127.210.144.sslip.io/api/v1`

**Already deployed and reseeded on that URL** — everything below was verified against the live staging server (real login, real booking, real order, real DB), not just locally.

---

## 1. "Schedule" 404 — not a bug, wrong/missing params

`GET /availability` is the schedule endpoint. It needs **all three** query params:

```
GET /availability?providerId=<id>&serviceId=<id>&date=YYYY-MM-DD
```

If `serviceId` doesn't belong to a real service (or `providerId` doesn't exist), it correctly returns:
```json
{ "success": false, "error": "NOT_FOUND", "message": "Service not found" }
```
That's what was hitting the app as "404" — the call was missing/wrong `serviceId`, not a broken route. With a real `providerId` + `serviceId` pair it returns `200` with the day's slots. Get the real `serviceId` list first via `GET /services?providerId=<id>`.

## 2. `PET_SITTER` and Pet Companion returned empty near Digha

Not a code bug either — **data gap**. The Digha test zone only had a `BOARDING` and a `VET` provider seeded; no `PET_SITTER`, and no companion-enabled pet owned by anyone near those coordinates, so any nearby/discovery query from `21.70, 87.53` legitimately found nothing.

Fixed by seeding:
- A `PET_SITTER` provider: **Digha Trusted Pet Sitters** (`GET /providers/nearby?providerType=PET_SITTER&lat=21.70...&lng=87.53...` now returns it), with one service (Half-Day Pet Sitting, ₹449).
- A new end user **Sourav Das** (`sourav.das@seed.patmypets.in` / `Passw0rd!`), address in New Digha, owning a companion-enabled pet **Rocky**.

`GET /pet-companion/discover?petId=<yourPetId>&lat=...&lng=...` swipes on *other* companion pets near you — it won't show your own pet back to you, so testing this needs two different companion-enabled pets near the same coordinates (Rocky is the first; a second real/test user's pet nearby will now surface him).

## 3. Marketplace order checkout — `RAZORPAY` payment method

Two separate bugs, both fixed:

**a) Validation rejected it.** `POST /orders` require `paymentMethod` to be `WALLET`, `CASH_ON_DELIVERY`, or `RAZORPAY`, but the Zod schema only listed the first two — every `RAZORPAY` order 400'd before reaching any business logic. Fixed.

**b) Even past validation, nothing happened.** `WALLET` debited the wallet and marked the order paid; `RAZORPAY` had no branch at all — the order was created but silently left `paymentStatus: PENDING` forever, no Razorpay order, no payment record. That's why checkout looked like it "did nothing" and `GET /payments/me` stayed empty.

Now `POST /orders` with `paymentMethod: "RAZORPAY"` creates a real Razorpay order and a `Payment` row (same pattern bookings already used), and returns it alongside the order:

```jsonc
// POST /orders response, paymentMethod: "RAZORPAY"
{
  "success": true,
  "data": {
    "id": "...", "totalAmount": 538, "status": "PENDING", "paymentStatus": "PENDING", /* ...rest of order... */
    "razorpay": {
      "razorpayOrderId": "order_...",
      "amount": 538,
      "currency": "INR",
      "razorpayKeyId": "rzp_test_..."
    }
  }
}
```

Open Razorpay checkout client-side with `razorpay.razorpayOrderId` + `razorpay.razorpayKeyId`, same as the existing booking payment flow. The webhook (`POST /payments/webhook`, already wired) marks the order `paymentStatus: PAID` on `payment.captured` and shows up in `GET /payments/me` (now includes `orderId` alongside the existing `bookingId`).

**Known gap:** Razorpay isn't actually configured on staging yet (`RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are blank in the deploy env) — a `RAZORPAY` order currently fails with `500 Razorpay is not configured` after passing validation. `WALLET` and `CASH_ON_DELIVERY` orders work end-to-end right now; send over the Razorpay test keys (or confirm the ones from Sep 1 are still valid) to light this up.

## 4. `GET /providers/:id` now includes reviews

The provider detail response never had reviews on it (only the aggregate `rating`/`ratingCount`) — you had to know to call `GET /reviews?providerId=<id>` separately. Added the 5 most recent directly on the detail response:

```jsonc
{
  "id": "...", "businessName": "...", /* ...rest of provider... */
  "recentReviews": [
    { "id": "...", "bookingId": "...", "userId": "...", "rating": 5, "comment": "...", "createdAt": "...", "authorName": "Ananya S.", "authorAvatarUrl": "https://..." }
  ]
}
```
`GET /reviews?providerId=<id>` still exists for a full paginated list — this is just the "show a few on the detail page" shortcut, same as the pet-companion detail screen's `recentReviews`.

## 5. `GET /bookings/me` — verified working end to end

This looked broken but tested clean, start to finish, against the live server. Full flow for the frontend:

```
1. POST /bookings
   { providerId, serviceId, scheduledStart, petId?, addOns?, couponCode?, notes?,
     durationDays?, dropOffTime?, pickupTime?, consultationMode? }
   → 201, booking status "PENDING", paymentStatus "PENDING"

2. POST /payments/bookings/{bookingId}/order
   { "method": "WALLET" | "CASH" | "RAZORPAY" }
   → WALLET: debits wallet immediately, booking.paymentStatus → "PAID"
   → CASH: payment row created (status CREATED), collected in person later via
            PATCH /payments/{paymentId}/mark-cash-collected (provider only)
   → RAZORPAY: returns { paymentId, razorpayOrderId, amount, currency, razorpayKeyId }
               open checkout client-side; webhook marks it PAID on success

3. Provider side (SERVICE_PROVIDER token):
   PATCH /bookings/{id}/accept        → status "ACCEPTED", generates a 6-digit start OTP
   PATCH /bookings/{id}/on-the-way    → status "ON_THE_WAY"
   POST  /bookings/{id}/otp/start  { "code": "<otp shown to the pet parent>" }
                                       → status "STARTED"
   POST  /bookings/{id}/otp/end    { "code": "<end otp>" }
                                       → status "COMPLETED"

4. GET /bookings/me?status=PENDING,ACCEPTED,ON_THE_WAY,STARTED&page=1&limit=20
   GET /bookings/me?status=COMPLETED
   GET /bookings/{id}
   → same endpoint/shape for both a USER token (their bookings) and a
     SERVICE_PROVIDER token (bookings against their provider profile)

   PATCH /bookings/{id}/cancel  { reason? }  → either side, before COMPLETED
```

Dev-mode OTP is fixed to `123456` until real SMS/SMTP creds are configured (same as login OTP). `otpStart`/`otpEnd` on the booking object are the codes to display to the pet parent at each step — the provider enters what the parent shows them, not a code they see themselves.

One gotcha that looks like a bug but isn't: `POST /payments/bookings/{bookingId}/order` 400s with `"Insufficient wallet balance"` if the seeded wallet (₹1000 for the demo users) is smaller than the service price — pick a cheaper service or top up the wallet first when testing.
