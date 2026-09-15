# The MERGE Music

The current MERGE design with a production-oriented backend foundation:

- Supabase Auth, profiles, row-level security and staff roles
- EJAY PAPI official profile, separate from each member's editable profile
- LiveKit camera/audio rooms with server-minted tokens
- Authenticated Socket.IO chat, live presence and verified gift animations
- Atomic coin balances, gift transactions and a 70/30 creator/platform ledger
- Reports and moderator workflows
- Stripe Checkout and idempotent webhook crediting
- Rate limiting, CI, SPA deployment configuration and PWA install icons

No demo users, follower totals, play totals, rooms or viewers are seeded.

## Local setup

1. Copy `.env.example` to `.env` and add your own Supabase, LiveKit and Stripe values. Never commit `.env`.
2. Run every SQL file in `supabase/migrations` in numeric order.
3. Create the real accounts in Supabase Auth, then assign the master-admin role with the commented SQL at the bottom of migration 006. Do not create passwords in SQL or source code.
4. Install dependencies with `npm install`.
5. Run the frontend with `npm run dev` and the API/WebSocket service with `npm run dev:server`.

## Deployment

Deploy the Vite frontend to Lovable or Vercel. Deploy the Express/Socket.IO service to a persistent Node host that supports WebSockets, then set `VITE_API_URL` to that public API URL. Configure the private server variables only on the API host. Add the API's Stripe webhook URL as `/api/payments/webhook`.

Before launch run:

```bash
npm run typecheck
npm run build
npm run build:server
```
