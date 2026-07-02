# Landlord Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dead `/landlord/dashboard` route with a working landlord home base — listing management (create/edit/delete with a location picker) and a real, persisted one-way Enquiry system — per `docs/superpowers/specs/2026-07-02-landlord-dashboard-design.md`.

**Architecture:** One new `Enquiry` collection captures tenant enquiries (public endpoint, optional auth). A new `optionalAuth` middleware lets that endpoint work both logged-in and anonymous. Landlord-scoped reads (own listings, own enquiries) reuse existing patterns: "my listings" is a one-line filter addition to the existing public `getAllListings` endpoint (no new route), while "my enquiries" gets two new `protect`-guarded routes mirroring `connectionController.js`'s ownership-check style. Three new frontend routes, wrapped in the existing (currently unused) `LandlordRoute` guard, add a tabbed dashboard and a shared create/edit listing form with a Leaflet click-to-place location picker (Leaflet is already a dependency).

**Tech Stack:** React + React Router + Tailwind (editorial design tokens), axios via `Utils/api.js`, `sonner` toasts, `react-leaflet`, Express + Mongoose backend.

## Global Constraints

- **No new dependencies** — this plan adds none (Leaflet/react-leaflet already installed).
- **Verification:** no test framework exists anywhere in this repo (`server/package.json`'s `test` script is a stub; client has none). Backend tasks verify with `node --check` (syntax) plus a manual `curl` smoke test against the running dev server. Frontend tasks verify with `cd client && npm run build`. Ronald does the manual click-through.
- **Design idiom (copy verbatim from existing pages):** lowercase headlines (`font-display-hero`, `font-headline-section`), eyebrow labels (`font-label-eyebrow text-label-eyebrow ... uppercase`), hairline borders/grids (`border-hairline`, `bg-hairline`), editorial inputs (`border border-hairline focus:border-primary/secondary-container rounded-lg`), color tokens `text-primary`, `text-slate-muted`, `bg-surface`, `bg-surface-bone`, `bg-surface-container`, `text-secondary-container`, `text-emerald-verified`, `text-amber-pending`, `text-rose-danger`.
- **Ownership enforcement always server-side** — never trust a client-side role check alone (per spec's security constraint). `updateListing`/`deleteListing` already enforce this; new enquiry-status endpoint must too.
- Images stay as pasted URLs — no upload infra exists anywhere in this codebase.
- On listing edit, the building cannot be changed (matches `updateListing`'s raw `findByIdAndUpdate(req.body)` — it has no building-name-resolution logic like `createListing` does). The edit form shows the building name read-only.

---

### Task 1: `Enquiry` model + `optionalAuth` middleware

Foundation for the enquiry system: the schema, and the middleware that lets the (anonymous-friendly) enquiry endpoint optionally attach a logged-in tenant.

**Files:**
- Create: `server/Models/Enquiry.js`
- Modify: `server/Middleware/authMiddleware.js`

**Interfaces:**
- Produces: `Enquiry` Mongoose model with fields `{ listing, landlord, tenant, name, phone, message, status, createdAt, updatedAt }`.
- Produces: `exports.optionalAuth` — Express middleware; sets `req.user` if a valid Bearer token is present, otherwise leaves it `undefined` and always calls `next()`.

- [ ] **Step 1: Create the `Enquiry` model**

`server/Models/Enquiry.js`:

```js
const mongoose = require("mongoose");

// A tenant's one-way enquiry about a listing. No in-app reply thread — the
// landlord sees the message + contact info and follows up by phone/email.
const EnquirySchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted"],
      default: "new",
    },
  },
  { timestamps: true },
);

EnquirySchema.index({ landlord: 1, status: 1 });

module.exports = mongoose.model("Enquiry", EnquirySchema);
```

- [ ] **Step 2: Add `optionalAuth` to the auth middleware**

In `server/Middleware/authMiddleware.js`, add this export after `exports.isAdmin` (the file already imports `jwt` and `User` at the top — reuse them):

```js
// Attaches req.user if a valid Bearer token is present; never rejects.
// Used by routes that must work both logged-in and anonymous (e.g. enquiries).
exports.optionalAuth = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";
    if (!authorization.startsWith("Bearer ")) return next();

    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded?.userId) {
      req.user = await User.findById(decoded.userId);
    }
  } catch (err) {
    // Invalid/expired token on an optional-auth route — proceed as anonymous.
  }
  return next();
};
```

- [ ] **Step 3: Syntax-check both files**

Run:
```bash
node --check server/Models/Enquiry.js
node --check server/Middleware/authMiddleware.js
```
Expected: no output (both pass).

- [ ] **Step 4: Commit**

```bash
git add server/Models/Enquiry.js server/Middleware/authMiddleware.js
git commit -m "feat(landlord): add Enquiry model and optionalAuth middleware"
```

---

### Task 2: Enquiry controller + routes

The three endpoints: public create, landlord-scoped list, landlord-scoped status update.

**Files:**
- Create: `server/Controllers/enquiryController.js`
- Create: `server/Routes/enquiryRoutes.js`
- Modify: `server/server.js`

**Interfaces:**
- Consumes: `Enquiry` model, `optionalAuth`/`protect` middleware (Task 1); `Listing` model (`server/Models/Listing.js`, already exists — has `createdBy`).
- Produces: `POST /api/listings/:listingId/enquiries` → `201 { _id, listing, landlord, tenant, name, phone, message, status: "new", createdAt, updatedAt }`.
- Produces: `GET /api/landlord/enquiries` (protect) → `200 [Enquiry...]`, each populated with `listing: { _id, title }`.
- Produces: `PATCH /api/landlord/enquiries/:id/status` (protect) → `200 Enquiry` with updated `status`.

- [ ] **Step 1: Create the enquiry controller**

`server/Controllers/enquiryController.js`:

```js
const Enquiry = require("../Models/Enquiry");
const Listing = require("../Models/Listing");

// Public (optionally authenticated): a tenant enquires about a listing.
exports.createEnquiry = async (req, res) => {
  try {
    const { name, phone, message } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Please enter your name" });
    }
    if (!phone || phone.trim().length < 7) {
      return res
        .status(400)
        .json({ message: "Please enter a valid phone number" });
    }
    if (!message || message.trim().length < 5) {
      return res.status(400).json({ message: "Please enter a message" });
    }

    const listing = await Listing.findById(req.params.listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const enquiry = await Enquiry.create({
      listing: listing._id,
      landlord: listing.createdBy,
      tenant: req.user?._id || null,
      name: name.trim(),
      phone: phone.trim(),
      message: message.trim(),
    });

    res.status(201).json(enquiry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Enquiries for the logged-in landlord's own listings, newest first.
exports.getMyEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({ landlord: req.user._id })
      .populate("listing", "title")
      .sort({ createdAt: -1 });

    res.status(200).json(enquiries);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Landlord toggles an enquiry between "new" and "contacted".
exports.updateEnquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["new", "contacted"].includes(status)) {
      return res
        .status(400)
        .json({ message: "status must be 'new' or 'contacted'" });
    }

    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }
    if (enquiry.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Forbidden: you can only update enquiries on your own listings",
      });
    }

    enquiry.status = status;
    await enquiry.save();

    res.status(200).json(enquiry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
```

- [ ] **Step 2: Create the enquiry routes**

`server/Routes/enquiryRoutes.js` — mounted at `/api` in server.js (same convention as `reviewRoutes.js` / `forumRoutes.js`, which spell out `/buildings/:id/...` internally despite the shared `/api` mount):

```js
const express = require("express");
const router = express.Router();
const { protect, optionalAuth } = require("../Middleware/authMiddleware");
const {
  createEnquiry,
  getMyEnquiries,
  updateEnquiryStatus,
} = require("../Controllers/enquiryController");

// Submit an enquiry about a listing — works logged-in or anonymous.
router.post("/listings/:listingId/enquiries", optionalAuth, createEnquiry);

// Landlord inbox.
router.get("/landlord/enquiries", protect, getMyEnquiries);
router.patch("/landlord/enquiries/:id/status", protect, updateEnquiryStatus);

module.exports = router;
```

- [ ] **Step 3: Mount the route in `server.js`**

In `server/server.js`, add the require alongside the other route imports:

```js
const connectionRoutes = require("./Routes/connectionRoutes");
const enquiryRoutes = require("./Routes/enquiryRoutes");
```

And mount it next to the other `/api`-mounted route modules:

```js
app.use("/api", reviewRoutes);
app.use("/api", forumRoutes);
app.use("/api", enquiryRoutes);
app.use("/api/admin", adminRoutes);
```

- [ ] **Step 4: Syntax-check the new files**

Run:
```bash
node --check server/Controllers/enquiryController.js
node --check server/Routes/enquiryRoutes.js
node --check server/server.js
```
Expected: no output (all pass).

- [ ] **Step 5: Manual smoke test against the running dev server**

Start the server if it isn't running: `cd server && npm run dev`. Then, using an existing seeded tenant account (or any account) to get a token, and a listing id from `GET http://localhost:5000/api/listings`:

```bash
# 1. Anonymous enquiry (no Authorization header)
curl -s -X POST http://localhost:5000/api/listings/<LISTING_ID>/enquiries \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Tenant","phone":"+254712345678","message":"Is this still available?"}'
# Expected: 201, body has status "new" and tenant: null

# 2. Landlord fetches their enquiries (use the landlord's own token — the
#    createdBy of that listing)
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<LANDLORD_EMAIL>","password":"<LANDLORD_PASSWORD>"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")
curl -s http://localhost:5000/api/landlord/enquiries \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200, array containing the enquiry from step 1

# 3. Mark it contacted
curl -s -X PATCH http://localhost:5000/api/landlord/enquiries/<ENQUIRY_ID>/status \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"contacted"}'
# Expected: 200, status: "contacted"
```

- [ ] **Step 6: Commit**

```bash
git add server/Controllers/enquiryController.js server/Routes/enquiryRoutes.js server/server.js
git commit -m "feat(landlord): add enquiry create/list/status endpoints"
```

---

### Task 3: "My listings" filter

One-line addition so the public listings search can be scoped to one landlord's own listings — no new route needed.

**Files:**
- Modify: `server/Controllers/listingController.js`

**Interfaces:**
- Produces: `GET /api/listings?createdBy=<userId>` now filters results to that `createdBy`, in addition to all existing filters.

- [ ] **Step 1: Add `createdBy` to `buildListingFilter`**

In `server/Controllers/listingController.js`, find the `buildListingFilter` function and change its destructure + add one filter line:

```js
async function buildListingFilter(query) {
  const {
    search,
    status,
    verified,
    roomType,
    minPrice,
    maxPrice,
    amenities,
    campus,
    createdBy,
  } = query;
  const filter = {};

  // Scope to one landlord's own listings (used by the Landlord Dashboard).
  if (createdBy) filter.createdBy = createdBy;

  // Text search across title, description, address
  if (search) {
```

(Everything below the `search` block is unchanged — only the destructure and the new two lines above it are added.)

- [ ] **Step 2: Syntax-check**

Run: `node --check server/Controllers/listingController.js`
Expected: no output.

- [ ] **Step 3: Manual smoke test**

```bash
curl -s "http://localhost:5000/api/listings?createdBy=<A_LANDLORD_USER_ID>" | node -pe "JSON.parse(require('fs').readFileSync(0)).listings.length"
```
Expected: a number ≥ 0, and every returned listing's `createdBy._id` equals `<A_LANDLORD_USER_ID>`.

- [ ] **Step 4: Commit**

```bash
git add server/Controllers/listingController.js
git commit -m "feat(landlord): support createdBy filter on listings search"
```

---

### Task 4: Client `enquiryAPI` + wire real enquiry submission

Replace `ListingSidebar.jsx`'s fake `setTimeout` enquiry stub with a real API call, and add the message field the backend now requires.

**Files:**
- Modify: `client/src/Utils/api.js`
- Modify: `client/src/components/listings/ListingSidebar.jsx`

**Interfaces:**
- Produces: `enquiryAPI.create(listingId, { name, phone, message })`, `enquiryAPI.getMine()`, `enquiryAPI.updateStatus(id, status)`.
- Consumes: `enquiryAPI.create` (this task, for the sidebar form).

- [ ] **Step 1: Add `enquiryAPI` to `api.js`**

In `client/src/Utils/api.js`, add this block after `adminAPI` (near the end of the active exports, before the large commented-out legacy block):

```js
export const enquiryAPI = {
  create: (listingId, data) =>
    API.post(`/listings/${listingId}/enquiries`, data),
  getMine: () => API.get("/landlord/enquiries"),
  updateStatus: (id, status) =>
    API.patch(`/landlord/enquiries/${id}/status`, { status }),
};
```

- [ ] **Step 2: Wire the real submission into `ListingSidebar.jsx`**

`client/src/components/listings/ListingSidebar.jsx` — replace the whole file (adds a `message` field and `listingId` prop, and calls the real API instead of `setTimeout`):

```jsx
import { useState } from "react";
import { toast } from "sonner";
import { initials } from "../../Utils/listingHelpers";
import { enquiryAPI } from "../../Utils/api";

const STATUS_LABEL = {
  available: "available now",
  pending: "availability pending",
  unavailable: "currently unavailable",
};

export default function ListingSidebar({ listing }) {
  const landlord = listing?.createdBy;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleEnquire = async (event) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Please enter your name.");
      return;
    }
    if (phone.trim().length < 7) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (message.trim().length < 5) {
      toast.error("Please enter a short message.");
      return;
    }

    setSending(true);
    try {
      await enquiryAPI.create(listing._id, {
        name: name.trim(),
        phone: phone.trim(),
        message: message.trim(),
      });
      setName("");
      setPhone("");
      setMessage("");
      toast.success(
        `Enquiry sent! ${landlord?.name || "The landlord"} will reach out shortly.`,
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't send your enquiry");
    } finally {
      setSending(false);
    }
  };

  const memberSince = landlord?.createdAt
    ? new Date(landlord.createdAt).getFullYear()
    : null;
  const isVerifiedLandlord = landlord?.verificationStatus === "verified";

  return (
    <div className="lg:col-span-4">
      <div className="sticky top-24 space-y-stack-lg">
        {/* Enquiry card */}
        <div className="bg-surface-container-lowest border border-hairline p-6 rounded-xl">
          <div className="mb-6">
            <p className="font-label-eyebrow text-label-eyebrow text-slate-muted mb-1 uppercase">
              Monthly Rent
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-headline-section text-headline-section text-primary">
                KSh {listing?.price?.toLocaleString() ?? "—"}
              </span>
              <span className="font-body-main text-slate-muted">/ mo</span>
            </div>
            <p className="font-label-eyebrow text-label-eyebrow text-emerald-verified mt-2 flex items-center gap-1 uppercase">
              <span className="material-symbols-outlined text-sm">
                calendar_today
              </span>
              {STATUS_LABEL[listing?.status] || "available now"}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleEnquire}>
            <div>
              <label className="font-label-eyebrow text-label-eyebrow text-slate-muted block mb-1 uppercase">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="your name"
                className="w-full border border-hairline focus:ring-1 focus:ring-secondary-container focus:border-secondary-container bg-surface-bright p-3 rounded-lg text-sm outline-none"
              />
            </div>
            <div>
              <label className="font-label-eyebrow text-label-eyebrow text-slate-muted block mb-1 uppercase">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+254..."
                className="w-full border border-hairline focus:ring-1 focus:ring-secondary-container focus:border-secondary-container bg-surface-bright p-3 rounded-lg text-sm outline-none"
              />
            </div>
            <div>
              <label className="font-label-eyebrow text-label-eyebrow text-slate-muted block mb-1 uppercase">
                Message
              </label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
                placeholder="what would you like to ask?"
                className="w-full border border-hairline focus:ring-1 focus:ring-secondary-container focus:border-secondary-container bg-surface-bright p-3 rounded-lg text-sm outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-secondary-container text-honey-ink font-body-strong py-4 rounded-lg hover:opacity-90 active:scale-[0.99] transition-all flex justify-center items-center gap-2 disabled:opacity-60"
            >
              <span className="material-symbols-outlined">mail</span>
              {sending ? "sending…" : "enquire now"}
            </button>
            <button
              type="button"
              onClick={() => toast.info("Viewing scheduling is coming soon.")}
              className="w-full border border-hairline text-primary font-body-strong py-4 rounded-lg hover:bg-surface-bone transition-all"
            >
              schedule a viewing
            </button>
          </form>
        </div>

        {/* Landlord card */}
        {landlord && (
          <div className="bg-surface-bone p-6 rounded-xl border border-hairline">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-circle bg-primary-container flex items-center justify-center text-on-primary-container font-headline-section text-xl">
                {initials(landlord.name) || "BO"}
              </div>
              <div>
                <p className="font-body-strong text-primary lowercase">
                  {landlord.name}
                </p>
                {isVerifiedLandlord ? (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-verified font-bold uppercase tracking-wider">
                    <span
                      className="material-symbols-outlined text-[12px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified_user
                    </span>
                    verified {landlord.role || "landlord"}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-muted font-bold uppercase tracking-wider">
                    {landlord.role || "landlord"}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {memberSince && (
                <span className="text-[10px] bg-surface-container-lowest border border-hairline px-2 py-1 rounded font-label-eyebrow text-primary uppercase">
                  member since {memberSince}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify the build**

Run: `cd client && npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/Utils/api.js client/src/components/listings/ListingSidebar.jsx
git commit -m "feat(landlord): wire real enquiry submission into ListingSidebar"
```

---

### Task 5: `LocationPicker` component

The click-to-place-a-pin map used by the listing form to set `location.coordinates`.

**Files:**
- Create: `client/src/components/landlord/LocationPicker.jsx`

**Interfaces:**
- Consumes: `NAIROBI_CENTER`, `DEFAULT_ZOOM`, `toGeoJSON` from `client/src/components/map/mapHelpers.js` (already exist).
- Produces: default-exported `LocationPicker({ value, onChange })` — `value` is `[lng, lat] | null` (GeoJSON, matching `Listing.location.coordinates`); calls `onChange([lng, lat])` on click.

- [ ] **Step 1: Create the component**

`client/src/components/landlord/LocationPicker.jsx`:

```jsx
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { NAIROBI_CENTER, DEFAULT_ZOOM, toGeoJSON } from "../map/mapHelpers";

// Custom divIcon, matching priceMarker.js's approach — Leaflet's default
// marker image doesn't resolve under Vite without extra config, so every
// map pin in this app already uses a divIcon instead.
const pinIcon = L.divIcon({
  html: `<div style="transform:translate(-50%,-100%)" class="w-6 h-6 bg-secondary-container rounded-full border-2 border-white shadow-lg"></div>`,
  className: "",
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

// Reports clicks back as GeoJSON [lng, lat].
function ClickToPlace({ onChange }) {
  useMapEvents({
    click: (event) => onChange(toGeoJSON(event.latlng)),
  });
  return null;
}

// value: [lng, lat] GeoJSON coordinates, or null/[0,0] for "not set yet".
export default function LocationPicker({ value, onChange }) {
  const hasValue = Array.isArray(value) && (value[0] !== 0 || value[1] !== 0);
  const position = hasValue ? [value[1], value[0]] : null; // -> Leaflet [lat,lng]

  return (
    <div className="h-64 rounded-lg overflow-hidden border border-hairline">
      <MapContainer
        center={position || NAIROBI_CENTER}
        zoom={position ? 15 : DEFAULT_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToPlace onChange={onChange} />
        {position && <Marker position={position} icon={pinIcon} />}
      </MapContainer>
    </div>
  );
}
```

- [ ] **Step 2: Lint the new file**

This component isn't imported by any page yet (Task 6 wires it in), so `vite build` won't touch it — lint it directly instead:

```bash
cd client && npx eslint src/components/landlord/LocationPicker.jsx
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/landlord/LocationPicker.jsx
git commit -m "feat(landlord): add Leaflet click-to-place LocationPicker"
```

---

### Task 6: `LandlordListingForm` page (create + edit) + routes

The full-schema create/edit form, using `LocationPicker` from Task 5.

**Files:**
- Create: `client/src/Pages/LandlordListingForm.jsx`
- Modify: `client/src/App.jsx`

**Interfaces:**
- Consumes: `listingAPI.createListing`, `listingAPI.getListingById`, `listingAPI.updateListing` (all already exist in `Utils/api.js`); `LocationPicker` (Task 5); `LandlordRoute` from `Utils/protectedRoute.jsx` (already exists, currently unused).
- Produces: default-exported `LandlordListingForm` page, routed at `/landlord/listings/new` and `/landlord/listings/:id/edit`.

- [ ] **Step 1: Create the form page**

`client/src/Pages/LandlordListingForm.jsx`:

```jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { listingAPI } from "../Utils/api";
import LocationPicker from "../components/landlord/LocationPicker";

const INPUT_CLASS =
  "w-full bg-transparent border border-hairline rounded-lg px-4 py-3 " +
  "focus:outline-none focus:border-primary font-body-main text-body-main " +
  "text-primary placeholder:text-outline-variant transition-colors";
const LABEL_CLASS =
  "block font-label-eyebrow text-label-eyebrow text-slate-muted uppercase mb-2";

const ROOM_TYPES = [
  "bedsitter",
  "single_room",
  "shared_room",
  "studio",
  "one_bedroom",
  "two_bedroom",
  "other",
];
const STATUSES = ["available", "unavailable", "pending"];

const EMPTY_FORM = {
  title: "",
  description: "",
  price: "",
  buildingName: "",
  address: "",
  roomType: "other",
  bedrooms: "",
  bathrooms: "",
  features: "",
  amenities: "",
  images: "",
  status: "available",
  location: null, // [lng, lat] | null
};

function Field({ label, children }) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      {children}
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-label-eyebrow text-label-eyebrow text-primary uppercase whitespace-nowrap">
        {children}
      </span>
      <span className="flex-grow border-t border-hairline" />
    </div>
  );
}

const toCsv = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");
const fromCsv = (str) =>
  str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const toLines = (arr) => (Array.isArray(arr) ? arr.join("\n") : "");
const fromLines = (str) =>
  str
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

export default function LandlordListingForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [buildingName, setBuildingName] = useState(""); // display-only on edit
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await listingAPI.getListingById(id);
        if (!active) return;
        setForm({
          title: data.title || "",
          description: data.description || "",
          price: data.price ?? "",
          buildingName: "",
          address: data.address || "",
          roomType: data.roomType || "other",
          bedrooms: data.bedrooms ?? "",
          bathrooms: data.bathrooms ?? "",
          features: toCsv(data.features),
          amenities: toCsv(data.amenities),
          images: toLines(data.images),
          status: data.status || "available",
          location: data.location?.coordinates || null,
        });
        setBuildingName(data.building?.name || "");
      } catch (err) {
        toast.error(err.response?.data?.message || "Couldn't load this listing");
        navigate("/landlord/dashboard");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEdit, navigate]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    if (!form.title.trim()) return "Enter a title.";
    if (!form.description.trim()) return "Enter a description.";
    const price = Number(form.price);
    if (!price || price <= 0) return "Enter a valid price.";
    if (!isEdit && !form.buildingName.trim()) return "Enter the building name.";
    if (!isEdit && !form.address.trim()) return "Enter the address.";
    if (!form.location) return "Click the map to set the location.";
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      address: form.address.trim(),
      roomType: form.roomType,
      bedrooms: form.bedrooms === "" ? undefined : Number(form.bedrooms),
      bathrooms: form.bathrooms === "" ? undefined : Number(form.bathrooms),
      features: fromCsv(form.features),
      amenities: fromCsv(form.amenities),
      images: fromLines(form.images),
      status: form.status,
      location: { type: "Point", coordinates: form.location },
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await listingAPI.updateListing(id, payload);
        toast.success("Listing updated");
      } else {
        await listingAPI.createListing({
          ...payload,
          buildingName: form.buildingName.trim(),
        });
        toast.success("Listing created");
      }
      navigate("/landlord/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save this listing");
    } finally {
      setSubmitting(false);
    }
  };

  const roomTypeOptions = useMemo(
    () =>
      ROOM_TYPES.map((t) => (
        <option key={t} value={t}>
          {t.replace(/_/g, " ")}
        </option>
      )),
    [],
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-grid-margin py-section-gap space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-container animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <header className="w-full py-section-gap bg-surface-bone border-b border-hairline">
        <div className="max-w-3xl mx-auto px-grid-margin">
          <Link
            to="/landlord/dashboard"
            className="inline-flex items-center gap-1 font-label-eyebrow text-[10px] text-slate-muted uppercase hover:text-primary transition-colors mb-stack-md"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            back to dashboard
          </Link>
          <h1 className="font-display-hero text-display-hero-mobile text-primary lowercase">
            {isEdit ? "edit listing" : "add a listing"}
          </h1>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto px-grid-margin py-section-gap space-y-6"
      >
        <SectionHeading>the basics</SectionHeading>
        <div className="space-y-6 mb-section-gap">
          <Field label="title">
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="cozy bedsitter near campus"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              placeholder="describe the space, the neighbourhood, what's included…"
              className={`${INPUT_CLASS} resize-none`}
            />
          </Field>
          <Field label="price / month (KSh)">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="12000"
              className={`${INPUT_CLASS} font-price-tabular`}
            />
          </Field>
        </div>

        <SectionHeading>location</SectionHeading>
        <div className="space-y-6 mb-section-gap">
          {isEdit ? (
            <Field label="building">
              <p className="font-body-main text-primary">{buildingName || "—"}</p>
              <p className="font-body-main text-xs text-slate-muted mt-1">
                the building can't be changed after a listing is created.
              </p>
            </Field>
          ) : (
            <Field label="building name">
              <input
                type="text"
                value={form.buildingName}
                onChange={(e) => set("buildingName", e.target.value)}
                placeholder="qwetu hostels"
                className={INPUT_CLASS}
              />
            </Field>
          )}
          <Field label="address">
            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="off thika road, ruiru"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="pin the location on the map">
            <LocationPicker
              value={form.location}
              onChange={(coords) => set("location", coords)}
            />
          </Field>
        </div>

        <SectionHeading>details</SectionHeading>
        <div className="space-y-6 mb-section-gap">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Field label="room type">
              <select
                value={form.roomType}
                onChange={(e) => set("roomType", e.target.value)}
                className={`${INPUT_CLASS} cursor-pointer`}
              >
                {roomTypeOptions}
              </select>
            </Field>
            <Field label="bedrooms">
              <input
                type="number"
                min="0"
                value={form.bedrooms}
                onChange={(e) => set("bedrooms", e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="bathrooms">
              <input
                type="number"
                min="0"
                value={form.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
          </div>
          <Field label="features (comma-separated)">
            <input
              type="text"
              value={form.features}
              onChange={(e) => set("features", e.target.value)}
              placeholder="balcony, furnished, parking"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="amenities (comma-separated)">
            <input
              type="text"
              value={form.amenities}
              onChange={(e) => set("amenities", e.target.value)}
              placeholder="wifi, water backup, security"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="image URLs (one per line)">
            <textarea
              value={form.images}
              onChange={(e) => set("images", e.target.value)}
              rows={3}
              placeholder={"https://…\nhttps://…"}
              className={`${INPUT_CLASS} resize-none font-mono text-xs`}
            />
          </Field>
          <Field label="status">
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className={`${INPUT_CLASS} cursor-pointer`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex items-center gap-4 pt-stack-md border-t border-hairline">
          <button
            type="submit"
            disabled={submitting}
            className="bg-secondary-container text-honey-ink font-body-strong px-10 py-3 rounded-full lowercase hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
          >
            {submitting ? "saving…" : isEdit ? "save changes" : "create listing"}
          </button>
          <Link
            to="/landlord/dashboard"
            className="font-body-strong text-slate-muted lowercase hover:text-primary transition-colors px-4 py-3"
          >
            cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Wire the routes in `App.jsx`**

In `client/src/App.jsx`, add these two imports alongside the other page imports (the `LandlordDashboard` import comes later, in Task 7 — it doesn't exist yet):

```jsx
import LandlordListingForm from "./Pages/LandlordListingForm";
import { LandlordRoute } from "./Utils/protectedRoute";
```

Add the route inside the `SiteLayout` block, after the `/reviews/:buildingId` route:

```jsx
          <Route
            path="/landlord/listings/new"
            element={
              <LandlordRoute>
                <LandlordListingForm />
              </LandlordRoute>
            }
          />
          <Route
            path="/landlord/listings/:id/edit"
            element={
              <LandlordRoute>
                <LandlordListingForm />
              </LandlordRoute>
            }
          />
```

- [ ] **Step 3: Verify the build**

Run: `cd client && npm run build`
Expected: build completes with no errors. (`/landlord/dashboard` doesn't exist yet — that's fine, Task 7 adds it; these two new routes reference only `LandlordListingForm`, which exists as of this task.)

- [ ] **Step 4: Commit**

```bash
git add client/src/Pages/LandlordListingForm.jsx client/src/App.jsx
git commit -m "feat(landlord): add create/edit listing form with location picker"
```

---

### Task 7: `LandlordDashboard` page (tabs) + route

Tabbed "My Listings" / "Enquiries" dashboard, the landing page landlords already get redirected to post-login (`Auth.jsx`'s `landingPathForRole`).

**Files:**
- Create: `client/src/components/landlord/LandlordListingCard.jsx`
- Create: `client/src/Pages/LandlordDashboard.jsx`
- Modify: `client/src/App.jsx`

**Interfaces:**
- Consumes: `listingAPI.getAllListings` (with `createdBy`, Task 3), `listingAPI.deleteListing` (exists), `enquiryAPI.getMine`, `enquiryAPI.updateStatus` (Task 4), `useAuth` (`context/authContext.jsx`, exists — provides `user`), `LandlordRoute` (Task 6's import).
- Produces: default-exported `LandlordDashboard` page, routed at `/landlord/dashboard`; default-exported `LandlordListingCard({ listing, onDeleted })`.

- [ ] **Step 1: Create the listing card**

`client/src/components/landlord/LandlordListingCard.jsx`:

```jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { listingAPI } from "../../Utils/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format&fit=crop";

export default function LandlordListingCard({ listing, onDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await listingAPI.deleteListing(listing._id);
      toast.success("Listing deleted");
      onDeleted(listing._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't delete this listing");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="bg-surface p-6 flex flex-col gap-4 border border-hairline rounded-xl">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-container">
        <img
          src={listing.images?.[0] || FALLBACK_IMAGE}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
        <span
          className={`absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-label-eyebrow tracking-widest uppercase ${
            listing.isVerified
              ? "bg-emerald-verified/10 text-emerald-verified"
              : "bg-amber-pending/10 text-amber-pending"
          }`}
        >
          {listing.isVerified ? "verified" : "pending"}
        </span>
      </div>

      <div>
        <h3 className="font-headline-section text-xl text-primary lowercase">
          {listing.title}
        </h3>
        <p className="font-price-tabular text-secondary-container text-sm">
          KSh {listing.price?.toLocaleString() ?? "—"} / mo · {listing.status}
        </p>
      </div>

      <div className="flex items-center gap-4 pt-3 border-t border-hairline">
        <Link
          to={`/landlord/listings/${listing._id}/edit`}
          className="font-body-strong text-sm text-primary hover:text-secondary-container transition-colors"
        >
          edit
        </Link>
        {confirming ? (
          <div className="flex items-center gap-3 ml-auto">
            <span className="font-body-main text-xs text-slate-muted">delete?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="font-body-strong text-sm text-rose-danger hover:underline disabled:opacity-60"
            >
              yes
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="font-body-strong text-sm text-slate-muted"
            >
              no
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="ml-auto font-label-eyebrow text-[10px] text-slate-muted uppercase hover:text-rose-danger transition-colors"
          >
            delete
          </button>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Create the dashboard page**

`client/src/Pages/LandlordDashboard.jsx`:

```jsx
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { listingAPI, enquiryAPI } from "../Utils/api";
import { useAuth } from "../hooks/useAuth";
import LandlordListingCard from "../components/landlord/LandlordListingCard";

const TABS = [
  { key: "listings", label: "my listings" },
  { key: "enquiries", label: "enquiries" },
];

function EmptyState({ icon, title, body }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-grid-margin">
      <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">
        {icon}
      </span>
      <h3 className="font-headline-section text-2xl text-primary lowercase mb-2">
        {title}
      </h3>
      <p className="font-body-main text-on-surface-variant max-w-sm text-sm">{body}</p>
    </div>
  );
}

export default function LandlordDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("listings");
  const [listings, setListings] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const [listingsRes, enquiriesRes] = await Promise.all([
        listingAPI.getAllListings({ createdBy: user._id }),
        enquiryAPI.getMine(),
      ]);
      setListings(listingsRes.data?.listings || []);
      setEnquiries(enquiriesRes.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't load your dashboard");
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeleted = (listingId) => {
    setListings((prev) => prev.filter((l) => l._id !== listingId));
  };

  const markContacted = async (enquiryId) => {
    try {
      await enquiryAPI.updateStatus(enquiryId, "contacted");
      setEnquiries((prev) =>
        prev.map((e) => (e._id === enquiryId ? { ...e, status: "contacted" } : e)),
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update this enquiry");
    }
  };

  return (
    <div>
      <header className="w-full py-section-gap bg-surface-bone border-b border-hairline">
        <div className="max-w-screen-2xl mx-auto px-grid-margin flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="font-label-eyebrow text-label-eyebrow text-primary uppercase">
              landlord dashboard
            </span>
            <h1 className="font-display-hero text-display-hero-mobile text-primary lowercase mt-stack-sm">
              your listings, at a glance.
            </h1>
          </div>
          <Link
            to="/landlord/listings/new"
            className="bg-secondary-container text-honey-ink px-6 py-3 rounded-full font-body-strong lowercase hover:brightness-110 active:scale-95 transition-all"
          >
            + add listing
          </Link>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-grid-margin">
        <div className="flex gap-8 border-b border-hairline mt-stack-lg">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`pb-4 font-body-strong lowercase border-b-2 transition-colors ${
                tab === t.key
                  ? "text-primary border-primary"
                  : "text-slate-muted border-transparent hover:text-primary"
              }`}
            >
              {t.label}
              {t.key === "enquiries" &&
                enquiries.some((e) => e.status === "new") && (
                  <span className="ml-2 inline-block w-2 h-2 rounded-full bg-secondary-container align-middle" />
                )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-grid-margin py-section-gap">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-72 bg-surface-container animate-pulse rounded-xl" />
            ))}
          </div>
        ) : tab === "listings" ? (
          listings.length === 0 ? (
            <EmptyState
              icon="home_work"
              title="no listings yet"
              body="add your first listing to start reaching students."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <LandlordListingCard
                  key={listing._id}
                  listing={listing}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          )
        ) : enquiries.length === 0 ? (
          <EmptyState
            icon="mail"
            title="no enquiries yet"
            body="when a tenant enquires about one of your listings, it shows up here."
          />
        ) : (
          <div className="max-w-3xl divide-y divide-hairline border-t border-hairline">
            {enquiries.map((enquiry) => (
              <div key={enquiry._id} className="py-stack-lg flex items-start justify-between gap-6">
                <div>
                  <p className="font-body-strong text-primary lowercase">
                    {enquiry.listing?.title || "listing"}
                  </p>
                  <p className="font-label-eyebrow text-label-eyebrow text-slate-muted">
                    {enquiry.name} · {enquiry.phone}
                  </p>
                  <p className="font-body-main text-slate-muted mt-2">{enquiry.message}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-label-eyebrow tracking-widest uppercase ${
                      enquiry.status === "contacted"
                        ? "bg-emerald-verified/10 text-emerald-verified"
                        : "bg-amber-pending/10 text-amber-pending"
                    }`}
                  >
                    {enquiry.status}
                  </span>
                  {enquiry.status === "new" && (
                    <button
                      type="button"
                      onClick={() => markContacted(enquiry._id)}
                      className="font-body-strong text-xs text-primary hover:text-secondary-container"
                    >
                      mark contacted
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Wire the `/landlord/dashboard` route in `App.jsx`**

In `client/src/App.jsx`, add the import alongside the `LandlordListingForm` import added in Task 6:

```jsx
import LandlordDashboard from "./Pages/LandlordDashboard";
```

And add the route, immediately before the two `/landlord/listings/...` routes added in Task 6:

```jsx
          <Route
            path="/landlord/dashboard"
            element={
              <LandlordRoute>
                <LandlordDashboard />
              </LandlordRoute>
            }
          />
```

- [ ] **Step 4: Verify the build**

Run: `cd client && npm run build`
Expected: build completes with no errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/landlord/LandlordListingCard.jsx client/src/Pages/LandlordDashboard.jsx client/src/App.jsx
git commit -m "feat(landlord): add tabbed landlord dashboard (listings + enquiries)"
```

---

## Self-Review

**Spec coverage:**
- `Enquiry` model exactly as specced (listing/landlord/tenant/name/phone/message/status) → Task 1. ✓
- `optionalAuth` middleware (spec's self-review fix) → Task 1. ✓
- `POST /api/listings/:id/enquiries`, `GET /api/landlord/enquiries`, `PATCH /api/landlord/enquiries/:id/status` → Task 2. ✓
- "My listings" via `createdBy` filter, no new route → Task 3. ✓
- `enquiryAPI` client helper + real `ListingSidebar` wiring (with new message field) → Task 4. ✓
- `LocationPicker` (Leaflet click-to-place, reuses `mapHelpers`) → Task 5. ✓
- `LandlordListingForm` (full schema, create+edit, building read-only on edit) + routes → Task 6. ✓
- `LandlordDashboard` (tabs, listings grid, enquiries list, mark contacted) + route → Task 7. ✓
- `LandlordRoute` guard used on all three new routes → Tasks 6–7. ✓
- Out-of-scope items (in-app reply thread, image upload, stats, admin dashboard, legal pages) → correctly absent from every task. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full file or exact insertion content. Fixed inline during self-review: Task 6 Step 2 originally showed a `LandlordDashboard` import that doesn't exist until Task 7, contradicted by a parenthetical saying not to add it — split cleanly so Task 6 imports only what Task 6 needs, Task 7 adds its own import. Task 5 Step 2 originally had a self-contradictory "build" step for a component nothing imports yet — replaced with a direct lint check.

**Type consistency:** `Enquiry.status` enum (`"new" | "contacted"`) matches `enquiryController.updateEnquiryStatus`'s validation and `LandlordDashboard`'s status badge logic. `location.coordinates` is `[lng, lat]` GeoJSON everywhere (model, `createListing`, `LocationPicker`'s `value`/`onChange`, `LandlordListingForm`'s `form.location`) — `LocationPicker` internally flips to Leaflet's `[lat, lng]` only for rendering, never leaks that flip to its caller. `listingAPI.getAllListings({ createdBy })` response shape `{ listings, total, page, totalPages }` matches `LandlordDashboard`'s `listingsRes.data?.listings`. `enquiryAPI.getMine()` returns a plain array, matches `enquiriesRes.data`.

**Verification adaptation:** No test framework exists (confirmed via `server/package.json`, `client/package.json`, and a repo-wide search for `*.test.js`/`*.spec.js` — none found). Backend tasks gate on `node --check` + a `curl` smoke test; frontend tasks gate on `vite build`; noted in Global Constraints, matching the precedent set by the reviews-page plan.
