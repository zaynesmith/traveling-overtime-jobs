# TravelingOvertimeJobs.com

Minimal Next.js starter to verify GitHub → Vercel deployment.

## Database migrations

- Run `npm run prisma:migrate` during local development when you need to create a new migration.
- Run `npm run prisma:migrate:deploy` in production environments (for example, via CI/CD) to apply pending migrations. This replaces the previous `prisma db push` workflow.

## Environment variables

1. Copy `.env.local.example` to `.env.local`.
2. Update the `DATABASE_URL` in both `.env.local` and Vercel's environment variables to use your pooled Supabase connection string in the format `postgresql://<user>:<pass>@<host>:6543/<db>?pgbouncer=true&connection_limit=1`. Prisma requires the `pgbouncer=true` and `connection_limit=1` query parameters to work correctly with Supabase's connection pooling.
3. Replace the placeholder Clerk keys with the publishable and secret keys from your Clerk dashboard.

These variables are required for both development (`npm run dev`) and production builds (`npm run build`).

## Routing & Roles

- The public jobs directory lives at `/jobs` and accepts optional query parameters `q`, `location`, `trade`, and `payMin` to pre-filter results.
- Employers can create accounts at `/employer/register` and manage their workspace from `/employer/dashboard` after signing in.
- Jobseekers can create accounts at `/jobseeker/register` and access their tools from `/jobseeker/dashboard` once logged in.
