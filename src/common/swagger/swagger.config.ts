import swaggerJSDoc from 'swagger-jsdoc';
import { env, isProduction } from '../config/env.js';

const API_OVERVIEW_DESCRIPTION = `
Production REST API for Patmypets, a multi-service pet-care marketplace with
**two client apps** sharing this one backend:

- **End-user app** — pet owners book services, buy marketplace products, manage pets.
- **Service-provider app** — vets/groomers/walkers/trainers/etc. manage bookings, earnings, and their own profile.

See \`SCREEN_TO_API_GUIDE.md\` in the repo root for a screen-by-screen map of every UI screen to the exact endpoint(s) below.

## Master flow — how the sections below connect

\`\`\`
                                   ┌─────────────────────┐
                                   │   Auth (phone+OTP)   │
                                   │  self-registering    │
                                   └──────────┬───────────┘
                                              │ tokens issued
                       ┌──────────────────────┼───────────────────────┐
                       │                      │                       │
                new USER account      new SERVICE_PROVIDER      returning user/provider
                       │                account                       │
                       ▼                      ▼                       ▼
              Users → Pets            Providers (KYC →           Home / Dashboard
              (onboarding)             admin approve)            (role-specific)
                       │                      │
                       ▼                      ▼
         ┌─────────────────────┐   ┌──────────────────────┐
         │ Categories/Services │   │ Availability (slots)  │
         │ Providers (browse)  │──▶│ minus unavailable-dates│
         └─────────────────────┘   └───────────┬───────────┘
                                                │
                                                ▼
                                    Bookings (create → accept →
                                    on-the-way → OTP-start →
                                    notes/photos → OTP-end →
                                    completed) ──▶ Payments / Wallet
                                                │
                                                ▼
                                     Reviews, Referrals, Chat

  Marketplace (Products → Cart → Coupon → Orders) is a parallel track that
  only touches Wallet at checkout — it never goes through Bookings.

  Pet Companion, Pet Taxi, Pet Relocation, Pet Insurance, Lost & Found are
  self-contained side flows off the Pets/Users modules — see their own
  section descriptions below for each one's diagram.
\`\`\`

## Response envelope

Every success response: \`{ success: true, message, data, meta? }\` (\`meta\` on
list endpoints only: \`{page, limit, total, totalPages}\`). Every error:
\`{ success: false, error: "CODE", message }\`. Always check \`success\`, not
just HTTP status.

## Auth model

\`Authorization: Bearer <accessToken>\`, issued by the \`Auth\` section below.
Three roles share one system: \`USER\`, \`SERVICE_PROVIDER\`, \`SUPER_ADMIN\` — a
service provider is a \`USER\`-role account that has *also* created a separate
\`Provider\` business profile (see the **Providers** section).
`;

const swaggerDefinition: swaggerJSDoc.OAS3Definition = {
  openapi: '3.0.3',
  info: {
    title: `${env.APP_NAME} API`,
    version: '1.0.0',
    description: API_OVERVIEW_DESCRIPTION,
  },
  servers: [{ url: `/api/${env.API_VERSION}` }],
  tags: [
    {
      name: 'Auth',
      description: `
**Primary flow (both apps) — phone + OTP, self-registering:**

\`\`\`
LogIn screen (phone number only)
        │
        ▼
POST /auth/login/otp/request {identifier, referralCode?, role?}
        │  no account yet? one is auto-created here (phone only)
        │  returns { isRegistered }
        ▼
LogIn OTP screen
        │
        ▼
POST /auth/login/otp/verify {identifier, code}  ──▶  { user, tokens }
        │
        ├── isRegistered:false ──▶ onboarding (Users → Pets → Preferences)
        └── isRegistered:true  ──▶ Home / Dashboard
\`\`\`

**Secondary flow** — email/phone + password (the provider app's "Login with
Password" option, or any account that has explicitly set a password):
\`POST /auth/signup\` → \`POST /auth/signup/verify\` (new account), or
\`POST /auth/login {identifier, password}\` (existing). \`400\` if the account
is phone-only with no password set — fall back to the OTP flow above.

**Session management:** \`POST /auth/refresh\` rotates the token pair (access
token expires in 15m); \`POST /auth/logout\` / \`/logout-all\` revoke sessions;
\`POST /auth/forgot-password\` → \`/auth/reset-password\` for account recovery.
`,
    },
    {
      name: 'Users',
      description:
        'Profile (name, email, avatar, service-interest tags, emergency contact), saved addresses, notification preferences, push-notification device tokens. Admin: list/search/block/delete any user.',
    },
    {
      name: 'Pets',
      description:
        'A pet owner\'s pets: profile, medical records, vaccinations, and the optional Pet Companion social profile (`PUT /pets/{id}/companion-profile`) that feeds the **PetCompanion** section below.',
    },
    {
      name: 'Providers',
      description: `
\`\`\`
POST /providers/me (create business profile)
        │  kycStatus: PENDING
        ▼
POST /providers/me/kyc-documents  (repeat per document)
        │
        ▼
Admin: GET /providers/pending-kyc → PATCH /providers/{id}/kyc/approve|reject
        │
        ▼
PATCH /providers/me/active {isActive}  ──▶  now bookable via Providers/nearby
\`\`\`

Also: bank account (masked on read), attendance check-in/out, holiday/
blocked dates (\`unavailable-dates\`, excluded from **Availability** slots),
and self-serve performance analytics (\`GET /providers/me/analytics\`).
`,
    },
    {
      name: 'Categories',
      description: 'Service-provider category taxonomy (Grooming, Veterinary, etc.) used to classify Providers/Services. Admin write, public read.',
    },
    {
      name: 'Services',
      description:
        'A Service IS the "package" shown in the app (price, optional struck-through `originalPrice`, duration, `addOnCatalog`), scoped to one provider + category. Booked via the **Bookings** section.',
    },
    {
      name: 'Availability',
      description:
        'Computes bookable time slots for a provider+service+date from the provider\'s weekly `workingHours`, minus already-booked windows and any date the provider has marked unavailable (see **Providers**).',
    },
    {
      name: 'Bookings',
      description: `
The core service lifecycle, shared by every vertical (grooming, boarding,
walking, consultation, training):

\`\`\`
POST /bookings {providerId, serviceId, petId?, scheduledStart, addOns?,
                 durationDays?, consultationMode?, couponCode?}
        │  status: PENDING, OTPs generated
        ▼
PATCH /bookings/{id}/accept          (provider)
        ▼
PATCH /bookings/{id}/on-the-way      (provider, optional)
        ▼
POST /bookings/{id}/otp/start {code} (provider verifies customer's code)
        │  status: STARTED — provider can now log session data:
        │    PATCH /bookings/{id}/notes   (special instructions)
        │    POST  /bookings/{id}/photos  (before/after)
        ▼
POST /bookings/{id}/otp/end {code}   (provider verifies completion code)
        │  status: COMPLETED, payout computed
        ▼
POST /reviews {bookingId, rating, comment}   (customer)
\`\`\`

Either party can \`PATCH /bookings/{id}/cancel\` while still pending/active.
\`GET /bookings/me\` and \`/bookings/provider/me\` accept a comma-separated
\`status\` list (e.g. \`PENDING,ACCEPTED,ON_THE_WAY,STARTED\` for an "Upcoming"
bucket) and \`from\`/\`to\` date-range filters.
`,
    },
    {
      name: 'Payments',
      description:
        'Razorpay order creation for a booking (`POST /payments/bookings/{id}/order`), the payment-gateway webhook, cash-on-delivery/cash-collected marking, and admin refunds. Wallet-based booking payments skip Razorpay entirely (see **Wallet**).',
    },
    {
      name: 'Wallet',
      description:
        'Balance + transaction ledger, used as a payment method for both Bookings and Marketplace Orders. Self-serve top-up (`POST /wallet/me/topup`) creates a Razorpay order the same way a booking payment does; credited on webhook capture. Admin can manually adjust any user\'s balance.',
    },
    {
      name: 'Coupons',
      description:
        'Admin-managed discount codes. `POST /coupons/validate` checks eligibility + computes the discount without consuming it; actually applying one happens inside `POST /bookings` (via `couponCode`) or `POST /cart/apply-coupon` (Marketplace).',
    },
    {
      name: 'Reviews',
      description:
        'One review per completed booking (`bookingId`) OR one per purchased product (`productId`) — exactly one of the two, never both. `GET /reviews` filters by `providerId` or `productId`.',
    },
    {
      name: 'Products',
      description:
        'Marketplace product catalog (pharmacy/food/accessories/etc). `mrp` + computed `discountPercent` power the struck-through-price UI. Feeds into **Cart**, **Wishlist**, and **Orders**.',
    },
    {
      name: 'Cart',
      description: `
\`\`\`
POST /cart/items {productId, quantity}   (repeat per product)
        ▼
POST /cart/apply-coupon {code}   (optional — validates + stores the discount)
        │  GET /cart returns {items, subtotal, discountAmount, deliveryFee, totalAmount}
        ▼
POST /orders {shippingAddress, paymentMethod}   ──▶  see Orders
\`\`\`
Editing cart contents (add/update/remove) automatically clears an applied
coupon — re-apply after changing quantities.
`,
    },
    {
      name: 'Orders',
      description:
        'Created from the current cart (`POST /orders`) — carries over the cart\'s coupon discount and adds a flat delivery fee. Admin transitions status `PENDING → CONFIRMED → SHIPPED → DELIVERED` (or `CANCELLED`, which restocks and refunds).',
    },
    {
      name: 'Wishlist',
      description: 'Saved-for-later product list, independent of the cart.',
    },
    {
      name: 'Chat',
      description:
        '1:1 messaging between any two users (customer↔provider, or matched Pet Companion owners). Rooms can be flagged `isUrgent` for a provider-app "Emergency" inbox filter. Real-time delivery also available over Socket.IO for connected clients.',
    },
    {
      name: 'Notifications',
      description: 'Server-generated notification feed (booking status changes, payments, KYC, new messages). Read-only from the client\'s side — nothing here is client-created.',
    },
    {
      name: 'LostAndFound',
      description: `
\`\`\`
POST /lost-and-found {type: LOST|FOUND, ..., rewardAmount?}
        │  approvalStatus: PENDING
        ▼
Admin: PATCH /lost-and-found/{id}/approve|reject
        │
        ▼
GET /lost-and-found  (public feed, approved only)
        ▼
PATCH /lost-and-found/{id}/resolve   (reporter or admin, once found/returned)
\`\`\`
`,
    },
    {
      name: 'PetCompanion',
      description: `
Opt-in pet "social" matching, layered on top of a **Pets** record:

\`\`\`
PUT /pets/{id}/companion-profile {isEnabled: true, ...}
        ▼
GET /pet-companion/discover?petId=&lat=&lng=   (swipe feed, geo-based)
        ▼
POST /pet-companion/swipe {swiperPetId, targetPetId, action}
        │
        ├── mutual LIKE ──▶ { matched: true, chatRoomId } ──▶ see Chat
        └── one-sided     ──▶ shows up in the other pet's
                               GET /pet-companion/likes-received
\`\`\`
`,
    },
    {
      name: 'PetTaxi',
      description:
        'Simple fixed-price trip booking (`POST /pet-taxi/bookings`) — price resolved server-side from trip type (one-way/round-trip), never client-supplied.',
    },
    {
      name: 'PetRelocation',
      description:
        'A **lead**, not an instant booking — `POST /pet-relocation/requests` starts `SUBMITTED`; ops manually progresses it through `CONTACTED → CONFIRMED` via the admin status endpoint. No payment step.',
    },
    {
      name: 'PetInsurance',
      description:
        'Insurance application intake (`POST /pet-insurance/applications`) with conditional medical-history document uploads; admin reviews and moves it through `UNDER_REVIEW → APPROVED/REJECTED`.',
    },
    {
      name: 'Referrals',
      description:
        'Each user gets a lazily-generated referral code (`GET /referrals/me`). A new signup with a valid `referralCode` is tracked as `PENDING`, then rewarded (both sides) once the referee completes their first booking. `POST /referrals/redeem` converts earned points to wallet balance.',
    },
    {
      name: 'Support',
      description:
        'Support tickets with a threaded message history (`POST /support-tickets/{id}/messages`). Status changes (`OPEN → IN_PROGRESS → RESOLVED/CLOSED`) are admin-only.',
    },
    {
      name: 'Blogs',
      description: 'Simple CMS for pet-care articles. Admin write, public read (published posts only).',
    },
    {
      name: 'Zones',
      description: 'Cities and geo-zones used to scope providers/pricing. Admin write, public read.',
    },
    {
      name: 'Cities',
      description: 'See **Zones** — cities and zones are managed together as one geography module.',
    },
    {
      name: 'Search',
      description: 'Cross-entity search (providers, services, products, etc.) plus autocomplete suggestions.',
    },
    {
      name: 'Analytics',
      description: 'Platform-wide dashboards for SUPER_ADMIN (revenue, bookings, user growth, zone performance). A provider\'s own performance data is separate — see **Providers**\' `/me/analytics`.',
    },
    {
      name: 'Admin',
      description: 'Platform operations: dashboard summary, feature flags, banners, and audit log of admin actions (KYC decisions, order status changes, etc.).',
    },
    {
      name: 'Uploads',
      description:
        'Generic Cloudinary-backed file upload, used as a first step by many other flows (KYC documents, pet photos, lost-and-found photos, chat attachments, booking session photos) — upload here first, then pass the returned URL into the relevant endpoint.',
    },
    {
      name: 'Community',
      description: 'Social feed: posts, comments, likes, bookmarks, and moderation/reporting.',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'BAD_REQUEST' },
          message: { type: 'string', example: 'Detail of what went wrong' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const sourceRoot = isProduction ? './dist/modules' : './src/modules';

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: [
    `${sourceRoot}/**/*.routes.${isProduction ? 'js' : 'ts'}`,
    `${sourceRoot}/**/*.docs.${isProduction ? 'js' : 'ts'}`,
  ],
});
