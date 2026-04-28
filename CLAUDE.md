# UI Agent — Field Service Management UI

## Role
UI Agent. This agent owns `field_service_management_ui/` exclusively.
Do NOT edit backend (Go) files from here.

## Tech Stack
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- httpOnly cookie auth (`fsm_token`)

## Project Structure
```
app/
  api/
    auth/
      login/route.ts       — proxy login to Go, set httpOnly cookie
      register/route.ts    — proxy register to Go, set httpOnly cookie
      logout/route.ts      — clear fsm_token cookie
      me/route.ts          — decode JWT payload for UI (no verify, just parse)
    proxy/[...path]/
      route.ts             — catch-all: reads fsm_token cookie → sets Authorization header → forwards to Go API
  layout.tsx               — AuthProvider + NavBar wrap
  page.tsx                 — dashboard home (protected)
  login/page.tsx           — login form
  register/page.tsx        — register form
components/
  AuthGuard.tsx            — redirect to /login if not authenticated
  NavBar.tsx               — show username + logout button
lib/
  api.ts                   — apiFetch wrapper (calls /api/proxy/api/...)
  auth-context.tsx         — AuthProvider, useAuth() hook
  types.ts                 — TypeScript interfaces (User, AuthResponse)
```

## Auth
- Cookie name: `fsm_token`
- Cookie flags: `httpOnly`, `sameSite: lax`, `path: /`
- Token is NEVER stored in JS/localStorage/sessionStorage
- All authenticated API calls go through `/api/proxy/api/...`

## API Call Pattern
All calls to the Go backend must go through the Next.js proxy:
```ts
import { apiFetch } from "@/lib/api";

const res = await apiFetch("work-orders");          // GET /api/proxy/api/work-orders
const res = await apiFetch("work-orders", {         // POST
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
```

## Coding Rules
1. Always `Read` a file before editing it
2. `npm run build` must pass before marking a task done
3. The JWT token (`fsm_token`) must NEVER appear in client-side JS or localStorage
4. All new pages that require auth must be wrapped with `<AuthGuard>`
5. Components using hooks (`useAuth`, `useRouter`, etc.) must have `"use client"` directive
6. Environment variable `API_URL` is server-side only (not prefixed with `NEXT_PUBLIC_`)

## Environment Variables
| Variable | Description              | Default                  |
|----------|--------------------------|--------------------------|
| API_URL  | Go backend base URL      | http://localhost:8080    |
