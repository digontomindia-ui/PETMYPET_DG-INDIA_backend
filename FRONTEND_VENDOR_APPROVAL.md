# Frontend Handoff — Vendor Approval & Management

**Audience:** Admin dashboard + Vendor app frontend teams
**Backend status:** implemented & tested. Base URL: `/api/v1`.

> "Vendor" = a `Provider` (user `role: SERVICE_PROVIDER`). Approval is tracked by the provider's
> **`kycStatus`**: `PENDING` → `APPROVED` / `REJECTED`. Suspension and deletion are separate states
> (see below). A new vendor is always created `PENDING`.

---

## 1. Lifecycle & states

| State | How it's represented | Can log in? | Dashboard access? |
|---|---|---|---|
| Pending | `kycStatus: PENDING` | ✅ (to finish onboarding) | ❌ (403, "under review") |
| Approved | `kycStatus: APPROVED` | ✅ | ✅ |
| Rejected | `kycStatus: REJECTED` + `kycRejectionReason` | ✅ (to re-submit docs) | ❌ (403, shows reason) |
| Suspended | `isActive: false` + `suspendedByAdmin: true` | ❌ (403) | ❌; existing tokens revoked |
| Deleted | `isDeleted: true` (soft delete) | ❌ (403) | ❌; existing tokens revoked |

---

## 2. Admin dashboard — Vendor Management (SUPER_ADMIN token required)

### 2.1 List vendors (status tabs)

`GET /api/v1/admin/providers`

| Tab | Query |
|---|---|
| Pending Approval | `?kycStatus=PENDING` |
| Approved Vendors | `?kycStatus=APPROVED` |
| All | *(omit `kycStatus`)* |

Other query params: `providerType`, `isActive` (`"true"`/`"false"`), `search` (business name
contains), `page`, `limit`. Deleted vendors never appear.

**Response**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "businessName": "Test Grooming Co",
      "providerType": "GROOMER",
      "kycStatus": "PENDING",
      "isActive": true,
      "suspendedByAdmin": false,
      "approvedAt": null,
      "createdAt": "2026-10-30T08:00:00.000Z",
      "ownerName": "Ravi Kumar",
      "ownerEmail": "ravi@example.com",
      "ownerPhone": "+919812345678"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

Map to the table: `businessName` = Store Name, `ownerName`/`ownerEmail` = Name/Email,
`createdAt` = Registration Date.

### 2.2 Vendor detail (KYC docs, masked bank, stats)

`GET /api/v1/admin/providers/:id` → returns the full record incl. `kycDocuments`, `owner`,
and `stats` (bookings, earnings). Use for the review drawer/modal.

### 2.3 Actions

| Button | Request | Body |
|---|---|---|
| **Approve** | `PATCH /api/v1/providers/:id/kyc/approve` | — |
| **Reject** | `PATCH /api/v1/providers/:id/kyc/reject` | `{ "reason": "Document unreadable" }` |
| **Suspend** | `PATCH /api/v1/admin/providers/:id/status` | `{ "isActive": false, "reason": "Complaints" }` |
| **Reactivate** | `PATCH /api/v1/admin/providers/:id/status` | `{ "isActive": true }` |
| **Delete** | `DELETE /api/v1/admin/providers/:id` | — |

- **Delete** needs a confirmation modal ("Access will be permanently revoked"). On success:
  `{ "success": true, "message": "Vendor account deleted", "data": null }`. `404` if already deleted.
- Show a toast on success/failure; **re-fetch the current tab's list** after any action.
- Suspend/Delete immediately kill the vendor's active sessions.

---

## 3. Vendor app — status screens

### 3.1 Login
1. `POST /api/v1/signin-signup` → `{ "role": "pet-groomer", "phone": "+9198..." }` (sends OTP)
2. `POST /api/v1/verify-otp` → `{ "role": "pet-groomer", "phone": "+9198...", "otp": "123456" }`

**Verify response**
```json
{ "token": "<jwt>", "isDocumentSubmited": false, "isDocumentApproved": false }
```
Route logic: `isDocumentApproved: true` → dashboard; otherwise → onboarding / "under review" screen.

### 3.2 Dashboard gate

Operational routes (`/home`, `/my-appointments`, `/appointments*`, `/earnings*`,
`/reviews-ratings*`, `/patients*`, `/analytics`, `/trainer/dashboard`, `/start-Session/*`,
`/end-Session*`, `/session/*`) return **403** for a non-approved vendor:

```json
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "Your account is pending admin approval. You will receive access once verified.",
  "details": { "kycStatus": "PENDING" }
}
```
Branch the status screen on `details.kycStatus`:
- `PENDING` → "Application under review."
- `REJECTED` → show the `message` (it contains the rejection reason), offer re-submit.

**Open regardless of approval** (so onboarding/re-submission works): `/upload-documents`,
`/profile`, `/profile/*`.

### 3.3 Suspended / deleted
- **Login** returns `403` with a clear message ("...suspended..." / "...has been removed...").
- An already-logged-in vendor who gets suspended/deleted receives **401** on the next request →
  clear the stored token and send them to the login screen.

---

## 4. Naming notes (ticket vs. actual)

1. The ticket's `PATCH /admin/vendors/:id/status` (approve/reject) = `PATCH /providers/:id/kyc/approve`
   and `/kyc/reject`.
2. The ticket's `GET /admin/vendors` / `DELETE /admin/vendors/:id` = the `/admin/providers` paths above.
3. "Suspended" is not a `kycStatus` value — it's `isActive:false` + `suspendedByAdmin:true`.

> If the team prefers the literal `/api/admin/vendors/*` paths, the backend can add thin alias
> routes — ask the backend team.
