# Boma Web App Design System Spec

This is the design system specification for the Boma Web App, designed for import into Google Stitch. It provides a cohesive visual framework that marries warm, earthy community aesthetics with a premium, state-of-the-art modern digital interface.

---

## 1. Design Philosophy & Theme: "Modern Homestead"
Boma (meaning homestead/enclosure in Swahili) focuses on trust, community, and quality living. The design system uses rich natural tones balanced with high-contrast slate surfaces, generous whitespace, rounded geometric shapes, and subtle shadows to create an interface that feels both deeply welcoming and highly premium.

---

## 2. Color Palette (Design Tokens)

### 2.1 Primary Brand Tones
*   **Deep Forest (Primary CSS: `--color-forest` / `#133127`):** Represents stability, home, and security. Used for headers, primary buttons, and hero backgrounds.
*   **Warm Honey (Accent CSS: `--color-honey` / `#F59E0B`):** Represents hospitality, warmth, and highlights. Used for key active indicators, star ratings, and CTA accents.
*   **Cream Sand (Base BG CSS: `--color-sand` / `#FAF6F0`):** Soft, warm off-white that reduces eye strain and establishes a welcoming editorial feel.
*   **Pure Light (Card BG CSS: `--color-white` / `#FFFFFF`):** High-contrast surface backing for listings, forums, and reviews.

### 2.2 Neutral Tone Scale
*   **Ink Black (CSS: `--color-ink` / `#0C110F`):** Used for primary body text, titles, and headers.
*   **Slate Grey (CSS: `--color-slate` / `#56635E`):** Used for secondary text, labels, and borders.
*   **Mist White (CSS: `--color-mist` / `#EAEFED`):** Border line color and divider rule color.

### 2.3 Semantic Accents
*   **Emerald Safe (CSS: `--color-emerald` / `#10B981`):** Represents "Verified" states, available listings, and positive action outcomes.
*   **Rose Alert (CSS: `--color-rose` / `#F43F5E`):** Represents favorites (heart icon), delete actions, and danger alerts.
*   **Amber Pending (CSS: `--color-pending` / `#D97706`):** Represents reviews pending approval, tenant verification processing, or occupied states.

---

## 3. Typography & Hierarchy
*   **Primary Font Family:** `Outfit` (fallback to `System-UI, sans-serif`) for headers and numbers to project a modern, friendly character.
*   **Secondary Font Family:** `Inter` (fallback to `sans-serif`) for body copy to ensure clean readability in dense listings.

### Scale:
*   **Hero / Display (40px, Semibold, Leading 1.1):** For landing pages and welcome headers.
*   **Section Header (24px, Bold, Leading 1.25):** For grid categories, listings details, and dashboard titles.
*   **Sub-header / Card Title (16px, Semibold, Leading 1.4):** For listings headers, post titles, and user profile names.
*   **Body Copy (14px, Regular, Leading 1.6):** For descriptions, reviews, and community post comments.
*   **Caption / Badge Text (11px, Bold, Tracking 0.05em):** For utility tags, labels, timestamps, and status details.

---

## 4. Spacing, Borders & Shadows
*   **Corner Radius (Border Radius):**
    *   `rounded-3xl` (`24px`): For large cards, dialogs, and modals.
    *   `rounded-2xl` (`16px`): For listing grids, forum card blocks, and input forms.
    *   `rounded-xl` (`12px`): For filter pills, buttons, and utility blocks.
    *   `rounded-full` (`9999px`): For badges, profile avatars, and select switches.
*   **Grid Spacing:**
    *   Gaps of `24px` (Desktop) / `16px` (Mobile) between listings.
    *   Page margins of `48px` (Desktop) / `16px` (Mobile).
*   **Shadows (Elevation):**
    *   `shadow-sm`: Subtle border alternative for secondary fields (`box-shadow: 0 1px 3px rgba(0,0,0,0.05)`).
    *   `shadow-md`: Default card layout depth (`box-shadow: 0 4px 20px -2px rgba(19, 49, 39, 0.06)`).
    *   `shadow-xl`: Float modals, sticky headers, and filter drawers (`box-shadow: 0 20px 40px rgba(12, 17, 15, 0.12)`).

---

## 5. UI Component Specifications

### 5.1 The Boma Nav Bar (Responsive Header)
*   **Background:** Mist White backdrop blur (`backdrop-filter: blur(12px) bg-white/90`).
*   **Left Anchor:** Round geometric Boma logo (Deep Forest box with Warm Honey "B"), with a text label `BOMA` tracked at `0.24em`.
*   **Right Anchor (Guest):** "Sign In" (Slate Grey, plain text) + "Create Account" (Forest Green capsule, White text).
*   **Right Anchor (Authenticated):** User avatar (gradient fallback) + name display + "Logout" border button.

### 5.2 Airbnb-style Search & Filter Bar
*   **Layout:** Sticky horizontal block, floating above the fold on scroll.
*   **Fields:**
    *   Search Input (Location/Keyword) with search icon indicator.
    *   Dropdown: "Listing Status" (Available, Unavailable, Pending).
    *   Dropdown: "Sort By" (Newest, Price: Low-High, Price: High-Low).
    *   Input Pair: "Min Price" / "Max Price" with KES formatting.
    *   Toggle Pill: "Verified Only" with a green check/shield icon.
    *   Text Button: "Clear All" (only displays if filters are active).

### 5.3 The Boma Premium Listing Card
*   **Visual Structure:**
    *   Aspect ratio `4:3` photo container with smooth zoom effect on hover (`scale-110`).
    *   Upper badge clusters: "New" (Amber gradient), "Verified" (Emerald shield), and "Unavailable" (Ink Black tag).
    *   Floating top-right Favorite Heart toggle (swaps from line border to solid Rose Red with active state).
    *   Floating bottom-left price badge: "KES XX,XXX / mo" in a blur-backed glass pill.
    *   Card text block: bold title with a star rating indicator on the right (e.g. `★ 4.8`).
    *   Location text with map pin icon.
    *   Amenities tags: "X beds" (bed icon), "Y baths" (shower icon).
    *   Avatar footer showing listing creator (Landlord or User name).
*   **Hover State:** Card scales `1.02` and raises shadow depth with a subtle color lift on the border.

### 5.4 Building Rating & Review Block
*   **Structure:**
    *   Overall Building Card showing average score and breakdown grid.
    *   6 Category sliders (Cleanliness, Maintenance, Amenities, Security, Water Availability, Landlord Reliability) out of 5 stars, displayed as horizontal color bars (filled Forest Green to Warm Honey).
    *   User reviews displaying a title, comment, anonymous toggle marker, and a "Helpful" thumbs-up count button.

### 5.5 Community Discussion Thread
*   **Structure:**
    *   Post cards inside a forum feed with title, content body, creator avatar (or Anonymous mask).
    *   Upvote / Downvote numeric indicator block.
    *   "Resolved" status pill (green check box when tenant query is answered).
    *   Comments bubble button displaying count of responses.
