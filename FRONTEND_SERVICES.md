# Frontend Handoff — Provider Services

**Audience:** Provider app/dashboard (create & manage services) + User app (browse services)
**Base URL:** `/api/v1`. Backend is implemented & deployed.

> **Who manages services:** the **provider** manages their own. Admin does **not** create or edit
> services (admin only manages the category taxonomy and the provider account). A provider can only
> touch their own services — the backend enforces ownership.

---

## 1. Auth

- **Create / Update / Delete** require a **`SERVICE_PROVIDER`** bearer token (`Authorization: Bearer <accessToken>`).
- **Browse / view** are public (no token needed).
- A provider must already have a provider profile (created during onboarding) before creating services.

| Action | Endpoint | Auth |
|---|---|---|
| Create a service | `POST /services` | Provider |
| Update a service | `PUT /services/:id` | Provider (own) |
| Delete a service | `DELETE /services/:id` | Provider (own) |
| Browse / search | `GET /services` | Public |
| View one | `GET /services/:id` | Public |

---

## 2. Dependencies the create form needs

- **Category dropdown** → `GET /categories` (public). A service **must** reference a `categoryId`.
  Categories are admin-managed; the provider just picks one.
- **Image URLs** (service `images`, and each `includedItems[].imageUrl` icon) come from the
  **Uploads** endpoint — upload the file first, then use the returned URL. Don't send local/base64
  URLs; the backend validates each must be a real URL.

---

## 3. Create a service — `POST /services`

**Body** (`application/json`):

| Field | Type | Required | Rules |
|---|---|---|---|
| `categoryId` | string (ObjectId) | ✅ | 24-hex id from `GET /categories` |
| `name` | string | ✅ | 1–150 chars |
| `price` | number | ✅ | ≥ 0 |
| `durationMinutes` | integer | ✅ | **≥ `MIN_BOOKING_DURATION_MINUTES` (90 by default)** — confirm your deployment's value |
| `description` | string | — | ≤ 2000 (default `""`) |
| `originalPrice` | number | — | ≥ 0 and **≥ `price`** (struck-through list price) |
| `images` | string[] (URLs) | — | default `[]` |
| `includedItems` | `{ name, imageUrl }[]` | — | "What's included" list; `name` 1–100, `imageUrl` a URL |
| `addOnCatalog` | `{ name, price }[]` | — | bookable add-ons; `name` 1–100, `price` ≥ 0 |

```json
POST /api/v1/services
{
  "categoryId": "64f1a2b3c4d5e6f7a8b9c0c1",
  "name": "Full Grooming Package",
  "description": "Bath, haircut, nail trim, and ear cleaning.",
  "price": 899,
  "originalPrice": 1049,
  "durationMinutes": 90,
  "images": ["https://cdn.petmypet.in/services/grooming.jpg"],
  "includedItems": [
    { "name": "Bath", "imageUrl": "https://cdn.petmypet.in/icons/bath.png" },
    { "name": "Nail Trim", "imageUrl": "https://cdn.petmypet.in/icons/nail-trim.png" }
  ],
  "addOnCatalog": [
    { "name": "Extra 15 Min", "price": 79 },
    { "name": "Poo Pickup", "price": 49 }
  ]
}
```

**201 response** → `{ success, message: "Service created", data: <Service> }` (see §6 for the shape).
`isActive` is `true` on create.

---

## 4. Update a service — `PUT /services/:id`

Same fields as create, **all optional**, plus **`isActive: boolean`**. Send only what changes.
Arrays (`images`, `includedItems`, `addOnCatalog`) **replace** the whole array when sent.

```json
PUT /api/v1/services/64f1a2b3c4d5e6f7a8b9c0a5
{ "price": 949, "originalPrice": 1099, "isActive": false }
```

- Use `{ "isActive": false }` to **take a service offline** (hides it from users) without deleting it;
  `{ "isActive": true }` to bring it back.
- `403` if it's not the caller's own service; `404` if not found.

## 5. Delete a service — `DELETE /services/:id`

Soft-deletes the service. `200` → `{ success: true, message: "Service deleted", data: null }`.
`403` for someone else's service.

---

## 6. Service object (response shape)

Returned by create/update and inside browse/get:

```json
{
  "id": "64f1a2b3c4d5e6f7a8b9c0a5",
  "providerId": "64f1a2b3c4d5e6f7a8b9c0d3",
  "categoryId": "64f1a2b3c4d5e6f7a8b9c0c1",
  "name": "Full Grooming Package",
  "description": "Bath, haircut, nail trim, and ear cleaning.",
  "price": 899,
  "originalPrice": 1049,
  "durationMinutes": 90,
  "images": ["https://cdn.petmypet.in/services/grooming.jpg"],
  "includedItems": [{ "name": "Bath", "imageUrl": "https://cdn.petmypet.in/icons/bath.png" }],
  "addOnCatalog": [{ "name": "Extra 15 Min", "price": 79 }],
  "isActive": true,
  "createdAt": "2026-08-04T12:00:00.000Z"
}
```

---

## 7. Provider's "My Services" list

There's no `/services/mine` — list your own with the `providerId` filter:

```
GET /api/v1/services?providerId=<your provider id>
```

- Get `<your provider id>` from **`GET /providers/me`** (`data.id`).
- The `providerId` filter returns **all** of that provider's services — including their own even
  while pending/inactive — so it's the right call for the provider's own management screen.

---

## 8. User-facing browse / search — `GET /services`

Query params (all optional): `categoryId`, `providerId`, `q` (text search), `minPrice`, `maxPrice`,
`page`, `limit`.

```
GET /api/v1/services?categoryId=64f1…&minPrice=200&maxPrice=1500&page=1&limit=20
```

Response: `{ success, data: Service[], meta: { page, limit, total, totalPages } }`.

Other user discovery: `GET /search?q=` (global), `GET /search/suggest?q=`, `GET /providers/nearby`.

### Visibility rules (important for the user app)
A service shows in the **public browse** (`GET /services` without `providerId`) only when **all** of:
- the owning provider's `kycStatus === "APPROVED"`, **and**
- the provider's `isActive === true` (not admin-suspended), **and**
- the service's `isActive === true`.

So a freshly-approved provider's active services appear immediately. Two gotchas:
- A **pending/rejected** provider's services are hidden from browse until approved (but a direct
  `?providerId=` lookup still returns them — that's how the provider sees their own).
- **`GET /providers/nearby`** is location-based: a provider who onboarded via the app but never set
  a real address/location (placeholder `[0,0]`) won't appear in "near me" results even when approved.
  Make sure onboarding captures the provider's location/zone if your user home uses nearby.
