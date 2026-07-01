# Roommate "Connect" Feature — Design Spec

Status: **approved, ready for implementation.**

## Problem

The "connect" button on roommate cards (`RoommateCard.jsx`, `RoommateProfileModal.jsx`) is
currently a pure UI stub — clicking it just fires a success toast via `handleConnect` in
`Roommates.jsx`. No request is created, nothing persists, and the other person never sees
anything. There is no way to know whether the person you tried to connect with has
responded.

## Goal

A real connect-request flow: Student A clicks "connect" on Student B's card, a request is
created, Student B can see and respond to it (accept/decline), and Student A can see the
outcome reflected on B's card.

## Non-goals

- No message/text attached to a connect request (plain request only, per user decision).
- No notification bell/inbox, no real-time push (`socket.io` is an installed but unwired
  dependency — out of scope here; status is fetched on page load/refresh, not pushed live).
- No re-request after a decline — one request per pair of users, ever (matches the existing
  one-review-per-user-per-building pattern in `reviewController.js`).

## Data model

New file `server/Models/ConnectionRequest.js`:

```js
{
  requester: { type: ObjectId, ref: "User", required: true },
  recipient: { type: ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
  timestamps: true,
}
```

Uniqueness (one request per pair, either direction) is enforced in the controller — check
both `{requester:A, recipient:B}` and `{requester:B, recipient:A}` before creating, reject
with 409 if either exists. No DB-level compound unique index needed for v1 (all writes go
through one controller function).

## API surface

New `server/Controllers/connectionController.js` + `server/Routes/connectionRoutes.js`,
mounted at `/api/connections` (all routes behind `protect` middleware):

- `POST /api/connections` — body `{ recipientId }`. Validates: not a self-request; recipient
  has an active `RoommateProfile` (status `"looking"`); no existing request between the two
  users in either direction. Creates a `pending` request.
- `GET /api/connections/incoming` — pending requests where `req.user` is the recipient,
  populated with the requester's `name`/`avatar` and their `RoommateProfile` (for display in
  the Requests panel).
- `PATCH /api/connections/:id` — body `{ action: "accept" | "decline" }`. Recipient-only
  (403 if `req.user` isn't the request's `recipient`). Updates `status`.

Existing `roommateController.js` changes: `getMatches` (and the browse-all listing endpoint)
gets each returned profile annotated with a `connectionStatus` field relative to
`req.user` — one of `none`, `pending_sent`, `pending_received`, `accepted`, `declined` —
computed by looking up any `ConnectionRequest` between `req.user` and that profile's `user`.

## Frontend

- `RoommateCard.jsx` / `RoommateProfileModal.jsx`: the "connect" button's `onClick` now
  calls the real API (via a new `roommateAPI.connect(recipientId)` /
  `roommateAPI.respondToConnection(id, action)` in `client/src/Utils/api.js`) instead of
  bubbling to a stub toast handler. Button label/state driven by `connectionStatus`:
  - `none` → "connect" (active)
  - `pending_sent` → "request sent" (disabled)
  - `pending_received` → "respond" (routes to the Requests panel) — or just "pending" if
    responding only happens from the Requests panel, not from here
  - `accepted` → "connected ✓" (disabled, success styling)
  - `declined` → "declined" (disabled, muted styling)
- `Roommates.jsx`: a new small toggle/button near the top (shown only when `myProfile`
  exists — i.e. alongside the existing `mode === "matches"` state, not replacing it) opens a
  "Requests" panel listing incoming pending requests via `GET /api/connections/incoming`,
  each with Accept/Decline buttons calling the `PATCH` endpoint. This is additive UI, not a
  change to the existing `mode` browse/matches logic.

## Testing / verification

- `vite build` compiles clean.
- Manual curl verification of the three new endpoints (create, list incoming, accept/decline)
  against seeded roommate profiles, confirming: duplicate/self-request rejection, 403 on a
  non-recipient trying to respond, and status correctly flips for both users after
  accept/decline.
- Manual click-through per the established workflow once curl verification passes.
