# Provider Registration & Admin Display — Fixes

**Scope:** all backend-only. **No admin-app or vendor-app code changes are required** — but the
behavior below changes, so the teams should know. Deploy the **backend** for these to take effect.

## Background

A vendor account is created the moment the phone OTP is verified (the app needs an authenticated
provider context to run onboarding). Before onboarding finishes, that record is a **shell**: it
carries the placeholder `businessName: "Pending onboarding"`, a blank owner name, and no documents.
These shells were causing three problems — all now fixed.

---

## 1. Admin: vendor name / details were blank

**Was:** the admin provider directory and KYC queue listed shell accounts, which show up as
`businessName: "Pending onboarding"` and owner "No name" — looking like broken/empty vendors.

**Now:** shells are **excluded** from:
- `GET /admin/providers` (directory, all tabs)
- `GET /providers/pending-kyc` (KYC queue)
- the dashboard's `pendingModeration.providerKyc` count

So the admin only ever sees **real vendors** (anyone who completed onboarding — real business name,
owner name, submitted documents). **Admin frontend: no change needed** — the junk rows just stop
appearing. Real vendors already have `businessName` + `ownerName`/`ownerPhone`/`ownerEmail` populated.

## 2. Re-registering the same number as a different type

**Was:** if a number signed up (e.g. as *Pet Groomer*) and stopped at OTP without finishing
onboarding, trying to register that number again as a **different** type returned:
`409 "This phone number is already registered as a 'pet-groomer' account"` — even though
registration was never completed.

**Now:** that conflict only fires for a **fully-onboarded** provider of a different type. A number
that stopped at OTP can re-register as **any** type:
- `POST /signin-signup` → `200` (no conflict)
- `POST /verify-otp` → `200`, and the shell is **retyped** to the newly chosen role (not duplicated).

**Vendor frontend: no change needed.** Just be aware the `409 CONFLICT` now means "this number is
already a live vendor of a different type" — a genuine clash, safe to surface to the user as-is.

## 3. "It gets saved even though registration didn't finish"

The account still exists after OTP verification (that's required for the authenticated onboarding
steps — document upload, profile, etc.), **but** it's now invisible to admin and fully
re-registerable until onboarding completes. In other words: verifying OTP no longer creates a
"locked" vendor — it creates a draft the user can finish, restart, or change the type of at will.

A shell becomes a real, admin-visible vendor only once onboarding sets a real business name
(`POST /upload-documents`).

---

## What each team does

- **Backend:** redeploy (these changes are in the backend repo).
- **Admin app:** nothing — incomplete shells simply stop cluttering the lists.
- **Vendor app:** nothing required; optionally improve the post-OTP flow to guide users straight
  into onboarding so fewer shells are created in the first place.
