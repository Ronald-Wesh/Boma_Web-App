# Boma Web App Google Stitch Screen Generation Guide

This guide contains step-by-step instructions and high-fidelity text prompts that you can copy-paste directly into Google Stitch (or execute via the `StitchMCP` tool server) to generate the frontend pages of your Boma Web App.

---

## 1. Project Creation & Setup Instructions

To build the Boma frontend using Google Stitch, follow these three steps:

### Step 1: Create the Stitch Project
Initialize a project named **Boma** (targeting Desktop/Responsive layouts):
*   Using Stitch UI: Click **Create New Project** and name it `Boma`.
*   Using MCP:
    ```json
    // call_mcp_tool -> ServerName: "StitchMCP", ToolName: "create_project"
    {
      "name": "Boma"
    }
    ```

### Step 2: Upload the Design System (`STITCH_DESIGN.md`)
Upload the design tokens to establish consistent colors (Deep Forest `#133127`, Warm Honey `#F59E0B`, Cream Sand `#FAF6F0`), fonts (`Outfit` / `Inter`), rounded corners, and components.
*   Using MCP:
    ```json
    // call_mcp_tool -> ServerName: "StitchMCP", ToolName: "upload_design_md"
    {
      "projectId": "<YOUR_STITCH_PROJECT_ID>",
      "designMdBase64": "<BASE64_ENCODED_CONTENT_OF_STITCH_DESIGN_MD>"
    }
    ```
    *(Note: You can encode the file using `base64 -w 0 STITCH_DESIGN.md` in your terminal, then call `create_design_system_from_design_md` to apply it.)*

### Step 3: Generate the Screens using Prompts
Copy the prompts below into Google Stitch's prompt generator (`generate_screen_from_text`) to build each page.

---

## 2. High-Fidelity Screen Generation Prompts

### Prompt 1: Authentication Page (Sign-in & Sign-up)
**Target File:** `client/src/Pages/Auth.jsx`
**Stitch Prompt:**
```text
Create a premium, responsive Authentication screen for a housing application named 'Boma'. 
Layout style: A two-column split layout for desktop, stacking vertically on mobile.
Left Column: 
- Background color should be deep forest green (#133127) with a subtle golden glow radial gradient in the top-right corner.
- Three badge capsules at the top displaying in gold text: 'Find better homes', 'Rent with confidence', 'Live smarter'.
- A main typography title: 'Rent decisions move faster when identity is simple' in white, using Outfit font.
- Paragraph text describing the app: 'Find verified rental listings, connect with your community, and view honest tenant reviews.'
- A card collection displaying Boma highlights: 'Smart Listings', 'Building Communities', 'Real Tenant Reviews'.
Right Column:
- Warm off-white sand background (#fffdf8).
- A card toggle at the top with a pill control switcher: 'Sign In' / 'Create Account'.
- A 'Continue with Google' button with a Google icon, styled as a white pill with a thin border.
- A clean divider reading 'or use email'.
- Form fields: 'Full Name' (only shown if Create Account is selected), 'Email Address' (placeholder you@example.com), 'Password' (placeholder 'At least 8 characters'), and a Role dropdown selection for 'Tenant' or 'Landlord'.
- A primary button 'Create Boma Account' in deep slate/forest green with a hover animation.
Aesthetics must be clean, spacious, using rounded-2xl corners, and Outfit/Inter fonts.
```

---

### Prompt 2: Main Listings Feed Page (Home Grid)
**Target File:** `client/src/Pages/Listing.jsx`
**Stitch Prompt:**
```text
Create a premium, responsive Listings Feed homepage for the 'Boma' rental web application.
Structure:
1. Navbar Header: 
   - Floating glassmorphic white banner with blur effect.
   - Left side: Boma logo (square forest green icon with a warm amber 'B') and the text 'BOMA'.
   - Right side: User avatar circle, name label 'Amina Wanjiru', and a rounded-full outline button 'Logout'.
2. Hero Banner:
   - Gradient banner background transitioning from indigo-600 to purple-600.
   - Title 'Discover Spaces' in white, subtext 'Find your perfect student home or rental'.
   - Action button on the right: 'Create Listing' with a plus icon.
3. Sticky Search & Filter Container (Floating -16px overlap into the hero banner):
   - White card panel with rounded-2xl corners and high drop shadow.
   - Search bar input with search icon, placeholder: 'Search by location, title, or keyword...'.
   - A row of filters:
     * 'All Status' dropdown picker (Available, Unavailable, Pending).
     * 'Sort By' dropdown picker (Newest First, Price: Low to High, Price: High to Low).
     * Two price input boxes: 'Min KES' and 'Max KES'.
     * 'Verified Only' toggle badge styled in emerald green border with shield check-mark icon.
     * 'Clear All' gray text button.
4. Grid Layout (4 columns on desktop, 2 on tablet, 1 on mobile):
   - Render a series of Boma Listing Cards:
     * Card image with 4:3 aspect ratio, showing modern apartment interior.
     * Badges overlay on top left: 'New' (orange badge) and 'Verified' (emerald green shield badge).
     * Top-right heart toggle in rose pink.
     * Floating bottom-left price badge: 'KES 45,000/mo' on a blurred white glass pill.
     * Card body text: Title 'Modern Studio at Oasis Heights', rating '★ 4.8', address 'Madaraka, Nairobi', specifications '1 bed • 1 bath'.
     * Card footer: Small round avatar and the landlord's name.
5. Pagination:
   - 'Load More' gradient button styled with arrow-down icon and loading state capability.
Apply the 'Modern Homestead' design token palette: Deep Forest (#133127), Warm Honey (#F59E0B), and Cream Sand (#FAF6F0) background page coloring.
```

---

### Prompt 3: Listing Detail Page (Property Deep-Dive)
**Target File:** `client/src/Pages/ListingDetail.jsx` (New Page)
**Stitch Prompt:**
```text
Create a detailed, responsive Listing Detail page for a rental property on the 'Boma' platform.
Layout: Top image showcase, followed by a two-column detail section (70% info, 30% sticky contact panel).
1. Image Gallery Showcase:
   - A large, cinematic header image container with rounded-3xl corners.
   - A bottom overlay strip containing thumbnail previews, click to zoom indicator, and active badges: 'Verified Listing' (emerald) and 'Available' (forest green).
2. Left Column (Main Info):
   - Title header: 'Sunlit 2-Bedroom near Strathmore University', location pin label 'Ole Sangale Rd, Madaraka'.
   - Specifications bar: Row of pill tags with icons for '2 Bedrooms', '2 Bathrooms', '1,200 sq ft', 'Fully Furnished'.
   - Description Section: Editorial layout with readable line spacing explaining lease conditions, utilities, and vicinity.
   - Amenities Checklist: Grid of checkmark icons showing 'High-Speed Wi-Fi', '24/7 Security', 'Water Borehole', 'Backup Generator', 'Balcony'.
   - Building Overview Link: Card indicating that this listing is inside 'Oasis Heights Apartment' showing overall building score: '4.7/5.0 Stars (24 Reviews)'.
3. Right Column (Sticky Reservation & Contact Panel):
   - Card container with high drop shadow.
   - Price highlight: 'KES 65,000 / month' with helper text 'Utilities excluded'.
   - Landlord Profile Card: Rounded avatar, 'Verified Landlord' badge, phone and email contact button actions.
   - 'Schedule a Viewing' date picker and a text input message field.
   - Primary Call-to-Action: 'Apply to Rent' button in primary Forest Green (#133127) with hover active highlights.
Background must be warm Sand color (#FAF6F0), typography should use Outfit font for headings.
```

---

### Prompt 4: Building Profile & Reviews Screen (Ratings Breakdown)
**Target File:** `client/src/Pages/BuildingProfile.jsx` (New Page)
**Stitch Prompt:**
```text
Create a premium Building Profile & Reviews dashboard screen for 'Boma'.
Header:
- Title 'Oasis Heights Apartment' with address details and average rating star display: '★ 4.6 (18 Reviews)'.
Main Dashboard Layout:
1. Rating Summary Widget (Top Left):
   - Big numerical score display '4.6' out of 5, inside a circle gradient.
   - Six horizontal rating bar sliders representing dimensions:
     * Cleanliness: 4.8 / 5
     * Maintenance: 4.5 / 5
     * Amenities: 4.2 / 5
     * Security: 4.9 / 5
     * Water Availability: 4.7 / 5
     * Landlord Reliability: 4.3 / 5
   - Sliders must have colors scaling from Warm Honey (#F59E0B) to Forest Green (#133127).
2. Review Feed (Right Column/Details):
   - Sort dropdown: 'Most Helpful', 'Recent', 'Highest Rating'.
   - Reviews cards with:
     * Reviewer info: Avatar, verified tenant badge (or 'Anonymous Reviewer' mask).
     * Review title 'Peaceful place but elevator is slow sometimes' and a detailed comment body.
     * Category ratings checklist.
     * 'Helpful (12)' thumbs-up button and report flag action.
3. Add Review Action:
   - 'Write a Review' floating Action button that opens a card modal with:
     * Stars sliders for each of the 6 categories.
     * Title and Review comment textbox.
     * Toggle switch for 'Post Anonymously'.
     * Dropdown verifying tenant status: 'Current Renter', 'Past Renter', 'Visitor'.
Aesthetics should use rounded-2xl panels, soft borders, and warm sand background surfaces.
```

---

### Prompt 5: Building Forums Screen (Neighborhood Discussions)
**Target File:** `client/src/Pages/Forum.jsx` (New Page)
**Stitch Prompt:**
```text
Create a responsive Building Community Forum screen for 'Boma' to host tenant discussions.
Layout: Left sidebar listing building buildings, right main thread list.
1. Building Sidebar:
   - Search box for buildings.
   - Vertical list of building cards showing active thread count (e.g. 'Oasis Heights - 14 active posts', 'Riverview Towers - 3 posts').
2. Main Forums Section:
   - Header with title: 'Oasis Heights Community Forum'.
   - Action Button: 'Start a Discussion' with message icon.
   - Filter pills: 'All Threads', 'Resolved Issues', 'Active Questions', 'Announcements'.
3. Discussion Cards Feed:
   - Card 1 (Issue): Title: 'Water outage scheduled for Tuesday maintenance?' marked with an orange status tag: 'Question'. Creator avatar shows 'Anonymous Tenant'. Upvote/Downvote pill indicator showing '+18'. Comment button showing '7 Comments'.
   - Card 2 (Announcement): Title: 'New CCTV Cameras installed in Parking Lot B' with a green status tag: 'Announcement' signed by 'Landlord - Mr. Kamau'. Upvote '+32'.
   - Card 3 (Resolved Issue): Title: 'Elevator squeaking sound fixed' with a green checkmark icon badge labeled 'Resolved'.
4. Simple post creator drawer:
   - Quick-input form fields: 'Title', 'Content', and a checkbox toggle for 'Post anonymously to protect tenant privacy'.
Theme: Warm sand background, Deep Forest headers, and rounded-2xl discussion panels with clean light borders.
```

---

### Prompt 6: Landlord Dashboard & Listing Management
**Target File:** `client/src/Pages/LandlordDashboard.jsx` (New Page)
**Stitch Prompt:**
```text
Create a clean, responsive Landlord Dashboard screen for the 'Boma' housing system.
Header:
- Dashboard greeting: 'Welcome back, Kamau Properties' with quick stats summaries (Total Listings: 8, Occupied: 6, Active Leads: 14, Pending Approvals: 1).
Main Section Layout:
1. Quick Action Header:
   - 'Create New Listing' button (forest green) and 'Manage Tenancy' button.
2. Listings Management Grid (Cards or List Table):
   - Listing items showing a thumbnail, title, price (KES 45,000), views counter, and active status toggles:
     * A switch indicating status: 'Available' (green text), 'Unavailable' (gray text), 'Pending' (amber text).
     * Edit listing button, View inquiries button, and Delete listing icon.
3. Verification Requests Sidebar:
   - List of pending tenant requests: 'John Doe - requesting tenant verification badge for Oasis Heights Room 4B'.
   - Action buttons: 'Approve' (emerald capsule) / 'Decline' (outline).
Aesthetics must be professional, utilizing flat layout design cards with thin gray lines, deep forest green accent colors, and clear data labels.
```

---

## 3. How to Connect Generated Screens to Your Express/Node Backend
When Stitch generates these screens as React component structures, hook them up to the existing API layer found in [api.js](file:///home/ronald/Desktop/Personal-Projects/Boma_Web-App/client/src/Utils/api.js):

1.  **Auth Screen** maps to `authAPI.login` and `authAPI.register` endpoints.
2.  **Listings Grid Screen** maps to `listingAPI.getAllListings(params)` with pagination `loadMore`.
3.  **Listing Detail Screen** maps to `listingAPI.getListingById(id)`.
4.  **Building Profile & Reviews Screen** maps to `buildingAPI` (which you can connect to `/api/buildings` and `/api/reviews` routes in the backend).
5.  **Community Forums Screen** maps to the `/api/forum` routes in your Express app.
