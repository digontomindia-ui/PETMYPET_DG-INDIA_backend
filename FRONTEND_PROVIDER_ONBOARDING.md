# Frontend Handoff — Role-Specific Provider Onboarding

**Audience:** Vendor (provider) app — the onboarding / "upload documents" screen
**Endpoint:** `POST /api/v1/upload-documents` (Bearer token from `verify-otp`)

> ⚠️ **Deploy coordination:** the backend now **validates each role's required fields** and returns
> `400` if any are missing (e.g. `{ "message": "bio is required" }`). Ship the app update that
> sends these fields **together with** the backend, or onboarding will be rejected.

The **KYC documents are the same for every role** (Aadhaar + PAN). Only the *details* differ per role.

---

## Required details per role

| Role (app slug) | Required detail fields |
|---|---|
| **Groomer** (`pet-groomer`) | name, experience, email, bio |
| **Vet** (`vets`) | name, email, specialization, experience, bio |
| **Boarding** (`boarding-center`) | name (`boarding_name`), address, founded (year), boarding details (`description`) |
| **Pet sitter** (`pet-sitter`) | name, experience, email, bio |
| **Dog trainer** (`dogs-trainer`) | name, experience, email, bio |
| **Dog walker** (`dog-walker`) | name, experience, email, bio |

Everything not listed for a role is optional (e.g. `profile_image`, groomer `specialization`, boarding `clinic_images`, trainer `media`).

---

## Field reference (exact JSON keys)

Mind the spellings — these are the keys the backend expects:

| Field | Type | Notes |
|---|---|---|
| `name` | string | The person's / business name (all roles except boarding) |
| `experience` | **number** | Years of experience, integer ≥ 0 |
| `email` | string | Valid email |
| `bio` | string | Free text, ≤ 2000 |
| `specialization` | string | **Vet: required.** Groomer: optional |
| `boarding_name` | string | **Boarding only** — its "name" field |
| `founded` | **string** | **Boarding only** — year as a string, e.g. `"2015"` |
| `description` | string | **Boarding only (required)** — the "boarding details" |
| `location` | object | `{ "address": string, "longtude": number, "latatude": number }` — **Boarding requires `address`** |
| `profile_image` | string (URL) | optional |
| `clinic_images` / `media` | string[] (URLs) | optional galleries (boarding / trainer) |
| `documents` | object | `{ "adhar_card": <url>, "pan_card": <url> }` — same for every role |

> Note the existing (intentional, don't "fix" them) key spellings: `longtude`, `latatude`,
> `adhar_card`. Image/document URLs come from the Uploads endpoint.

---

## Example payloads

**Groomer / Pet sitter / Dog walker** (identical shape):
```json
POST /api/v1/upload-documents
{
  "name": "Ravi Kumar",
  "experience": 4,
  "email": "ravi@example.com",
  "bio": "Certified pet groomer, gentle with anxious dogs.",
  "documents": { "adhar_card": "https://cdn/.../aadhaar.jpg", "pan_card": "https://cdn/.../pan.jpg" }
}
```

**Vet** (`vets`):
```json
{
  "name": "Dr. Meera Nair",
  "email": "meera@example.com",
  "specialization": "Surgery",
  "experience": 8,
  "bio": "Small-animal surgeon, 8 years in practice.",
  "documents": { "adhar_card": "https://cdn/.../aadhaar.jpg", "pan_card": "https://cdn/.../pan.jpg" }
}
```

**Dog trainer** (`dogs-trainer`): same four fields as groomer, plus optional `media: [url, …]`.

**Boarding** (`boarding-center`):
```json
{
  "boarding_name": "Happy Paws Boarding",
  "description": "Spacious, air-conditioned kennels with 24x7 supervision.",
  "founded": "2015",
  "location": { "address": "12 MG Road, Bengaluru", "longtude": 77.6, "latatude": 12.9 },
  "documents": { "adhar_card": "https://cdn/.../aadhaar.jpg", "pan_card": "https://cdn/.../pan.jpg" }
}
```

---

## Responses

- **201** — onboarding saved. The vendor is now `PENDING` KYC (awaiting admin approval).
- **400** — a required field for that role is missing; the `message` names it (e.g. `"address is required"`, `"founded is required"`, `"specialization is required"`). Show it inline on the matching field.

## Notes
- `experience` is a **number**, not a string. `founded` is a **string** (year).
- The role is fixed at signup (sent to `signin-signup` / `verify-otp`), so `upload-documents` carries **no** role field — the backend validates against the account's role.
- Submitting a real `name` (or `boarding_name`) is what turns the account from a hidden "shell" into a real vendor that appears in the admin and can be KYC-approved.
