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

- **Real domain logic (not just CRUD):** seat maps, seat availability, time‑limited holds, and showtime scheduling rules — including a "one movie, one room per theater per day" constraint enforced both in the admin scheduler and in model validation.
- **End‑to‑end purchase pipeline:** cart → checkout → order → ticket issuance (ticket codes).
- **Auth & profiles:** custom user model, JWT access/refresh, logout via token blacklisting, profile + avatar upload.
- **Modern onboarding:** email verification flow + Google sign-in (Google Identity Services → backend token verification → JWT issuance), inside a redesigned auth UI.
- **Payments-ready:** Stripe PaymentIntent + webhook handler + payment event logging.
- **Data integrity, not just data display:** each movie's rating average recalculates automatically via a Django signal whenever a review is created, edited, or deleted, with a management command to backfill historical data.
- **Consistent UI system:** one shared pagination hook powers every list view (Movies, Theaters, Favorites, Showtimes, My Reviews, and per-movie reviews), and a single CSS custom-property theme drives light/dark mode everywhere.

## Screenshots & Walkthrough

The screenshots below show the major pages and the difference between signed‑out vs. signed‑in experiences.
Protected pages (cart, checkout, orders, favorites, profile, reviews) redirect to login when signed out.

### Home Page

The home page is a high-level entry point that highlights featured content and routes users into the core browsing flows (movies, theaters, showtimes).

<img width="1998" height="1075" alt="Home page (signed out)" src="https://github.com/user-attachments/assets/68174fc6-b13c-4939-bd2f-7b2a9bddac18" />
<img width="1999" height="1032" alt="Home page (signed out) - Now Showing carousel" src="https://github.com/user-attachments/assets/f32b6382-1be1-45c5-af61-5e75aa299db6" />
<img width="1997" height="1030" alt="Home page (signed out) - scrolled" src="https://github.com/user-attachments/assets/9f10b48d-dc80-432c-93b8-3b80e0030ec6" />
<img width="1999" height="1031" alt="Home page (signed out) - footer" src="https://github.com/user-attachments/assets/59dc3a7c-5878-40c1-b453-3f9f06af69b2" />

#### Signed in

When signed in, the navigation and available actions expand to include user-specific features (favorites, reviews, order history, and profile access).

<img width="1999" height="1033" alt="Home page (signed in)" src="https://github.com/user-attachments/assets/ca8b98f2-3bbe-4325-9e68-4fb0b6670b53" />

### Movies List Page

The Movies page supports browsing, searching, and filtering/sorting so users can quickly find titles they’re interested in.

<img width="1998" height="1030" alt="Movies list" src="https://github.com/user-attachments/assets/77a14e8a-56b1-46df-aa5d-9fdf52e32075" />
<img width="1999" height="1032" alt="Movies list - filters open" src="https://github.com/user-attachments/assets/16d5b596-bd1b-45f2-80b5-74a42fcb7c89" />
<img width="1999" height="1030" alt="Movies list - filtered results" src="https://github.com/user-attachments/assets/e2fdada8-5939-4de7-8b1b-a423b3deda0d" />
<img width="1999" height="1033" alt="Movies list - pagination" src="https://github.com/user-attachments/assets/adf4b37c-0149-479f-893e-5192866f2b81" />

### Movie Details Page

The Movie Details page is where users view plot/metadata, see review information, and transition into showtimes and ticket selection.

#### Signed out

Signed-out users can browse movie details and read information without committing to an account.

<img width="1999" height="1033" alt="Movie details (signed out)" src="https://github.com/user-attachments/assets/7441e698-a688-4cb0-b08f-ca22340161f0" />
<img width="1996" height="1028" alt="Movie details (signed out) - showtimes" src="https://github.com/user-attachments/assets/2dfa5b77-559f-461e-87da-6879e3196924" />
<img width="1998" height="1028" alt="Movie details (signed out) - reviews" src="https://github.com/user-attachments/assets/0b5941a0-9438-4735-a341-3816546aa3c6" />

#### Signed in

Signed-in users can take action: favorite movies, rate and review with a star picker, page through reviews once a movie has more than a few, and proceed through the ticketing flow. Each movie's average rating recalculates automatically as reviews come in.

<img width="2007" height="1007" alt="Movie details (signed in)" src="https://github.com/user-attachments/assets/ae271031-bb36-4615-b8f8-96e70ee6c390" />
<img width="2007" height="1005" alt="Movie details (signed in) - write a review" src="https://github.com/user-attachments/assets/eca7aba8-c77d-49b3-90b5-fc66165203b6" />
<img width="2006" height="1007" alt="Movie details (signed in) - paginated reviews" src="https://github.com/user-attachments/assets/231087d3-1210-438d-8f8b-fa2485d8d2d2" />

### Showtimes Page

The Showtimes page focuses on time-based discovery and is designed to feed directly into seat selection.

What this view demonstrates:

- **Filtering and discovery:** filter controls are visible (movie/theater/date) to quickly narrow showtimes.
- **Fast path to purchase:** the list is structured around picking a showtime and moving directly to seats.
- **Backend consistency:** showtimes follow scheduling validation rules (no overlapping showtimes per screen).

<img width="2007" height="1009" alt="Showtimes page (filters + list)" src="https://github.com/user-attachments/assets/5e4ac89e-e2b0-4860-bcd6-323e07e22d3d" />
<img width="2006" height="1007" alt="Showtimes page (filters applied)" src="https://github.com/user-attachments/assets/4bee9664-6f35-45d4-81b0-84ed8848a53c" />
<img width="2007" height="1007" alt="Showtimes page (grouped by theater)" src="https://github.com/user-attachments/assets/cac87fd9-1628-439f-a6ce-bdac866203f3" />
<img width="2007" height="1006" alt="Showtimes page (date tabs)" src="https://github.com/user-attachments/assets/493f3e86-066a-4a30-940b-711f4b214c4b" />

### Showtimes Seat Selection Page

This page turns a showtime into a seat map with availability.

What this view demonstrates:

- **Seat map rendering:** seats are shown in a themed, cinema-style grid per screen, with available/unavailable/paid/selected states visually distinct at a glance (the legend below the map spells out each one).
- **Availability logic:** unavailable seats are visually blocked (already held or already sold).
- **Add-to-cart behavior:** selecting seats creates time-limited holds so two users can’t buy the same seat at the same time.

<img width="2004" height="1009" alt="Seat selection (seat map)" src="https://github.com/user-attachments/assets/118d4eb7-d438-475a-bc99-0b3055ecd24d" />
<img width="2006" height="1009" alt="Seat selection (seats selected, subtotal)" src="https://github.com/user-attachments/assets/c9d781b0-eff8-4724-aa9d-d718d3732915" />

### User Cart Page

The cart groups tickets by showtime and keeps the user focused on the purchase decision.

What this view demonstrates:

- **Grouping by showtime:** prevents confusion when a user has tickets for different movies/times.
- **Transparent pricing:** each group shows its base ticket price alongside the line total, so the total is never just an unexplained lump sum.
- **Seat-level management:** remove individual seats without clearing the entire cart.
- **Hold awareness:** carts reflect time-limited seat holds; the UI is designed to recover cleanly if holds expire.

<img width="2004" height="1006" alt="Cart page" src="https://github.com/user-attachments/assets/dbd360fb-8226-403a-b7a0-908fcb19fea4" />

### User Checkout Page

Checkout converts the cart into a payment intent and finalizes the order after payment succeeds.

What this view demonstrates:

- **Stripe Elements UI:** card input is handled by Stripe (no raw card data hits the backend).
- **Backend-driven totals:** totals come from the server/cart state (not trusted from the browser).
- **Purchase pipeline:** cart → create payment intent → confirm payment → finalize order → tickets.

<img width="2007" height="1006" alt="Checkout page" src="https://github.com/user-attachments/assets/3639de13-930e-42e9-9a56-ba173dfd6175" />
<img width="2006" height="1009" alt="Checkout page - Stripe payment form" src="https://github.com/user-attachments/assets/92b87799-021f-4afe-8fdc-cfcc0bd7914e" />

### User Payment Successful Page

After Stripe confirms payment, the user lands on a confirmation page.

What this view demonstrates:

- **Clear end-state:** user sees a successful purchase state instead of being left on a processing screen.
- **Order handoff:** the next step is to view order history/details (tickets + codes).

<img width="2007" height="1007" alt="Payment success / confirmation" src="https://github.com/user-attachments/assets/9c779f76-6008-44a3-83c4-294fc9c308a3" />

### Theaters Page

The Theaters page provides location-based browsing. Each theater links into its screens and showtimes.

What this view demonstrates:

- **Entity navigation:** theater list → theater details/showtimes.
- **Separation of concerns:** theaters are managed independently from movies and showtimes.
- **Scalable modeling:** the data model supports multiple screens per theater.

<img width="2007" height="1009" alt="Theaters list" src="https://github.com/user-attachments/assets/37868516-6556-40a5-b0a8-4f1209a326d5" />
<img width="2006" height="1004" alt="Theaters list - scrolled" src="https://github.com/user-attachments/assets/70ca544f-2cef-459b-8ad8-e0ad519b85c9" />

### Theater Showtimes Page

The Theater Showtimes page shows what’s playing at a specific theater and helps users pick a movie + showtime combination.

What this view demonstrates:

- **Time-based browsing within a theater:** showtimes are grouped/filtered to reduce decision friction.
- **Clear handoff:** each showtime links into seat selection.

<img width="2004" height="1007" alt="Theater showtimes" src="https://github.com/user-attachments/assets/cd1a6ac3-133b-4111-a137-5b94d184dc2b" />
<img width="2006" height="1009" alt="Theater showtimes - date tabs" src="https://github.com/user-attachments/assets/ff0d1796-66c8-434f-bd79-0a0df73fa643" />
<img width="2004" height="1003" alt="Theater showtimes - movie list" src="https://github.com/user-attachments/assets/bdc16773-196a-40ed-8f5e-07016abc1ceb" />
<img width="2006" height="1003" alt="Theater showtimes - scrolled" src="https://github.com/user-attachments/assets/d6c4b77a-241d-41f7-a78b-87bbd72acb8b" />

### Login / Register

Authentication uses JWT (access/refresh). Users can sign in with email/password or Google, and new accounts go through an email verification flow.

Onboarding flow:

1. Register (email/password) or continue with Google
2. New users land on Welcome, then verify email (email/password signups)
3. Once verified, the user can continue browsing and purchasing

#### Login

A redesigned sign-in card: Google + email/password, branded focus states, and clear error handling.

<img width="1999" height="1033" alt="Login (Google + email)" src="https://github.com/user-attachments/assets/fc2dc687-e7fb-48e3-94e6-ab75e3cb07e8" />

#### Register

Fast signup focused on the essentials (name, email, password) plus Google, sharing the same modernized card styling as Login.

<img width="1998" height="1029" alt="Register (Google + email)" src="https://github.com/user-attachments/assets/af533933-1a9a-4e4a-bb84-876708b06da0" />

#### Welcome

Welcome page acts as the “post-auth hub” and surfaces verification state with clear calls to action.

<img width="952" height="489" alt="Welcome (verified)" src="https://github.com/user-attachments/assets/b8be6e02-5f42-4694-bfd2-181cc0f865cc" />

### Profile

Users can view/update profile details and upload an avatar (stored as media on the Django side).

<img width="2006" height="1007" alt="Profile" src="https://github.com/user-attachments/assets/1bbd5b28-8b74-4c3a-97f6-a78d292e78f0" />

### My Favorites

Favorites are tied to the authenticated user and allow quick access to saved movies.

<img width="2007" height="1005" alt="Favorites" src="https://github.com/user-attachments/assets/e2957a98-827f-4233-bba2-c726e9cbef51" />
<img width="2006" height="1012" alt="Favorites - pagination" src="https://github.com/user-attachments/assets/c0aa7067-ecbd-4232-87d0-ae4f761bd3c0" />
<img width="2007" height="1009" alt="Favorites (alternate view)" src="https://github.com/user-attachments/assets/d7e0b588-1267-485e-9d41-5c902c92dd90" />

### My Orders

Orders represent completed (or in-progress) purchases. This section is meant to show order history and status.

What this view demonstrates:

- **Order history:** list of purchases tied to the authenticated user.
- **Traceability:** each order links to a detail view with purchased seats/tickets.

<img width="2006" height="1003" alt="Orders history" src="https://github.com/user-attachments/assets/f2d28316-2b89-41b2-bde0-7fa7ebf1aca7" />

### Order Details

Order Details show the seats/tickets purchased for a specific showtime along with any ticket codes generated by the backend.

What this view demonstrates:

- **Ticket-level records:** each seat purchase becomes a ticket.
- **Codes for validation:** ticket codes are meant for real-world scan/check-in flows.
- **Full context:** showtime + theater/screen details stay attached to the purchase.

<img width="1998" height="1032" alt="Order details" src="https://github.com/user-attachments/assets/6a0f497b-6748-4107-9b82-4a1cde0b2006" />

### My Reviews

Reviews are linked to both a movie and the authenticated user. Users can view and manage their reviews from a dedicated page.

What this view demonstrates:

- **Per-user content:** reviews are scoped to the authenticated user.
- **Ownership rules:** users can edit/delete their own reviews (not others’).
- **Movie linkage:** reviews remain tied to the movie for display on details pages.

<img width="2007" height="1006" alt="My reviews" src="https://github.com/user-attachments/assets/e6259a35-b912-4ea6-8abb-10699aa058e3" />
<img width="2007" height="1007" alt="My reviews - pagination" src="https://github.com/user-attachments/assets/689dabe1-ce30-405d-be1e-64e902749afb" />
<img width="2007" height="999" alt="My reviews (alternate view)" src="https://github.com/user-attachments/assets/364f6cde-5caf-41f5-96a1-e7962809c76d" />

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
- **Bulk actions:** Select movies and mark them Now Showing / Coming Soon / Ended in one click.
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

1. Create and activate a virtual environment:

   **macOS / Linux**

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

   **Windows (Command Prompt)**

   ```bat
   python -m venv .venv
   .venv\Scripts\activate.bat
   ```

   **Windows (PowerShell)**

   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   ```

   Your prompt should now start with `(.venv)`. Run `deactivate` any time to exit the virtual environment.

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

### Bulk-generate showtimes for Now Showing movies

Loops the admin's "Generate schedule" logic across every Now Showing movie. Room-availability-aware: it skips a theater/day on a screen conflict instead of aborting the whole run.

- `python manage.py generate_now_showing_schedule --start 2026-08-01 --end 2026-08-31 --times "12:00,15:30,19:00,22:00" --base-price 12.00`
- Add `--movie <id>` / `--theater <id>` to scope it, or `--dry-run` to preview without writing anything.

### Recalculate movie rating averages

`Movie.rating_average` stays in sync automatically going forward via a `post_save`/`post_delete` signal on `Review`. Use this once to backfill movies that had reviews before that signal existed:

- `python manage.py recalculate_ratings` (or add `--movie <id>` for a single movie)

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
