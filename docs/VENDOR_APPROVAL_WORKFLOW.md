# Vendor Approval & Management — API Contract

"Vendor" = a `Provider` (user `role: SERVICE_PROVIDER`). Vendor approval is tracked by the
provider's **`kycStatus`** (`PENDING` → `APPROVED` / `REJECTED`), plus admin **suspension**
(`isActive: false` / `suspendedByAdmin: true`) and **deletion** (soft-delete: `isDeleted: true`).

A brand-new vendor is always created `PENDING` and **can still authenticate** so it can finish
onboarding and upload KYC documents — but it is fenced out of the operational dashboard until an
admin approves it. `REJECTED` behaves the same (can log in to read the reason and re-submit), while
`SUSPENDED` and `DELETED` are blocked from logging in at all and have their sessions revoked.

All admin endpoints require a `SUPER_ADMIN` bearer token.

---

## Admin — list vendors

`GET /api/v1/admin/providers`

Query params (all optional): `kycStatus` (`PENDING`|`APPROVED`|`REJECTED`), `isActive`
(`"true"`|`"false"`), `providerType`, `search` (business-name contains), `page`, `limit`.

- The **"Pending Approval"** tab → `?kycStatus=PENDING`.
- The **"Approved Vendors"** tab → `?kycStatus=APPROVED`.
- The **"All"** tab → omit `kycStatus`.
- New registrations appear automatically under `PENDING`. Deleted vendors are excluded.

Each row includes `id`, `businessName`, `providerType`, `kycStatus`, `isActive`,
`suspendedByAdmin`, `approvedAt`, `createdAt` (registration date), `ownerName`, `ownerEmail`,
`ownerPhone`, plus the public provider fields. Response is paginated via `meta`.

Full detail (KYC documents, masked bank, booking/earnings stats): `GET /api/v1/admin/providers/:id`.

## Admin — approve / reject a vendor

- **Approve:** `PATCH /api/v1/providers/:id/kyc/approve` → sets `kycStatus: APPROVED`, stamps
  `approvedAt`, marks all KYC documents `VERIFIED`, notifies the vendor.
- **Reject:** `PATCH /api/v1/providers/:id/kyc/reject` with body `{ "reason": "<text>" }` → sets
  `kycStatus: REJECTED`, stores the reason, notifies the vendor.

## Admin — suspend / reactivate a vendor

`PATCH /api/v1/admin/providers/:id/status` with body `{ "isActive": false, "reason": "<text>" }`.

- `isActive: false` suspends (hidden from search, **sessions revoked immediately** so existing
  tokens stop working, cannot self-reactivate).
- `isActive: true` reactivates.

## Admin — delete (revoke) a vendor

`DELETE /api/v1/admin/providers/:id`

- Soft-deletes the provider (`isDeleted: true`, `deletedAt`), flips it inactive, **revokes every
  session** so existing tokens die on the next request, notifies the vendor, writes an audit log.
- The account can no longer authenticate on any login path.
- `200` → `{ success: true, message: "Vendor account deleted", data: null }`. `404` if already
  deleted / not found.
- Confirm with a modal before calling — this permanently revokes access.

---

## Vendor-side behavior (for the vendor app)

- **Login paths:** `POST /api/v1/signin-signup` → `POST /api/v1/verify-otp` (OTP), or
  `POST /api/v1/auth/login` (password).
- `verify-otp` returns `{ token, isDocumentSubmited, isDocumentApproved }`. Use
  `isDocumentApproved` / `isDocumentSubmited` to route to the "under review" screen.
- **Suspended / deleted** vendors get `403` at login with a clear message
  (`"...suspended..."` / `"...has been removed..."`).
- **Dashboard gate:** operational routes (`/home`, `/my-appointments`, `/appointments*`,
  `/trainer/dashboard`, `/analytics`, `/patients*`, `/start-Session/*`, `/end-Session*`,
  `/session/*`, `/reviews-ratings*`, `/earnings*`) return `403` for a non-approved vendor with:

  ```json
  { "success": false, "error": "FORBIDDEN",
    "message": "Your account is pending admin approval. You will receive access once verified.",
    "details": { "kycStatus": "PENDING" } }
  ```

  For `REJECTED` the message carries the rejection reason and `details.kycStatus` is `"REJECTED"`.
  Branch on `details.kycStatus` to show the right status screen.
- **Open while pending/rejected** (so onboarding/re-submission works): `/upload-documents`,
  `/profile`, `/profile/*`.
