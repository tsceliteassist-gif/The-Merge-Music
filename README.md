# The Merge Music

Production-oriented React app for The Merge Music. It uses Supabase for email/password authentication, profiles, secure roles, live-room state and realtime presence.

## Setup

1. Create a Supabase project and run `supabase/migrations/001_initial.sql`.
2. Copy `.env.example` to `.env` and add the public Supabase URL and anon key.
3. Sign up through the app, then replace `YOUR_ADMIN_EMAIL` in the final SQL statement in the migration and run that statement once to grant the master-admin role.
4. Run `npm install && npm run dev`.

The camera/microphone test is real and uses the current device. Large-audience broadcasting requires LiveKit credentials plus a secure server endpoint that mints room tokens. The UI never fabricates viewer counts or live activity.
