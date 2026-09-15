# Backend changes — 2026-09-15

## Provider (vendor) app API surface

New: a full API surface for the separate provider/vendor mobile app (pet-groomer, pet-clinics, vets, boarding-center, dogs-trainer, dog-walker, pet-sitter), matching the endpoint spec you were given. **Additive only** — nothing the existing pet-owner app calls was touched or renamed; these are new, separate routes that happen to reuse the same backend data underneath.

All endpoints below are under `/api/v1` with **no extra prefix** — e.g. `POST /api/v1/signin-signup`, `GET /api/v1/home`, exactly as specced.

### 1. Signup / Signin

```http
POST /api/v1/signin-signup
{ "role": "pet-groomer", "phone": "+919735833466", "fcm_token": "...", "device_type": "android", "device_id": "..." }
→ { "success": true, "message": "OTP sent successfully" }
```

`role` must be one of: `pet-groomer`, `pet-clinics`, `vets`, `boarding-center`, `dogs-trainer`, `dog-walker`, `pet-sitter`. First call for a phone number creates the account; a repeat call with a **different** role than what's already on file is rejected (409) — one phone = one provider role.

```http
POST /api/v1/verify-otp
{ "role": "pet-groomer", "phone": "+919735833466", "otp": "123456" }
→ {
  "success": true,
  "message": "Login or signup successful",
  "isDocumentSubmited": false,
  "isDocumentApproved": false,
  "token": "<JWT access token — use as Bearer everywhere below>"
}
```

`isDocumentSubmited` is `true` once **any** KYC document has been uploaded; `isDocumentApproved` is `true` once admin approves KYC. Demo/no-SMS-configured environments use a fixed OTP (`111111`-style code, same as the rest of the backend) — real SMS delivery needs `SMS_API_KEY` set.

```http
POST /api/v1/upload-documents   (Bearer required)
```

One endpoint, body shape depends on the role you signed up as (matches the spec exactly — `name`/`clinic_name`/`boarding_name`, `location`, `specialization`, `clinic_images`, `media`, `documents.adhar_card`/`documents.pan_card`, etc.). The server already knows your role from your account, so you don't send it again here.
→ `{ "success": true, "message": "Documents submitted successfully" }`

### 2. Home / Dashboard — `GET /home` (Bearer required)

One endpoint, response shape **branches by your provider role** exactly like the spec's per-role examples (pet-sitter's flat shape, pet-walker's `data.verification_status`/`todays_schedule`, vet/clinic's `today's_overview`/`lab_report`/`revenue_overview`, boarding's `occupancy_status`/`today_check_ins`, groomer's `active_grooming.steps`). Dogs-trainer's dashboard is a separate documented path since the spec puts it there:

```http
GET /trainer/dashboard   (Bearer required)
```
No query params → dashboard shape. With `?type=upcoming|past` and/or `?filter=all|today|this_week|pending` → the appointments-list shape instead (same endpoint does double duty, per the spec).

### 3. Appointments

| Endpoint | Role | Query |
|---|---|---|
| `GET /my-appointments` | pet-sitter | `status=all\|upcoming\|completed\|cancelled`, `page`, `limit` |
| `GET /appointments` | dog-walker, vets/pet-clinics, boarding-center | `status`, `date=DD-MM-YY`, `page`, `limit` |
| `GET /trainer/dashboard?type=...&filter=...` | dogs-trainer | see above |
| `GET /patients?type=Dog\|Cat\|Birds\|All` | vets/pet-clinics only | — |

Vet/clinic's `/appointments` returns the spec's flat `{"total appointments": N, "schedule": [...]}` shape; everyone else gets the `{success,message,data:{appointments,pagination}}` shape.

### 4. Session lifecycle (start/end a booking) — all Bearer required

These resolve "the current session" from **your token alone** — no booking ID in the body, matching the spec's minimal payloads. Internally: your one booking that's `ACCEPTED`/`ON_THE_WAY` is "starting"; your one `STARTED` booking is "active."

```
POST /start-Session/verify-otp   { "otp": "1234" }
POST /session/resend-otp         (no body needed)
POST /end-Session/verify-otp     { "otp": "1234" }
GET  /end-Session                → { summary: { distance, status } }
POST /session/upload-training-process   { caption, progress_note, media: [...] }
```

**Heads up — one real behavior difference from the pet-owner app's booking flow:** the existing `POST /bookings/:id/otp/end` requires `lat`/`lng` and geofences the provider against the customer's address. The spec's `/end-Session/verify-otp` doesn't send location at all, so **that geofence check is skipped** for this endpoint. If you want it re-enabled, send `lat`/`lng` and tell backend — it's a small addition.

`resend-otp` didn't exist before at all (booking OTPs were never SMS-delivered, just shown in the owner's app for the provider to ask for in person). It now regenerates the pending code and **texts it to the customer** — a genuinely new capability, not just a stub.

### 5. Analytics — `GET /analytics?time_range=week|month|year` (Bearer required)

Shape branches by role (sitter's `overview_cards`/`earnings_chart`/`top_services`, trainer's `weekly_earnings`/`metrics_grid`/`ratings_breakdown`, everyone else gets the walker shape). All numbers are real, computed from your actual bookings/reviews — nothing fabricated.

### 6. Profile — `GET /profile` (Bearer required)

Generic shape for sitter/walker/groomer/trainer; vets/pet-clinics get the dedicated vet-profile shape (`clinic_information`, etc.), matching the spec's two documented variants.

### 7. Chat — REST aliases + socket event aliases

New REST paths (thin wrappers over the existing chat system, so anything you send/receive is visible in both):
```
GET /message                       → inbox list
GET /message/:room_id/history      → paginated message history
```

New socket event names, layered **on top of** the existing `chat:*` events (nothing there changed):

| You emit | Payload |
|---|---|
| `join_room` / `leave_room` | `{ room_id }` |
| `send_message` | `{ room_id, temp_id, message, type }` |
| `typing_start` / `typing_stop` | `{ room_id }` |
| `mark_read` | `{ room_id, last_read_message_id }` |

| You receive | Payload |
|---|---|
| `message_ack` | `{ temp_id, id, room_id, status, created_at }` |
| `new_message` | `{ id, room_id, sender_id, sender_name, message, type, status, created_at }` |
| `user_typing` | `{ room_id, user_id, is_typing }` |
| `messages_read` | `{ room_id, last_read_message_id, read_by, read_at }` |

Note: `status` is always `SENT`/`DELIVERED` in practice (no `SEEN` push notification yet — read status still has to be pulled via `/message/:room_id/history`).

### 8. New provider type: `pet-clinics`

Previously "vet" covered both individual veterinarians and clinics. There's now a distinct `CLINIC` provider type (mapped from the `pet-clinics` role) alongside `VET`, so a clinic's onboarding data (`clinic_name`, `clinic_images`, `founded`, `specialization`) is stored separately from an individual vet's.

## Known stubs — honest gaps, not bugs

The spec asks for a few things this backend has no data model for yet. Rather than fake data, these come back as empty/zero and are clearly marked in the code (`ponytail:` comments in `provider-app.mapper.ts`) so nobody mistakes them for "done":

- Vet/clinic: `lab_report`, `inventory_alerts`, revenue breakdown by `Pharmacy`/`Services & Others` — always empty/zero.
- Boarding: `pet_updates_due`, `recent_messages`, `emergency_contact`, `banner_image` — always empty/null.
- Groomer: `recent_prescriptions`, `recent_reviews` — always empty/null.
- Boarding's `pending_booking_requests[].pet.approve` is always `false` — there's no separate approve/reject action for boarding requests yet (existing `PATCH /bookings/:id/accept` works, it's just not wired into that flag).

If/when there's a real screen for any of these on the admin or provider side, say so and we'll wire up real data instead of the stub.

## Files touched (backend, for reference)

New module: `src/modules/provider-app/*`. Small additive changes: `common/constants/roles.ts` (added `CLINIC`), `modules/chat/chat.gateway.ts` (added alias listeners), `modules/bookings/*` (added `progressUpdates` field, `findActiveForProvider` lookup), `modules/providers/provider.service.ts` (analytics now also accepts `range=year`).
