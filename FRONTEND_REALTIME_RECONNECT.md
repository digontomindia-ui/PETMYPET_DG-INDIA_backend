# Real-Time Chat — "works for a while, then stops" fix

**Symptom:** after a deploy chat works, then after some minutes it silently stops delivering
messages (the socket still looks "connected").

## Why

Mobile networks and the reverse proxy drop idle WebSocket connections periodically. Socket.io
auto-reconnects, **but a reconnected socket is a fresh connection that is no longer in the chat
room** — so messages stop arriving even though the socket is connected. That's the "stops after a
while" behaviour.

## Backend change (shipped)

Enabled Socket.io **connection state recovery** + more tolerant ping timeouts. For a brief drop
(up to 2 minutes) the server now **restores the socket's rooms and replays the messages it missed**,
so chat keeps working through short blips with no client action. (Requires `socket.io-client` ≥ 4.6.)

## App change (required for longer drops)

Recovery only covers short drops. For anything longer, the reconnected socket starts fresh, so the
app **must re-join the active room on every (re)connect**. The `connect` event fires on the first
connection *and* every reconnection — re-join there:

```js
const socket = io(API_ORIGIN, { auth: { token: accessToken } }); // reconnection is on by default

socket.on('connect', () => {
  // Runs on first connect AND every reconnect.
  if (activeRoomId) {
    socket.emit('join_room', { room_id: activeRoomId });
    // socket.recovered === false means it was NOT a seamless recovery, so also backfill:
    if (!socket.recovered) {
      // re-fetch recent messages via REST so nothing is missed during the gap
      // GET /api/v1/chat/rooms/:roomId/messages?limit=50   (merge by message id)
    }
  }
});

socket.io.on('reconnect', () => { /* optional: show "reconnected" */ });
socket.on('disconnect', (reason) => { /* optional: show "reconnecting…" */ });
```

Key points:
- **Always re-emit `join_room` in the `connect` handler**, not just once on mount.
- On reconnect where `socket.recovered` is `false`, **re-fetch recent messages over REST** and merge
  by message `id` to fill any gap.
- Keep `reconnection: true` (the default) — don't disable it.
- Don't create a new socket per screen; reuse one and re-join rooms.

## Also check (infra)

Make sure the Coolify/Traefik route for the backend **forwards WebSocket upgrades** (it does for the
normal HTTP service). If WebSockets are blocked, Socket.io falls back to long-polling, which is far
more likely to go stale — confirm the client actually connects over `websocket` transport.
