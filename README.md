# TravelingOvertimeJobs.com

Minimal Next.js starter to verify GitHub → Vercel deployment.

## Environment variables

1. Copy `.env.local.example` to `.env.local`.
2. Update the `DATABASE_URL` in both `.env.local` and Vercel's environment variables to use your pooled Supabase connection string in the format `postgresql://<user>:<pass>@<host>:6543/<db>?pgbouncer=true&connection_limit=1`. Prisma requires the `pgbouncer=true` and `connection_limit=1` query parameters to work correctly with Supabase's connection pooling.
3. Replace the placeholder Clerk keys with the publishable and secret keys from your Clerk dashboard.

These variables are required for both development (`npm run dev`) and production builds (`npm run build`).

## Routing & Roles

- The public jobs directory lives at `/jobs` and accepts optional query parameters `q`, `location`, `trade`, and `payMin` to pre-filter results.
- Employer onboarding now begins at `/employer/register?onboarding=1`, which is gated to the employer role and prompts signed-in users without a role to choose one before continuing.
- Role-gated pages use an improved `useRequireRole` hook that can surface a selector when no role is set and offer a switch option when the active role does not match the expected workspace.
