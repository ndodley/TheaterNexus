# Theater Nexus (Frontend)

React + TypeScript + Vite frontend for the Theater Nexus movie ticketing app.

## Run locally

```bash
npm install
npm run dev
```

### Environment variables

Create `frontend/.env` (see `frontend/.env.example` if present):

- `VITE_API_BASE` (default: `http://127.0.0.1:8000`)
- `VITE_GOOGLE_CLIENT_ID` (enables Google sign-in button)

The dev server will proxy API requests based on the configuration in the app (see `src/api.ts`).

## Build

```bash
npm run build
```
