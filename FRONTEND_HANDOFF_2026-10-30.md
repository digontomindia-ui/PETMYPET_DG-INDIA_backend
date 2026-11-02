# Frontend Handoff — 2026-10-30

Two backend features shipped today. This single doc is everything the frontend team needs for both.
Base URL: `/api/v1`. Backend is implemented & tested.

**Contents**
1. [Vendor Approval & Management](#1-vendor-approval--management) (Admin dashboard + Vendor app)
2. [Real-Time Chat](#2-real-time-chat-socketio) (User app + Vendor app)

---

# 1. Vendor Approval & Management

> "Vendor" = a `Provider` (user `role: SERVICE_PROVIDER`). Approval is tracked by the provider's
> **`kycStatus`**: `PENDING` → `APPROVED` / `REJECTED`. Suspension and deletion are separate states.
> A new vendor is always created `PENDING`.

## 1.1 Lifecycle & states

| State | How it's represented | Can log in? | Dashboard access? |
|---|---|---|---|
| Pending | `kycStatus: PENDING` | ✅ (to finish onboarding) | ❌ (403, "under review") |
| Approved | `kycStatus: APPROVED` | ✅ | ✅ |
| Rejected | `kycStatus: REJECTED` + `kycRejectionReason` | ✅ (to re-submit docs) | ❌ (403, shows reason) |
| Suspended | `isActive: false` + `suspendedByAdmin: true` | ❌ (403) | ❌; existing tokens revoked |
| Deleted | `isDeleted: true` (soft delete) | ❌ (403) | ❌; existing tokens revoked |

## 1.2 Admin dashboard — Vendor Management (SUPER_ADMIN token required)

### List vendors (status tabs)
`GET /api/v1/admin/providers`

| Tab | Query |
|---|---|
| Pending Approval | `?kycStatus=PENDING` |
| Approved Vendors | `?kycStatus=APPROVED` |
| All | *(omit `kycStatus`)* |

Other params: `providerType`, `isActive` (`"true"`/`"false"`), `search` (business name contains),
`page`, `limit`. Deleted vendors never appear.

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
Table mapping: `businessName` = Store Name, `ownerName`/`ownerEmail` = Name/Email,
`createdAt` = Registration Date.

Full detail (KYC docs, masked bank, booking/earnings stats): `GET /api/v1/admin/providers/:id`.

### Action buttons

| Button | Request | Body |
|---|---|---|
| **Approve** | `PATCH /api/v1/providers/:id/kyc/approve` | — |
| **Reject** | `PATCH /api/v1/providers/:id/kyc/reject` | `{ "reason": "Document unreadable" }` |
| **Suspend** | `PATCH /api/v1/admin/providers/:id/status` | `{ "isActive": false, "reason": "Complaints" }` |
| **Reactivate** | `PATCH /api/v1/admin/providers/:id/status` | `{ "isActive": true }` |
| **Delete** | `DELETE /api/v1/admin/providers/:id` | — |

- **Delete** needs a confirmation modal ("Access will be permanently revoked"). Success:
  `{ "success": true, "message": "Vendor account deleted", "data": null }`; `404` if already deleted.
- Toast on success/failure; **re-fetch the current tab** after any action.
- Suspend/Delete immediately revoke the vendor's active sessions.

## 1.3 Vendor app — status feedback

- **Login:** `POST /api/v1/signin-signup` → `POST /api/v1/verify-otp`. Verify returns
  `{ token, isDocumentSubmited, isDocumentApproved }` — route to dashboard vs. "under review".
- **Non-approved** vendor hitting any dashboard route → **403**:
  ```json
  {
    "success": false,
    "error": "FORBIDDEN",
    "message": "Your account is pending admin approval. You will receive access once verified.",
    "details": { "kycStatus": "PENDING" }
  }
  ```
  Branch the status screen on `details.kycStatus` (`PENDING` → under review; `REJECTED` → show the
  message, which contains the rejection reason, + offer re-submit).
- **Suspended / deleted** → **403 at login** with a clear message; an already-logged-in vendor who
  gets suspended/deleted receives **401** on the next request → clear token, go to login.
- **Open regardless of approval** (so onboarding works): `/upload-documents`, `/profile`, `/profile/*`.

## 1.4 Naming notes (ticket vs. actual)
1. Ticket's `PATCH /admin/vendors/:id/status` (approve/reject) = `/providers/:id/kyc/approve` & `/kyc/reject`.
2. Ticket's `GET /admin/vendors` / `DELETE /admin/vendors/:id` = the `/admin/providers` paths above.
3. "Suspended" is not a `kycStatus` value — it's `isActive:false` + `suspendedByAdmin:true`.

---

# 2. Real-Time Chat (Socket.io)

> Messages are persisted **before** broadcast, so socket delivery and the REST history never
> disagree. Transport is Socket.io on the same host/port as the REST API.

## 2.1 Connect (authenticated handshake)
Pass the JWT access token in the handshake `auth` (not a header).

```js
import { io } from 'socket.io-client';

const socket = io(API_ORIGIN, {
  auth: { token: accessToken },
  transports: ['websocket'],
});

socket.on('connect_error', (err) => {
  // 'Missing authentication token' | 'Invalid or expired authentication token'
  // | 'Session is no longer valid, please log in again'
});
```
On connect, the server auto-joins a private `user:<id>` room (you receive messages for any of your
conversations even before opening a specific room).

## 2.2 Events (same backend, two vocabularies — prefer the snake_case set)

### Client → server
| Action | Recommended | Legacy | Payload |
|---|---|---|---|
| Join a conversation | `join_room` | `chat:join` | `{ room_id }` *(legacy: `{ roomId }`)* |
| Leave a conversation | `leave_room` | — | `{ room_id }` |
| Send a message | `send_message` | `chat:message` | `{ room_id, temp_id?, message, media_url? }` |
| Typing start/stop | `typing_start` / `typing_stop` | `chat:typing` | `{ room_id }` |
| Mark read | `mark_read` | `chat:read` | `{ room_id }` |

`send_message` supports an **ack callback** + `temp_id` for optimistic UI. Joining is authorized —
you can only join a room you participate in.

### Server → client
| Event | When | Payload |
|---|---|---|
| `new_message` | a message is sent to a room you're in | see below |
| `message_ack` | your `send_message` was persisted | `{ temp_id, id, room_id, status: 'SENT' \| 'FAILED', created_at }` |
| `user_typing` | other side is typing | `{ room_id, user_id, is_typing }` |
| `messages_read` | other side read the room | `{ room_id, read_by, read_at }` |
| `user_status` | other participant presence | `{ user_id, is_online, last_seen }` |

**`new_message` payload:**
```json
{
  "id": "6724...e1",
  "room_id": "6724...a9",
  "sender_id": "6724...b3",
  "sender_role": "USER",
  "sender_name": "Ravi Kumar",
  "message": "On my way",
  "type": "TEXT",
  "media_url": null,
  "status": "DELIVERED",
  "created_at": "2026-10-30T12:00:00.000Z"
}
```
Every payload carries `id`, `created_at`, `sender_id`, and **`sender_role`** (`USER` | `VENDOR` |
`ADMIN`) — enough to render alignment/labels without extra lookups.

> Legacy `chat:*` clients receive `chat:message` with camelCase keys (`id`, `roomId`, `senderId`,
> `senderRole`, `text`, `imageUrl`, `isRead`, `createdAt`).

## 2.3 Chat-screen lifecycle

```js
useEffect(() => {
  socket.emit('join_room', { room_id: roomId });

  const onNew = (msg) => {
    if (msg.room_id !== roomId) return;
    appendMessage(msg);
    scrollToBottomIfNearBottom();        // don't yank the view if scrolled up
    socket.emit('mark_read', { room_id: roomId });
  };
  const onAck = (ack) => reconcileOptimistic(ack.temp_id, ack);
  const onTyping = (t) => setPeerTyping(t.is_typing);

  socket.on('new_message', onNew);
  socket.on('message_ack', onAck);
  socket.on('user_typing', onTyping);

  return () => {                          // cleanup — prevents dupes / leaks
    socket.emit('leave_room', { room_id: roomId });
    socket.off('new_message', onNew);
    socket.off('message_ack', onAck);
    socket.off('user_typing', onTyping);
  };
}, [roomId]);
```

**Optimistic send:** render immediately with a local `temp_id` in `sending` state; on `message_ack`
(or the ack callback) flip to `sent` (`status: 'SENT'`) or `failed`.
```js
const temp_id = crypto.randomUUID();
addOptimistic({ temp_id, message: text, status: 'sending' });
socket.emit('send_message', { room_id: roomId, temp_id, message: text }, (ack) => {
  reconcileOptimistic(temp_id, ack); // ack.status: 'SENT' | 'FAILED'
});
```
**De-dupe:** key messages by server `id`; drop any `new_message` whose `id` you already have.

## 2.4 Reconnection & resilience
- Socket.io auto-reconnects. On `reconnect`, **re-join the room** and **sync history** via REST:
  - Older page (cursor): `GET /api/v1/chat/rooms/:roomId/messages?before=<oldestMessageId>`
  - Latest page: `GET /api/v1/chat/rooms/:roomId/messages?limit=50`
  - Provider app: `GET /api/v1/message/:room_id/history?page=&limit=`
  Fetch the latest page and merge by `id` to fill any gap.
- Connection banner from `connect` / `disconnect` / `connect_error`.
- Presence (online / last seen) via `user_status`.

## 2.5 Notes
- Reload via REST history always matches what was shown live (persist-before-broadcast).
- Sending into a blocked room fails (`message_ack` → `FAILED`).
- Presence is in-process (single container) — works today, cross-node later via the Redis adapter.
