# Backend changes — 2026-09-05

## Live Walk Tracker — real-time booking walk stats

New: live walk-tracking data on top of the existing booking flow, pushed over the same socket.io server chat already uses (no new server, no new port).

### 1. Connect

Same socket connection you already use for chat — same host, same auth:

```js
import { io } from 'socket.io-client';

const socket = io(BASE_URL, {
  auth: { token: accessToken }, // same JWT access token as REST calls
});
```

`BASE_URL` is the server root (same one you point `socket.io-client` at for chat — not the `/api/v1` REST prefix).

### 2. Join a booking's live room

On opening the Live Walk Tracker screen (for either the pet parent or the walker):

```js
socket.emit('walk:join', { bookingId });
```

Server checks you're either the booking's owner (`userId`) or the assigned provider before joining you to that booking's room — a stranger's `bookingId` guess joins nobody.

### 3. Events you receive

| Event | Payload | When |
|---|---|---|
| `walk:started` | `{ bookingId }` | Walker verifies the start OTP (`POST /bookings/:id/otp/start`) — booking status → `STARTED`. Switch the screen to "Walk In Progress". |
| `walk:update` | `{ bookingId, distanceMeters, durationSeconds, steps, calories, updatedAt }` | Every time the walker's app sends a tick (see below). This is what drives the live Distance/Duration/Steps/Calories tiles. |
| `walk:ended` | `{ bookingId, walkStats }` | Walker verifies the end OTP — booking status → `COMPLETED`. `walkStats` is the final snapshot; stop the timer. |

### 4. Event the walker's app sends

While the booking is `STARTED`, the **walker's** app pushes a tick every ~5–10s:

```js
socket.emit('walk:update', {
  bookingId,
  distanceMeters: 2800,
  durationSeconds: 2700,
  steps: 4125,
  calories: 182,
});
```

Rejected (silently, logged server-side) if the sender isn't that booking's provider, or the booking isn't `STARTED`. Only the walker app should ever emit this — the pet parent's app only listens.

### 5. Loading the screen fresh (REST)

`GET /bookings/:id` (already in use) now also returns:

```jsonc
{
  // ...existing booking fields...
  "walkStats": {
    "distanceMeters": 2800,
    "durationSeconds": 2700,
    "steps": 4125,
    "calories": 182,
    "updatedAt": "2026-09-05T15:40:00.000Z"
  } | null
}
```

Use this to paint the screen immediately on load (don't wait for the first socket tick), then let `walk:update` take over. `walkStats` resets to `null` at the start of every new walk.

**Progress % and target duration** aren't new fields — compute them from what the booking already has:
```
targetMinutes = (scheduledEnd - scheduledStart) / 60000
progressPercent = min(100, (walkStats.durationSeconds / 60) / targetMinutes * 100)
```

**Walker info** ("Sarah Johnson, Professional Dog Walker, 4.9") isn't new either — fetch it the same way you already do elsewhere: `GET /providers/:id` using the booking's `providerId`.

**Call Walker / Chat buttons** — Chat already works (`POST /chat/rooms` with the walker's `userId`, then the existing chat screen). "Call Walker" is a plain `tel:` link to the provider's phone number from `GET /providers/:id` — no in-app calling API.

### Full flow recap

```
1. Booking reaches STARTED (existing otp/start flow)
   → server emits walk:started to the booking:{id} room

2. Both apps: socket.emit('walk:join', { bookingId })
   Owner app: GET /bookings/:id → paint initial walkStats (likely null right after start)

3. Walker app, every ~5-10s while walking:
   socket.emit('walk:update', { bookingId, distanceMeters, durationSeconds, steps, calories })
   → server persists it on the booking, broadcasts walk:update to both apps

4. Booking reaches COMPLETED (existing otp/end flow)
   → server emits walk:ended with the final walkStats snapshot
```
