# Frontend Handoff — Real-Time Chat (Socket.io)

**Audience:** User app + Vendor app chat screens
**Backend status:** implemented & tested. Transport: **Socket.io** (same host/port as the REST API).

> The backend already persists each message **before** broadcasting it, so socket delivery and the
> REST history can never disagree. The frontend work is reqs 3 & 4: connect, join the room, render
> incoming events, and sync on reconnect.

---

## 1. Connect (authenticated handshake)

Pass the JWT access token in the handshake `auth` (not a header). Same token as the REST API; a
logged-out/expired session is rejected.

```js
import { io } from 'socket.io-client';

const socket = io(API_ORIGIN, {
  auth: { token: accessToken },
  transports: ['websocket'],
});

socket.on('connect_error', (err) => {
  // err.message: 'Missing authentication token' | 'Invalid or expired authentication token'
  //            | 'Session is no longer valid, please log in again'
});
```

On connect the server auto-joins the socket to a private `user:<id>` room, so a user receives
messages for any of their conversations even before opening a specific room.

---

## 2. Events

There are two interchangeable event vocabularies over the **same** backend — use the snake_case set
(recommended for new work); the `chat:*` set is the legacy owner-app contract.

### Client → server

| Action | Recommended | Legacy | Payload |
|---|---|---|---|
| Join a conversation | `join_room` | `chat:join` | `{ room_id }` *(legacy: `{ roomId }`)* |
| Leave a conversation | `leave_room` | — | `{ room_id }` |
| Send a message | `send_message` | `chat:message` | `{ room_id, temp_id?, message, media_url? }` |
| Typing start/stop | `typing_start` / `typing_stop` | `chat:typing` | `{ room_id }` |
| Mark read | `mark_read` | `chat:read` | `{ room_id }` |

`send_message` supports an **ack callback** and a `temp_id` for optimistic UI (see §3).
Joining is authorized: you can only join a room you're a participant of (others are silently rejected).

### Server → client

| Event | When | Payload |
|---|---|---|
| `new_message` | a message is sent to a room you're in | see below |
| `message_ack` | your own `send_message` was persisted | `{ temp_id, id, room_id, status: 'SENT' \| 'FAILED', created_at }` |
| `user_typing` | the other side is typing | `{ room_id, user_id, is_typing }` |
| `messages_read` | the other side read the room | `{ room_id, read_by, read_at }` |
| `user_status` | the other participant's presence | `{ user_id, is_online, last_seen }` |

**`new_message` payload:**
```json
{
  "id": "6724...e1",
  "room_id": "6724...a9",
  "sender_id": "6724...b3",
  "sender_role": "USER",          // "USER" | "VENDOR" | "ADMIN"
  "sender_name": "Ravi Kumar",
  "message": "On my way",
  "type": "TEXT",                 // "TEXT" | "IMAGE"
  "media_url": null,
  "status": "DELIVERED",          // "DELIVERED" | "SEEN"
  "created_at": "2026-10-30T12:00:00.000Z"
}
```

Every payload carries a unique `id`, `created_at` timestamp, `sender_id`, and **`sender_role`**, so
you can render alignment/labels (me vs. them, user vs. vendor) without extra lookups.

> Legacy `chat:*` clients receive `chat:message` instead of `new_message`, with camelCase keys
> (`id`, `roomId`, `senderId`, `senderRole`, `text`, `imageUrl`, `isRead`, `createdAt`).

---

## 3. Recommended chat-screen lifecycle (reqs 3 & 4)

```js
useEffect(() => {
  socket.emit('join_room', { room_id: roomId });

  const onNew = (msg) => {
    if (msg.room_id !== roomId) return;        // ignore other rooms
    appendMessage(msg);                        // add to local state
    scrollToBottomIfNearBottom();              // don't yank the view if scrolled up
    socket.emit('mark_read', { room_id: roomId });
  };
  const onAck = (ack) => reconcileOptimistic(ack.temp_id, ack); // 'sending' → 'sent'/'failed'
  const onTyping = (t) => setPeerTyping(t.is_typing);

  socket.on('new_message', onNew);
  socket.on('message_ack', onAck);
  socket.on('user_typing', onTyping);

  return () => {                               // cleanup — prevents dupes / leaks
    socket.emit('leave_room', { room_id: roomId });
    socket.off('new_message', onNew);
    socket.off('message_ack', onAck);
    socket.off('user_typing', onTyping);
  };
}, [roomId]);
```

**Optimistic send:** render immediately with a local `temp_id` in `sending` state; on `message_ack`
(or the ack callback) match `temp_id` and flip to `sent` (`status: 'SENT'`) or `failed`.

```js
const temp_id = crypto.randomUUID();
addOptimistic({ temp_id, message: text, status: 'sending' });
socket.emit('send_message', { room_id: roomId, temp_id, message: text }, (ack) => {
  reconcileOptimistic(temp_id, ack); // ack.status: 'SENT' | 'FAILED'
});
```

**De-dupe:** since your optimistic message and the broadcast both arrive, key messages by server
`id` and drop any `new_message` whose `id` you already have (match the pending `temp_id` on ack).

---

## 4. Reconnection & resilience (req 4)

- Socket.io auto-reconnects. On `reconnect`, **re-join the room** and **sync missing history** via REST
  rather than trusting you caught every event:
  - Cursor: `GET /api/v1/chat/rooms/:roomId/messages?before=<oldestMessageId>` (older page)
  - Newest-first page: `GET /api/v1/chat/rooms/:roomId/messages?limit=50`
  - (Provider app: `GET /api/v1/message/:room_id/history?page=&limit=`)
  Fetch the latest page and merge by `id` to fill any gap since the last received message.
- Show a connection banner driven by `connect` / `disconnect` / `connect_error`.
- `user_status` gives presence (online / last seen) for the other participant.

---

## 5. Notes

- Messages are persisted before broadcast, so a reload via the REST history always matches what was
  shown live.
- Sending into a blocked room is rejected (the send fails / `message_ack` → `FAILED`).
- Presence is in-process (single container today); it still works, just not cross-node until the
  backend adds the Redis adapter.
