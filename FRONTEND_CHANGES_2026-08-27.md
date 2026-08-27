# Backend changes — 2026-08-27

For each item Madhab reported. Base URL unchanged: `http://dxz8l4rvj5ckw3p10k6hwdf9.187.127.210.144.sslip.io/api/v1`

**Before any of this is testable on that URL, the backend needs to be redeployed and reseeded** — see "Deploy note" at the bottom.

---

## 1. Provider detail — price/experience show but no certificate

`Provider` had no image or certification fields at all. Added:

```jsonc
// GET /providers/:id and GET /providers/nearby — new fields on every provider object
{
  "profileImageUrl": "https://...",      // was missing entirely before
  "galleryUrls": ["https://...", "..."], // detail-page photo gallery
  "certifications": [
    { "id": "...", "title": "Indian Canine Training", "issuedBy": "...", "issuedYear": 2022 }
  ],
  "successRatePercent": 96,              // the "98% Success Rate" stat
  "contactPhone": "+91911...",           // new — see item 9
  "startingPrice": 499                   // new — see item 7
}
```

## 2. Dog walker detail page doesn't match the app UI

Same root cause as #1 — `profileImageUrl`, `certifications`, `successRatePercent` now exist. Combine with existing `experienceYears`, `description`, `workingHours` (→ "Available Days"), `rating` to build the screen. There's still no per-provider "About Walker" copy beyond `description` — reuse that field.

## 3. `PATCH /lost-and-found/:id/resolve` → 403 FORBIDDEN

**Not a bug.** Only the original reporter (or a `SUPER_ADMIN` token) can resolve a lost-and-found post — that's intentional so a stranger can't close someone else's report. The Postman request in the screenshot used a token for a different user than the one who created that post.

For the specific post in the screenshot (`6a8bc5c2202604c1598e1408`, "Tommy"), the reporter is seed user **Ananya**. Log in as one of these via `POST /auth/login` (`{ "identifier": "<email>", "password": "<password>" }`) and use the returned `accessToken` as the Bearer token:

| Who | Email | Password | Works on this post? |
|---|---|---|---|
| Reporter (Ananya) | `ananya.s@seed.patmypets.in` | `Passw0rd!` | ✅ |
| Super admin | `admin@seed.patmypets.in` | `Admin@12345` | ✅ (any post) |
| Any other seeded user (Priya, Rahul) | — | — | ❌ 403, by design |

Same rule applies to `DELETE /lost-and-found/:id` — reporter or admin only.

## 4. Token expiring too fast

`JWT_ACCESS_TTL` was `15m`. Bumped to `30d` (same as the refresh token). Practically no more mid-session expiry. True "never expires until logout" isn't possible with a stateless JWT — logout still works via the existing refresh/session flow, it just won't be forced by the access token dying first anymore.

## 5. Images not loading anywhere

Root cause: every seeded image URL pointed at `https://cdn.petmypet.in/...` — a domain that was never actually stood up, so every image request 404'd/failed to resolve. Replaced with real, always-reachable placeholder photos (`picsum.photos`) across providers, products, lost-and-found, and the banner. **These are stand-in photos, not final brand assets** — swap them for real uploaded images once the app has a real image upload/CDN pipeline (`/uploads` endpoint already exists for that).

## 6. Breed API

New endpoint:

```
GET /breeds?species=DOG
GET /breeds?species=CAT
```

Returns a plain string array, e.g. `["Labrador Retriever", "Golden Retriever", ...]` for DOG, a separate list for CAT (and BIRD/RABBIT/FISH/OTHER). Wire the "Select Breed" screen's dropdown to this instead of a hardcoded list.

### `/pet-companion/discover` returning no data

Discover needs: (1) your own pet's `petId`, (2) `lat`/`lng` near a seeded address, (3) other users nearby with `companionProfile.isEnabled: true` on one of their pets. The seed data already has this (Bruno/Luna near Koramangala, Bangalore) — if it's still empty on the live server it means that environment was never fully reseeded (see deploy note).

## 7. Nearby-provider cards missing price

Provider has no price of its own — price lives on `Service`. Added `startingPrice` (cheapest active service price for that provider, or `null` if none) to every provider object in `GET /providers/nearby` and `GET /providers/:id`.

## 8. Banner needs title, subtitle, image

`Banner` only had `title`/`imageUrl`. Added `subtitle`:

```
GET /banners
```

```jsonc
{ "title": "Grooming at Home — Book Now", "subtitle": "Certified groomers, right at your doorstep", "imageUrl": "https://..." }
```

## 9. `/providers/nearby?providerType=PET_WALKER` missing image; provider-by-id missing price/image, experience showing 4, phone missing

- Image: fixed by #1/#5 (`profileImageUrl`).
- Price: fixed by #7 (`startingPrice`).
- Phone: added `contactPhone` (pulled from the provider's linked user account) to every provider object.
- Experience "showing 4": that's `experienceYears` as seeded — not a bug, just re-seed with the values you want (seed script is source of truth for dev/staging data).

`/providers/nearby?providerType=TRAINER` image: same fix as above.

## 10. Training-goal filter on trainer search; provider detail page redesign

New query param:

```
GET /providers/nearby?providerType=TRAINER&trainingGoal=PUPPY_TRAINING
```

Filters to trainers who have a training plan tagged with that goal. Trainer plans now carry a `goals` array:

```jsonc
"metadata": { "trainer": { "trainingPlans": [
  { "name": "Popular Package", "price": 3999, "durationDays": 30, "goals": ["PUPPY_TRAINING", "BASIC_OBEDIENCE"] }
] } }
```

Send whatever goal keys the UI's goal-selector chips use (e.g. `BASIC_OBEDIENCE`, `POTTY_TRAINING`, `BEHAVIOR_CORRECTION`, `PUPPY_TRAINING`, `ADVANCED_COMMANDS`) — they're free-text strings, not a fixed enum, so no backend change is needed to add more.

For the provider-detail screen redesign in the Figma mock: the fields to build it now all exist (`profileImageUrl`, `certifications`, `successRatePercent`, `rating`, `workingHours`, `metadata.trainer.trainingPlans`) — but I don't have Figma access to match it pixel-for-pixel. Share the Figma link if there's a specific data shape still missing and I'll add it.

## 11. `providerType=BOARDING` nearby missing image/price; provider-by-id design

Covered by #1/#5/#7 — `profileImageUrl` and `startingPrice` now present for every provider type including BOARDING.

## 12. VET nearby — image/price + clinic vs online filter; `/products` images

New query param on `/providers/nearby`:

```
GET /providers/nearby?providerType=VET&consultationMode=ONLINE   // vets with video consultation
GET /providers/nearby?providerType=VET&consultationMode=CLINIC   // in-person only
GET /providers/nearby?providerType=VET                           // both (unfiltered, as before)
```

Backed by the existing `metadata.vet.supportsVideoConsultation` flag.

`/products` images: same root cause as #5 (dead `cdn.petmypet.in` domain) — fixed in seed data.

---

## Deploy note

All of the above are code + seed-script changes. To see them on `http://dxz8l4rvj5ckw3p10k6hwdf9.187.127.210.144.sslip.io`:

1. Deploy this branch to that server.
2. Re-run the seed script against that server's database (`npm run seed` — it's idempotent per environment: it no-ops if "Bangalore" already exists as a city, so a fresh reseed needs that city, and its dependents, cleared first).

I haven't done either of those against the live server myself — say the word and I will, since it touches a shared environment.
