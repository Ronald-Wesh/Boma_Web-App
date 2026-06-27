# Boma — Design System & UI Specification

## Brand Identity

**Boma** is a modern rental and housing platform tailored for the Kenyan market. The name "Boma" means "home/homestead" in Swahili, evoking warmth, community, and belonging. The platform connects tenants with landlords, offering verified listings, honest building reviews, and private community forums.

### Brand Personality
- **Trustworthy** — Verification badges, real reviews, transparent pricing
- **Modern & Clean** — Minimalist design with purposeful whitespace
- **Warm & Inviting** — Earthy tones that feel like home
- **Community-Driven** — Forums, reviews, and neighbor connections

---

## Color Palette

### Primary Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `brand-dark` | `#133127` | Primary dark green — hero sections, left panels, nav backgrounds |
| `brand-gold` | `#F59E0B` (Amber-400) | Accent — badges, highlights, stars, CTAs |
| `brand-cream` | `#FFFDF8` | Light background — form areas, card surfaces |
| `surface-primary` | `#FFFFFF` | Cards, modals, clean surfaces |
| `surface-subtle` | `#F5F5F4` (Stone-100) | Secondary backgrounds, input fields |

### Neutral Scale (Stone Palette)
| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#1C1917` (Stone-900) | Headlines, primary text |
| `text-secondary` | `#57534E` (Stone-600) | Body text, descriptions |
| `text-tertiary` | `#A8A29E` (Stone-400) | Placeholder text, subtle labels |
| `border-default` | `#E7E5E4` (Stone-200) | Card borders, dividers |
| `border-subtle` | `rgba(255,255,255,0.10)` | Dark-background borders |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#10B981` (Emerald-500) | Verified badges, success states |
| `warning` | `#F59E0B` (Amber-500) | Pending status, attention states |
| `danger` | `#EF4444` (Red-500) | Delete actions, error states |
| `info` | `#6366F1` (Indigo-500) | Links, active filters |

### Gradient Presets
- **Hero gradient**: `linear-gradient(135deg, #f6efe5 0%, #d7e7de 45%, #13261d 100%)`
- **Dark overlay**: `radial-gradient(circle at top right, rgba(245,158,11,0.24), transparent 28%)`
- **Listing hero**: `linear-gradient(to right, #4F46E5, #7C3AED, #EC4899)` (indigo → purple → pink)

---

## Typography

### Font Family
- **Primary**: `Inter` (Google Fonts) — clean, modern, excellent readability
- **Fallback**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

### Type Scale
| Style | Size | Weight | Tracking | Usage |
|-------|------|--------|----------|-------|
| Display | 48-60px | 700 | -0.02em | Hero headlines |
| H1 | 36-48px | 700 | -0.02em | Page titles |
| H2 | 28-32px | 600 | -0.01em | Section headings |
| H3 | 20-24px | 600 | normal | Card titles, sub-sections |
| Body | 14-16px | 400 | normal | Paragraphs, descriptions |
| Caption | 12-13px | 500 | normal | Labels, metadata |
| Overline | 11-12px | 600-700 | 0.24-0.32em | Badges, status labels (ALL CAPS) |

---

## Spacing & Layout

### Spacing Scale
`4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px`

### Border Radius
| Element | Radius |
|---------|--------|
| Buttons (pill) | `9999px` (full) |
| Cards | `12-16px` |
| Inputs | `16px` |
| Badges | `9999px` (full) |
| Large containers | `32px` |
| Avatars | `50%` |

### Shadows
- **Card default**: `0 1px 3px rgba(0,0,0,0.06)`
- **Card hover**: `0 20px 40px rgba(0,0,0,0.12)`
- **Hero container**: `0 30px 80px rgba(15,23,42,0.18)`
- **Button glow**: `0 8px 24px rgba(99,102,241,0.25)`

---

## Component Patterns

### Buttons
- **Primary**: Dark stone-900 background, white text, pill shape, hover → stone-700
- **Secondary/Outline**: Stone border, transparent background, hover → filled dark
- **Ghost**: No border, text only, hover → subtle background
- **Danger**: Rose-50 background, rose-700 text
- **Success**: Emerald-50 background, emerald-700 text
- All buttons have smooth `200-300ms` transitions

### Input Fields
- `16px` border radius
- Stone-200 border, white background
- `14px` text size, stone-400 placeholder
- Focus: stone-900 border (auth) or indigo ring (listings)
- `12px 16px` padding

### Cards (Listing Cards)
- White background, stone-100 border
- `12px` radius, subtle shadow
- Hover: scale 1.02, translate up 4px, deeper shadow
- Image section: 4:3 aspect ratio with lazy loading
- Hover image: scale 1.1 with gradient overlay
- Floating price tag bottom-left on image
- Top-left badges (New, Verified, Status)
- Top-right favorite heart button
- Body: title + rating, location, description (2-line clamp), room details, creator info

### Badges
- Pill-shaped (`9999px` radius)
- `11px` uppercase bold with wide letter-spacing
- Gradient backgrounds (amber for "New", emerald for "Verified")
- Small shadow for depth

### Navigation Bar
- Sticky top, glass-morphism (`backdrop-blur`, `bg-white/90`)
- Bottom border `stone-200/70`
- Logo: Dark rounded square with amber "B" letter
- Brand text: "BOMA" in wide tracking overline

---

## User Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Tenant** | Browse listings, search/filter, write reviews, forum posts, favorite listings |
| **Landlord** | All tenant abilities + Create/edit/delete own listings |
| **Admin** | All abilities + Verify users/listings, delete any content, access admin dashboard |

---

## Screen Specifications

### 1. Landing / Marketing Page (New — Not Yet Built)
**Purpose**: First impression for unauthenticated visitors
**Layout**: Full-width, scroll-based sections
**Sections**:
- **Hero**: Full viewport height, dark green (`#133127`) background with radial gradient overlays. Large display headline about finding better homes in Kenya. CTA buttons: "Get Started" and "Browse Listings". Subtle floating property cards or map preview as visual interest.
- **Value Proposition**: 3-column grid showcasing: Smart Listings, Real Reviews, Building Communities. Each with an icon, heading, and short description.
- **How It Works**: 3-step horizontal flow — Search → Review → Connect. Use numbered circles or icons.
- **Social Proof**: Testimonial cards or stat counters (e.g., "2,000+ Verified Listings", "500+ Buildings Reviewed")
- **CTA Footer**: "Join Boma today" with sign up button

### 2. Authentication Page (Login / Register)
**Purpose**: User sign-in and account creation
**Layout**: Two-panel split layout on desktop, stacked on mobile
- **Left Panel** (55%): Dark green (`#133127`) with radial gradient overlays. Contains:
  - Tagline badges ("Find better homes", "Rent with confidence", "Live smarter")
  - Large headline: "Rent decisions move faster when identity is simple."
  - Description paragraph about verified listings and community
  - 3 feature highlight cards with glass-morphism borders
  - Footer text: "Join now. Find your space."
- **Right Panel** (45%): Warm cream (`#FFFDF8`) background. Contains:
  - Toggle pills (Sign In / Create Account) — dark pill bar with white active state
  - Heading + subtitle
  - Google Sign-In button (pill-shaped, outline theme)
  - "or use email" divider
  - Form fields: Full Name (register only), Email, Password, Account Type dropdown (register only)
  - Submit button: Full-width, dark stone-900 pill
- **Register form** includes role selector: Tenant or Landlord

### 3. Listings Page (Main Dashboard)
**Purpose**: Browse, search, and filter rental listings
**Layout**: Full-width with max-width container (1280px)
**Sections**:
- **Hero Banner**: Gradient header (indigo → purple → pink) with decorative semi-transparent circles. Contains page title "Discover Spaces", subtitle, and "Create Listing" button (glass-morphism style, visible to authenticated users only).
- **Search & Filters Bar**: Overlaps hero by ~64px (negative margin). White card with backdrop blur and rounded corners. Contains:
  - Search input with magnifier icon
  - Filter row: Status dropdown (All/Available/Unavailable/Pending), Sort dropdown (Newest/Price Low→High/Price High→Low), Price range inputs (Min KES – Max KES), Verified Only toggle button, Clear All button
  - Results count bar at bottom
- **Listings Grid**: Responsive grid — 1 col mobile, 2 col sm, 3 col lg, 4 col xl. Uses ListingCard components with skeleton loading animation (8 skeleton cards while loading).
- **Pagination**: "Load More" gradient button (indigo → purple) centered below grid. Spinner animation when loading. "You've seen all X listings ✨" message when complete.
- **Empty State**: Centered illustration (house icon in gradient circle) with "No listings found" message

### 4. Create/Edit Listing Page (New — Not Yet Built)
**Purpose**: Landlords create new rental listings
**Layout**: Centered form card (max-width 700px) on subtle background
**Form Fields** (mapped to backend schema):
- Title (text input, required)
- Description (textarea, required)
- Price in KES (number input, required, min 0)
- Building Name (text input, required — auto-creates building if new)
- Address (text input)
- Bedrooms count (number input)
- Bathrooms count (number input)
- Features (text/tags input)
- Amenities (text/tags input)
- Location coordinates (map picker or lat/lng inputs)
**Design**: Card-based form with clear labels, validation feedback, and submit button

### 5. Listing Detail Page (New — Not Yet Built)
**Purpose**: Full details of a single listing
**Layout**: Two-column on desktop (image gallery left, details right), stacked on mobile
**Sections**:
- **Image Gallery**: Large hero image with thumbnail strip or carousel
- **Listing Info**: Title, price per month, verification badge, status badge
- **Details Grid**: Bedrooms, bathrooms, features, amenities
- **Description**: Full text with read-more expand
- **Building Info Card**: Building name, address, average rating, total reviews, link to building page
- **Creator/Landlord Card**: Name, avatar, verification status, contact button
- **Location Map**: Embedded map showing listing coordinates
- **Actions**: Edit/Delete for owner, Verify for admin, Favorite for all users

### 6. Building Profile Page (New — Not Yet Built)
**Purpose**: All information about a specific building
**Layout**: Single column with tabbed content
**Sections**:
- **Building Header**: Name, address, average rating (star display), total reviews count
- **Tabs**: Listings | Reviews | Forum | Nearby
- **Listings Tab**: Grid of ListingCards for this building
- **Reviews Tab**: List of review cards with:
  - Reviewer name (or "Anonymous")
  - Category ratings (cleanliness, maintenance, amenities, security, water availability, landlord reliability) — each 1-5 scale with star/bar visualization
  - Comment text
  - Helpful count with "Mark Helpful" button
  - Verified resident badge
- **Forum Tab**: List of forum posts with title, content, upvote/downvote counts, comments count, resolved status
- **Nearby Tab**: List/map of nearby buildings

### 7. Write Review Page/Modal (New — Not Yet Built)
**Purpose**: Tenants write reviews for buildings
**Layout**: Modal overlay or dedicated page with form card
**Form Fields** (mapped to Review schema):
- Title (text, required)
- Comment (textarea)
- Category Ratings — each 1-5 star selector:
  - Cleanliness
  - Maintenance
  - Amenities
  - Security
  - Water Availability
  - Landlord Reliability
- Anonymous toggle (checkbox, default: on)
**Design**: Star rating selectors with hover effects, smooth animations

### 8. Forum / Community Page (New — Not Yet Built)
**Purpose**: Building-specific community discussions
**Layout**: List view with create post capability
**Sections**:
- **Post List**: Cards with:
  - Post title
  - Content preview (truncated)
  - Author name (or "Anonymous")
  - Building name
  - Upvote/downvote buttons with counts
  - Comment count
  - Resolved/unresolved badge
  - Timestamp
- **Create Post**: Modal or expandable form — title, content, anonymous toggle, building selector
- **Filters**: All forums / My building / Resolved / Unresolved

### 9. User Profile Page (New — Not Yet Built)
**Purpose**: View and edit personal profile
**Layout**: Two-column — profile sidebar + activity content
**Sections**:
- **Profile Card**: Avatar (with upload), name, email, role badge, verification status, phone, member since date
- **Edit Profile Form**: Name, phone, avatar URL
- **Activity Tabs**: My Listings (landlord) | My Reviews | My Forum Posts
- **Verification Status**: Visual indicator — Verified (green badge), Pending (amber), Unverified (grey)

### 10. Admin Dashboard (New — Not Yet Built)
**Purpose**: Admin management panel
**Layout**: Sidebar navigation + main content area
**Sections**:
- **Overview**: Stats cards — Total Users, Total Listings, Pending Verifications, Total Reviews
- **Unverified Users Table**: Name, email, role, registration date, Verify/Reject actions
- **Unverified Listings Table**: Title, building, price, creator, Verify/Reject actions
- **Quick Actions**: Bulk verify, search users, search listings

### 11. Notifications Panel (New — Not Yet Built)
**Purpose**: User notifications
**Layout**: Slide-out panel from right or dropdown
**Features**:
- Notification cards with title, message, timestamp
- Read/unread visual indicator (bold vs. normal, dot indicator)
- Mark as read action
- Mark all as read
- Filter: All / Unread

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 640px | Single column, stacked layouts, bottom nav |
| Tablet | 640-1024px | 2-column grids, side-by-side panels |
| Desktop | 1024-1280px | 3-column grids, full layouts |
| Wide | > 1280px | 4-column listing grid, max-width containers |

---

## Animation & Interaction Guidelines

### Transitions
- **Default duration**: `200-300ms` ease-out
- **Card hover**: Scale 1.02, translateY -4px, shadow deepens
- **Image hover**: Scale 1.1 within container (overflow hidden)
- **Button hover**: Background color shift, subtle shadow increase
- **Page transitions**: Fade in with slight upward motion

### Loading States
- **Skeleton cards**: Pulsing animation (`animate-pulse`) with grey placeholder shapes
- **Spinners**: Small rotating circles for button loading states
- **Progress indicators**: Pulsing dot with label text

### Micro-interactions
- **Favorite heart**: Toggle fill with bounce animation
- **Badge appearance**: Subtle fade-in
- **Filter toggle**: Color transition on active state
- **Toast notifications**: Slide in from top-right, auto-dismiss

---

## API Endpoints (For Data Integration Reference)

### Authentication
- `POST /api/auth/register` — Register (name, email, password, role)
- `POST /api/auth/login` — Login (email, password)
- `POST /api/auth/google` — Google OAuth (credential)
- `GET /api/auth/me` — Get current user (protected)

### Listings
- `POST /api/listings` — Create listing (protected)
- `GET /api/listings` — Get all (supports: search, status, verified, sort, page, limit)
- `GET /api/listings/:id` — Get single listing
- `PUT /api/listings/:id` — Update listing (protected, owner/admin)
- `DELETE /api/listings/:id` — Delete listing (protected, owner/admin)

### Buildings
- `GET /api/buildings/:id/listings` — Building's listings
- `GET /api/buildings/:id/insights` — Building insights
- `GET /api/buildings/:id/nearby` — Nearby buildings

### Reviews
- `POST /api/buildings/:id/reviews` — Create review (protected)
- `GET /api/buildings/:id/reviews` — Building reviews
- `PUT /api/reviews/:id` — Update review (protected)
- `DELETE /api/reviews/:id` — Delete review (protected)
- `PATCH /api/reviews/:id/helpful` — Mark helpful

### Forum
- `POST /api/buildings/:id/forum` — Create forum post (protected)
- `GET /api/buildings/:id/forums` — Building forums
- `GET /api/forums` — All forums
- `DELETE /api/forums/:id` — Delete post (protected)

### Admin
- `GET /api/admin/unverified-users` — List unverified users (admin)
- `PATCH /api/admin/verify-user/:id` — Verify user (admin)
- `GET /api/admin/unverified-listings` — List unverified listings (admin)
- `PATCH /api/admin/verify-listing/:id` — Verify listing (admin)

---

## Data Models (Mongoose Schemas)

### User
```
name, email, passwordHash, googleSub, authProvider (password|google|both),
emailVerified, role (tenant|landlord|admin), verificationStatus (verified|unverified|pending),
avatar, phone, timestamps
```

### Listing
```
title, description, price, building (ref), address, createdBy (ref),
features, amenities, bedrooms, bathrooms, status (available|unavailable|pending),
isVerified, location (GeoJSON Point), timestamps
```

### Building
```
name, address, location (GeoJSON Point), average_rating, total_reviews, timestamps
```

### Review
```
title, comment, reviewer (ref), building (ref),
categories: { cleanliness, maintenance, amenities, security, water_availability, landlord_reliability } (each 1-5),
isAnonymous, verified, helpful (count), timestamps
```

### ForumPost
```
user (ref), post: [{ title, content, isAnonymous, resolved, upvotes, downvotes, comments }],
building (ref), timestamps
```

### Notification
```
User (ref), title, message, isRead, timestamps
```

---

## Iconography
- Use Heroicons (outline style, 24px) or Lucide icons
- Consistent 1.5-2px stroke width
- Common icons: Search, Map Pin, Home, Star, Heart, Shield Check, Plus, Trash, Edit, Bell, User, Filter
