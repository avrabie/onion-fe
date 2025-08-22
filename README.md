# Soviet Onion Shop FE (React + Vite)

This is a React frontend (Vite) for the Soviet Onion Shop — a glorious marketplace for bulbs that could power a five‑year plan. It talks to a Spring Boot backend.

## Running locally

- Start your Spring Boot backend on http://localhost:8080
- Start the frontend dev server:

```
npm install
npm run dev
```

By default, Vite proxies API calls to the backend for these paths: `/products`, `/users`, `/api`, `/login`, `/logout`, `/oauth2`.

If your backend runs on a different origin, set an env variable to fully qualify requests and form posts:

```
VITE_API_BASE=https://your-backend.example.com
```

## Authentication

The frontend provides a login page at `/#/login` with multiple options:

- Continue with Google: redirects the browser to the backend at `/oauth2/authorization/google` (Spring Security OAuth2).
- Continue with GitHub: redirects the browser to the backend at `/oauth2/authorization/github` (Spring Security OAuth2).
- Username/Password: posts a regular HTML form to the backend at `/login` (Spring Security formLogin).

When the user is authenticated, the header shows a Logout button that posts a form to `/logout`.

Notes:
- The username/password and logout forms use standard POST (not fetch) to avoid SPA CSRF handling. If your Spring Security setup requires a CSRF token on logout, expose a cookie named `XSRF-TOKEN` (or `X-CSRF-TOKEN`) and Spring’s default `_csrf` field will be included automatically by the UI if the cookie exists.
- Auth state is detected using the dedicated `/users/me` endpoint. You can adjust this in `src/api.js` if your backend differs.
- When logged in, the header shows your name (prefers `name`, then `username`, then `email`) as a link to `/#/me` (User Profile page) and a Logout button that posts directly to `/logout` (CSRF cookie supported). A dedicated logout page still exists at `/#/logout` if you navigate to it directly.
- For dev, the Vite proxy forwards `/login`, `/logout`, and `/oauth2/*` to `http://localhost:8080` when `VITE_API_BASE` is not set.
- In production or when `VITE_API_BASE` is set, form posts and links are fully qualified to `${VITE_API_BASE}`.
- On successful login, Spring Security will issue a session cookie and likely redirect. Configure your backend's success URL to point back to the SPA if needed (e.g., `/#/`).

## Payments

Checkout flow creates an order and requests a payment session from the backend, then redirects to Stripe Checkout.
