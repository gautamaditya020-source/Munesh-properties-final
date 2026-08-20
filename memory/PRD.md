# Munesh Properties — PRD

## Original Problem Statement
Real estate app + website for "Munesh Properties" (Uttar Pradesh). Deals in Plots, Homes, Land, and Shops (buy/sell) across Khair, Aligarh, Mathura Road, Agra Road, Jewar, Tapal, Jatari, and New Yamuna Expressway. Needs an admin panel to upload latest images/videos of properties and full control over site content, prominent communication buttons (WhatsApp, Telegram, Phone, Email), editable contact details, and a separate enquiry form. Admin login: Munesh2006 / Aditya198@#.

## Architecture
- **Frontend:** Expo Router (React Native + Web) with bottom tabs: Properties, Enquiry, Contact, Admin. Works on Expo Go + mobile web.
- **Backend:** FastAPI (`/api` prefix) + MongoDB (motor).
- **Auth:** JWT single-admin (username/password from backend `.env`, bcrypt-hashed at startup).
- **Media:** Emergent Managed Object Storage (images + videos), served via `/api/files/{path}`.

## User Personas
1. **Buyer/Visitor** — browses listings, filters by type/location, views details, contacts via WhatsApp/Call/Telegram/Email, submits enquiry.
2. **Admin (Munesh)** — manages listings (add/edit/delete), uploads photos/videos, reviews enquiries, edits contact details.

## Core Requirements (static)
- Property listings with type, location, price, area, description, amenities, status, media.
- Category + location filtering + search.
- Prominent contact channels (WhatsApp, Telegram, Phone, Email).
- Enquiry form (standalone + per-property).
- Secure admin panel with full content control.

## Implemented (2026-08-20)
- Home feed with sticky header, quick WhatsApp/Call, search, category & location chips, property cards with gradient scrims + status/featured badges.
- Property details: image/video gallery, amenities grid, persistent bottom CTA (WhatsApp/Call/Enquiry).
- Enquiry form with success state (keyboard-aware).
- Contact screen with 4 highlighted channels + areas served + about.
- Admin moved to a dedicated hidden page at /admin (removed from public tabs); reachable in-app via long-press on the home logo. Auto-logout when the admin panel is closed.
- Bilingual UI (Hindi default + English) with in-app हि/EN toggle, persisted; location names transliterated.
- Admin: JWT login, dashboard (Listings / Enquiries / Settings), property CRUD with image & video upload to Object Storage, editable contact details.
- Backend APIs (public + admin) — 23/23 pytest passing. Frontend flows verified 100%.
- 8 sample properties + default contact seeded.

## Backlog / Remaining
- P1: Favorites / saved properties (needs user auth).
- P2: Map view of listings; share property link; multi-image reorder in admin.
- P2: Migrate deprecated RN Web `shadow*` props to `boxShadow` (cosmetic warnings only).

## Next Tasks
- Gather admin's real WhatsApp/Telegram/Phone/Email and replace seeded defaults (via Admin → Settings).
- Optional: EMI/price calculator, featured carousel on home top.
