# Frontend Fix — Service Browse Must Pass a Filter

**Audience:** User app — the home category/vertical buttons (Grooming, Vaccination, Boarding, …)
**Symptom:** every button shows **all** services.

## Cause

The app is calling `GET /api/v1/services` **with no filter**, so the backend returns every approved
provider's services for every button. The backend filtering works — the button just has to tell it
*which* category/vertical to show.

## Fix — pass a filter when a button is tapped

Use **one** of these on `GET /api/v1/services`:

### Option A — by vertical (simplest, matches the buttons)
```
GET /api/v1/services?providerType=GROOMER      → grooming services
GET /api/v1/services?providerType=VET          → vaccination / vet services
GET /api/v1/services?providerType=BOARDING     → boarding
GET /api/v1/services?providerType=PET_WALKER   → dog walking
GET /api/v1/services?providerType=TRAINER      → dog training
GET /api/v1/services?providerType=PET_SITTER   → pet sitting
```
`providerType` values: `GROOMER`, `VET`, `BOARDING`, `PET_WALKER`, `TRAINER`, `PET_SITTER`,
`CLINIC`, `PHARMACY`. (This `providerType` filter is new — deploy the backend to use it.)

### Option B — by category id
```
GET /api/v1/services?categoryId=<id>
```
Get the ids from `GET /api/v1/categories` (each category also lists the `providerTypes` it maps to).
Wire each button to the matching category's `id`.

Both can be combined with `page`, `limit`, `minPrice`, `maxPrice`, `q` (text search). Response is the
paginated service list (same shape as today).

## Summary
- ❌ `GET /services` (no filter) → all services (current bug).
- ✅ `GET /services?providerType=GROOMER` **or** `?categoryId=<id>` → only that button's services.

No backend data change is needed — just send the filter from the button.
