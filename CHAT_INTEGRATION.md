# Chat — integration flow

1:1 chat between a user and a provider (optionally tied to a booking). REST for room/message CRUD + history; socket.io for live delivery. All REST routes below require `Authorization: Bearer <accessToken>`; all are under `/api/v1`.

## 1. Open (or create) a room

```
POST /chat/rooms
{ "participantId": "<other user's userId>", "bookingId": "<optional>" }
```
→ `201`, existing room reused if one already exists between the two participants (safe to call every time the user taps "Chat" — no dedupe needed client-side).

```jsonc
{
  "id": "...",
  "otherParticipantId": "...",
  "bookingId": "..." | null,
  "lastMessageAt": "2026-09-05T..." | null,
  "lastMessagePreview": "",
  "isUrgent": false,
  "unreadCount": 0
}
```

## 2. List rooms (inbox screen)

```
GET /chat/rooms?page=1&limit=20
GET /chat/rooms?isUrgent=true          // "Emergency" filter pill
```
Same room DTO as above, paginated. Sort is by `lastMessageAt` desc server-side.

## 3. Open a room — load history

```
GET /chat/rooms/{roomId}/messages?limit=50
GET /chat/rooms/{roomId}/messages?limit=50&before={messageId}   // pagination, older page
```
→ oldest-first array:
```jsonc
[{ "id": "...", "roomId": "...", "senderId": "...", "text": "...", "imageUrl": "..." | null, "isRead": false, "createdAt": "..." }]
```
403 if the caller isn't one of the room's two participants.

## 4. Connect the socket (do this once the room screen — or the inbox, for live badges — is open)

```js
import { io } from 'socket.io-client';
const socket = io(BASE_URL, { auth: { token: accessToken } }); // BASE_URL = server root, not /api/v1
```

Rejected at handshake if the token is missing/invalid/expired — handle the socket `connect_error` event.

## 5. Send a message — REST or socket, pick one

**REST** (works even if the socket is disconnected):
```
POST /chat/rooms/{roomId}/messages
{ "text": "hello" }              // or
{ "imageUrl": "https://..." }    // or both; at least one required
```
→ `201` with the message DTO. Server also emits it over the socket to the room + the other participant, so don't also emit it yourself — REST already fans it out.

**Socket** (lower latency, no need to wait for an HTTP round trip):
```js
socket.emit('chat:message', { roomId, text: 'hello', imageUrl: undefined });
```
Fire-and-forget — persisted server-side, then broadcast back to the room (including your own other tabs/devices) as `chat:message`. There's no ack; if you need certainty the message landed, use the REST call instead.

## 6. Receive messages live

```js
socket.emit('chat:join', { roomId });          // once, when the room screen opens

socket.on('chat:message', (message) => { /* same shape as the REST message DTO */ });
socket.on('chat:typing', ({ roomId, userId }) => { /* show "typing…" */ });
socket.on('chat:read', ({ roomId, readerId }) => { /* grey out your own sent ticks */ });
```

Every connected socket auto-joins `user:{yourUserId}` — so `chat:message` for a room you haven't explicitly `chat:join`'d still reaches you for inbox-level "new message" badges. `chat:join` is only needed to also receive **typing** events for that room (those are room-scoped, not user-scoped).

To show your own typing indicator to the other side:
```js
socket.emit('chat:typing', { roomId });
```

## 7. Mark read

```
PATCH /chat/rooms/{roomId}/read
```
Marks every message in the room not sent by you as read, and emits `chat:read` to the room so the sender's UI updates. Call this when the room screen is opened/foregrounded, not on every message.

## 8. Emergency / urgent flag

```
PATCH /chat/rooms/{roomId}/urgent
{ "isUrgent": true }
```
Toggles the flag used by the `GET /chat/rooms?isUrgent=true` inbox filter — either participant can set/unset it.

## Gotchas

- Room list `unreadCount` and the message DTO's `isRead` are two different things — `unreadCount` is precomputed per room for the inbox badge; don't try to derive it by counting messages client-side.
- `imageUrl` upload itself isn't part of this module — upload the file wherever the rest of the app uploads images, then send the resulting URL in `imageUrl`.
- No group chat, no message edit/delete — 1:1 only, matching `participantIds` always being exactly 2.
