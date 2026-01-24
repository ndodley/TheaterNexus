# TheaterNexus

## Project Description

TheaterNexus is a full‑stack movie ticketing prototype for browsing **movies**, **theaters**, and **showtimes**, then completing authenticated user actions like **favorites**, **reviews**, and **orders**.

- **Backend:** Django REST Framework API + JWT auth
- **Frontend:** React + TypeScript (Vite)
- **Database:** PostgreSQL

This repo is intentionally built like a real product: clear domain models (theaters → screens → seats, showtimes, carts/orders) and UI flows that match the API.

## Purpose

Created as a portfolio project for software engineering roles; feedback and collaboration welcome.

The goal is to demonstrate job‑relevant full‑stack skills: designing relational data models, building a secure REST API (JWT auth), implementing business logic (showtimes/seats/holds), and delivering a React + TypeScript UI that integrates with payments.

## Highlights (for recruiters)

- **Real domain logic (not just CRUD):** seat maps, seat availability, time‑limited holds, and showtime scheduling rules.
- **End‑to‑end purchase pipeline:** cart → checkout → order → ticket issuance (ticket codes).
- **Auth & profiles:** custom user model, JWT access/refresh, logout via token blacklisting, profile + avatar upload.
- **Modern onboarding:** email verification flow + Google sign-in (Google Identity Services → backend token verification → JWT issuance).
- **Payments-ready:** Stripe PaymentIntent + webhook handler + payment event logging.

## Screenshots & Walkthrough

The screenshots below show the major pages and the difference between signed‑out vs. signed‑in experiences.
Protected pages (cart, checkout, orders, favorites, profile, reviews) redirect to login when signed out.

### Home Page

The home page is a high-level entry point that highlights featured content and routes users into the core browsing flows (movies, theaters, showtimes).

<img width="958" height="492" alt="Home page (signed out)" src="https://github.com/user-attachments/assets/495973c5-f306-4b8b-8bbc-b13432df05da" />
<img width="959" height="494" alt="Home page (signed out - scrolled)" src="https://github.com/user-attachments/assets/a2019648-e4ff-4280-bf76-fc6bf213fc3b" />

#### Signed in

When signed in, the navigation and available actions expand to include user-specific features (favorites, reviews, order history, and profile access).

<img width="959" height="491" alt="Home page (signed in)" src="https://github.com/user-attachments/assets/2fbf8180-df20-423a-805e-f5b2608bb1cd" />

### Movies List Page

The Movies page supports browsing, searching, and filtering/sorting so users can quickly find titles they’re interested in.

<img width="959" height="493" alt="Movies list" src="https://github.com/user-attachments/assets/2e31e667-a6ff-41ee-bc97-f6844c1b700e" />
<img width="957" height="490" alt="Movies list" src="https://github.com/user-attachments/assets/abd32c72-e5ac-453c-bdb6-f25e1d519c8f" />
<img width="956" height="493" alt="Movies list" src="https://github.com/user-attachments/assets/d5d54e23-6291-476a-a1ab-62fa319275bd" />

### Movie Details Page

The Movie Details page is where users view plot/metadata, see review information, and transition into showtimes and ticket selection.

#### Signed out

Signed-out users can browse movie details and read information without committing to an account.

<img width="958" height="456" alt="Movie details (signed out)" src="https://github.com/user-attachments/assets/92522069-5230-49b2-9006-d20e9c8f47d9" />

#### Signed in

Signed-in users can take action: favorite movies, write/manage reviews, and proceed through the ticketing flow.

<img width="953" height="494" alt="Movie details (signed in)" src="https://github.com/user-attachments/assets/0844670b-1071-4839-a65d-b74cf0a1de0d" />

### Showtimes Page

The Showtimes page focuses on time-based discovery and is designed to feed directly into seat selection.

What this view demonstrates:

- **Filtering and discovery:** filter controls are visible (movie/theater/date) to quickly narrow showtimes.
- **Fast path to purchase:** the list is structured around picking a showtime and moving directly to seats.
- **Backend consistency:** showtimes follow scheduling validation rules (no overlapping showtimes per screen).

<img width="959" height="491" alt="Showtimes page (filters + list)" src="https://github.com/user-attachments/assets/3af48bc5-d93c-44a7-b5f8-27e131480d3c" />
<img width="958" height="491" alt="Showtimes page (filters applied)" src="https://github.com/user-attachments/assets/5028dfd4-1b4a-4da6-94d6-98a1958d5b2e" />

### Showtimes Seat Selection Page

This page turns a showtime into a seat map with availability.

What this view demonstrates:

- **Seat map rendering:** seats are shown in a grid per screen.
- **Availability logic:** unavailable seats are visually blocked (already held or already sold).
- **Add-to-cart behavior:** selecting seats creates time-limited holds so two users can’t buy the same seat at the same time.

<img width="959" height="496" alt="Seat selection" src="https://github.com/user-attachments/assets/f0bf9087-4154-432b-9b31-da8962ace29a" />

### User Cart Page

The cart groups tickets by showtime and keeps the user focused on the purchase decision.

What this view demonstrates:

- **Grouping by showtime:** prevents confusion when a user has tickets for different movies/times.
- **Seat-level management:** remove individual seats without clearing the entire cart.
- **Hold awareness:** carts reflect time-limited seat holds; the UI is designed to recover cleanly if holds expire.

<img width="958" height="493" alt="Cart page" src="https://github.com/user-attachments/assets/a4c5ac1a-7c15-4be9-a620-5d879c41695a" />

### User Checkout Page

Checkout converts the cart into a payment intent and finalizes the order after payment succeeds.

What this view demonstrates:

- **Stripe Elements UI:** card input is handled by Stripe (no raw card data hits the backend).
- **Backend-driven totals:** totals come from the server/cart state (not trusted from the browser).
- **Purchase pipeline:** cart → create payment intent → confirm payment → finalize order → tickets.

<img width="960" height="489" alt="Checkout page" src="https://github.com/user-attachments/assets/ab1e91a5-b53b-4115-914b-562610e58a7e" />

### User Payment Successful Page

After Stripe confirms payment, the user lands on a confirmation page.

What this view demonstrates:

- **Clear end-state:** user sees a successful purchase state instead of being left on a processing screen.
- **Order handoff:** the next step is to view order history/details (tickets + codes).

<img width="958" height="496" alt="Payment success / confirmation" src="https://github.com/user-attachments/assets/13a15092-b29d-4980-b57b-1929b320c761" />

### Theaters Page

The Theaters page provides location-based browsing. Each theater links into its screens and showtimes.

What this view demonstrates:

- **Entity navigation:** theater list → theater details/showtimes.
- **Separation of concerns:** theaters are managed independently from movies and showtimes.
- **Scalable modeling:** the data model supports multiple screens per theater.

<img width="958" height="455" alt="Theaters list" src="https://github.com/user-attachments/assets/dfc1ed48-186f-4193-918f-bfe8dee193a6" />

### Theater Showtimes Page

The Theater Showtimes page shows what’s playing at a specific theater and helps users pick a movie + showtime combination.

What this view demonstrates:

- **Time-based browsing within a theater:** showtimes are grouped/filtered to reduce decision friction.
- **Clear handoff:** each showtime links into seat selection.

<img width="958" height="494" alt="Theater showtimes" src="https://github.com/user-attachments/assets/8d8c41be-ea47-4fc8-873a-1f0929495115" />

### Login / Register

Authentication uses JWT (access/refresh). Users can sign in with email/password or Google, and new accounts go through an email verification flow.

Onboarding flow:

1. Register (email/password) or continue with Google
2. New users land on Welcome, then verify email (email/password signups)
3. Once verified, the user can continue browsing and purchasing

#### Login

Modern sign-in with Google + email/password.

<img width="958" height="494" alt="Login (Google + email)" src="https://github.com/user-attachments/assets/e10bd818-4ef7-4316-9b3f-c7109b885ab9" />

#### Register

Fast signup focused on the essentials (name, email, password) plus Google.

<img width="958" height="493" alt="Register (Google + email)" src="https://github.com/user-attachments/assets/fc67fea1-c5a4-432d-b518-3a806826aea2" />

#### Welcome

Welcome page acts as the “post-auth hub” and surfaces verification state with clear calls to action.

<img width="952" height="489" alt="Welcome (verified)" src="https://github.com/user-attachments/assets/b8be6e02-5f42-4694-bfd2-181cc0f865cc" />

### Profile

Users can view/update profile details and upload an avatar (stored as media on the Django side).

<img width="957" height="490" alt="Profile" src="https://github.com/user-attachments/assets/02549ace-f54e-4442-b996-4cf2284713ff" />

### My Favorites

Favorites are tied to the authenticated user and allow quick access to saved movies.

<img width="958" height="490" alt="Favorites" src="https://github.com/user-attachments/assets/afc9892e-4533-4f59-aba2-cb010f41df97" />
<img width="959" height="494" alt="Favorites (alternate view)" src="https://github.com/user-attachments/assets/bf557294-c032-47e8-b62e-c1f696ecf164" />

### My Orders

Orders represent completed (or in-progress) purchases. This section is meant to show order history and status.

What this view demonstrates:

- **Order history:** list of purchases tied to the authenticated user.
- **Traceability:** each order links to a detail view with purchased seats/tickets.

<img width="955" height="494" alt="Orders history" src="https://github.com/user-attachments/assets/b2e09f79-4e8f-42b7-b6d1-fc41197cfa63" />

### Order Details

Order Details show the seats/tickets purchased for a specific showtime along with any ticket codes generated by the backend.

What this view demonstrates:

- **Ticket-level records:** each seat purchase becomes a ticket.
- **Codes for validation:** ticket codes are meant for real-world scan/check-in flows.
- **Full context:** showtime + theater/screen details stay attached to the purchase.

<img width="959" height="490" alt="Order details" src="https://github.com/user-attachments/assets/182ba111-56ed-468c-818f-ce8e6f6479c7" />

### My Reviews

Reviews are linked to both a movie and the authenticated user. Users can view and manage their reviews from a dedicated page.

What this view demonstrates:

- **Per-user content:** reviews are scoped to the authenticated user.
- **Ownership rules:** users can edit/delete their own reviews (not others’).
- **Movie linkage:** reviews remain tied to the movie for display on details pages.

<img width="958" height="491" alt="My reviews" src="https://github.com/user-attachments/assets/42581842-51f2-4d98-9bcb-4104c08e4691" />

## Admin Data Ops (for interviewers)

- **CSV Export:** One-click exports across Users, Movies, Orders, Reviews, Theaters/Screens/Seats, and Showtimes. Implementation is iterator/prefetch-safe.
- **Bulk Upload:** Movies and Users support CSV templates, a CSV Columns preview, and a grid-based preview/confirm. Export schemas align with upload templates for round-trip edits.
- **Access:** In dev, create a superuser and visit `/admin`. Look for "Download CSV" and "Bulk Upload" actions on change list pages.
- **Extensible:** Other models are export-ready; bulk upload can be added similarly.

## Django Admin Pages (details)

### Users Admin

- **Purpose:** Manage custom users (email as username) and roles.
- **Data ops:** "Download CSV", "Bulk upload", and "Download CSV template" on the change list.
- **Bulk upload flow:**
  - Upload CSV → Columns preview → Grid preview (create/update detection) → Confirm.
  - **Security:** Password column is masked in preview; blank passwords set an unusable password; updates are matched by email.
  - **Round-trip:** Export uses the same columns as the template so you can export → edit → re-import cleanly.
- **Fields covered:** email, first/last name, role, is_active, is_staff, email_verified, phone_number, date_of_birth, password (exported blank).
  <img width="960" height="496" alt="image" src="https://github.com/user-attachments/assets/588c6cfa-a1d2-4fe2-a0d5-3f8763c5a093" />
  <img width="959" height="491" alt="image" src="https://github.com/user-attachments/assets/7a9f7e45-0158-4bee-b5a9-d0436c527c4b" />
  <img width="958" height="493" alt="image" src="https://github.com/user-attachments/assets/7669a20b-580d-481b-a938-255941f18e8b" />

### Movies Admin

- **Purpose:** Manage titles and metadata used across showtimes and orders.
- **Data ops:** Change list includes "Download CSV", "Bulk upload", and "Download CSV template".
- **Schemas:** Export aligns with bulk upload columns: title, duration_minutes, plot_summary, release_date, availability_status, rating_average, genres (comma-separated), image_url.
- **Bulk upload flow:** Template → upload → preview grid → confirm.
  <img width="959" height="494" alt="image" src="https://github.com/user-attachments/assets/6c3246c0-660d-4607-ad0d-ffc6b221d4ea" />
  <img width="958" height="490" alt="image" src="https://github.com/user-attachments/assets/f5d559d6-a708-4c32-9a6c-8a5caaae4d8d" />
  <img width="958" height="492" alt="image" src="https://github.com/user-attachments/assets/47ba2fd9-e40f-4e15-bc74-48ff8aa57dfe" />

### Showtimes Admin

- **Purpose:** Schedule showtimes with overlap rules and pricing.
- **Data ops:** "Download CSV" on the change list; default search + filters; show counts.
- **Schedule generator:** Inline form at the top with Movie, Theater (optional), Start/End dates, Times (e.g., `19:00,21:30`), Base price, Status.
  - Chooses available screens per theater/day; enforces non-overlap; skips duplicates.
  - Actions include Cancel selected, Shift +15 minutes, Shift by 1/2 days.
- **Safety:** CSV export is iterator/prefetch-safe.
  <img width="959" height="493" alt="image" src="https://github.com/user-attachments/assets/cbfba097-1755-4d6e-b16e-592b0d809d5d" />

### Theaters / Screens / Seats Admin

- **Purpose:** Manage locations, auditoriums, and seating.
- **Data ops:** Change lists include "Download CSV" for fast audit/export.
- **Seat layouts:** Seats are generated via the management command documented below; admin pages provide inspection and export.
  <img width="959" height="494" alt="image" src="https://github.com/user-attachments/assets/da5cd882-6848-4fa6-94ff-e5ec40dd2671" />

### Orders Admin

- **Purpose:** Operational view of purchases and ticket issuance.
- **Data ops:** "Download CSV" for reconciliation and reporting; includes status and pricing details.
  <img width="959" height="494" alt="image" src="https://github.com/user-attachments/assets/7d4f4b26-6acb-4cac-8d49-69e1df3c1849" />

### Reviews Admin

- **Purpose:** Moderate and analyze user reviews per movie.
- **Data ops:** "Download CSV" with user/movie linkage for external analysis.
  <img width="959" height="494" alt="image" src="https://github.com/user-attachments/assets/980b7c5e-acf2-4304-b237-753d28f50be7" />

## Tech stack

- **Backend:** Django 5 + Django REST Framework + SimpleJWT
- **Database:** PostgreSQL
- **Frontend:** React + TypeScript + Vite
- **Payments:** Stripe (PaymentIntents + webhooks)

## Run locally

### Prerequisites

- Python 3.11+ (works on newer versions too)
- Node.js 18+ (or newer)
- PostgreSQL running locally

### 1) Backend (Django API)

From `backend/`:

1. Create and activate a virtual environment
2. Install dependencies: `pip install -r requirements.txt`
3. Configure env vars:
   - Copy `backend/.env.example` → `backend/.env`
   - Required (Auth): `GOOGLE_OAUTH_CLIENT_ID`, `FRONTEND_BASE_URL`
   - Optional (Email): SMTP settings (`EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, etc.)
4. Run migrations: `python manage.py migrate`
5. Create an admin user (optional): `python manage.py createsuperuser`
6. Run the server: `python manage.py runserver`

API runs at `http://127.0.0.1:8000`.

### 2) Frontend (React)

From `frontend/`:

1. Install deps: `npm install`
2. Configure API base:
   - Copy `frontend/.env.example` → `frontend/.env`
   - Set `VITE_API_BASE` (defaults to `http://127.0.0.1:8000`)
   - Set `VITE_GOOGLE_CLIENT_ID` to enable the Google button
3. Start dev server: `npm run dev`

Frontend runs at `http://localhost:5173`.

## Useful dev commands

### Generate seats for a screen

After creating a Theater + Screen in the admin, generate a standard seat layout:

- `python manage.py generate_seat_layout <screen_id> --rows 8 --seats-per-row 12`

## API overview (selected)

- Auth: `/api/auth/…` (register, login/JWT, me/profile)
- Movies & Genres: `/api/movies/`, `/api/genres/`
- Theaters: `/api/theaters/`, `/api/screens/`, `/api/seats/`
- Showtimes: `/api/showtimes/` and `/api/showtimes/<id>/seats/`
- Orders/Cart: `/api/orders/cart/`, `/api/orders/checkout/create-intent/`, `/api/orders/webhooks/`
- Reviews: `/api/reviews/…`

## Notes

- Portfolio-style prototype intended to demonstrate full-stack engineering skills.
- Built iteratively using “vibe coding” with GitHub Copilot in VS Code.

## Next Steps

- Add optional providers (GitHub/Facebook) if desired.
- Connect to movie theater APIs to automate capturing movie/showtime data once a day.
- Expand movie details (cast, trailers, richer media).
