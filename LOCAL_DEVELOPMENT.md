# Local Development Guide

This guide walks you through running the Bossman Construction Management app locally with a local Supabase instance, verifying your database schema, and then deploying to Vercel.

---

## Prerequisites

- **Node.js 20+** or **Bun** (we use Bun — see `package.json`)
- **Docker Desktop** (required for local Supabase)
- **Supabase CLI** (see install step below)
- **Git**

---

## Step 1 — Install Supabase CLI

### macOS (Homebrew)
```bash
brew install supabase/tap/supabase
```

### Windows (Scoop)
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Linux / Other
```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

---

## Step 2 — Link to Your Remote Project

Your project is already configured with a `supabase/config.toml` that points to project ID `hpstttefbupsximxqrev`. You just need to link the CLI to it.

```bash
# Login to Supabase (opens browser)
supabase login

# Link to your existing project
supabase link --project-ref hpstttefbupsximxqrev
```

When prompted, enter your database password (from your Supabase project settings).

---

## Step 3 — Start Local Supabase

```bash
supabase start
```

This will:
- Pull Docker images for Postgres, GoTrue, PostgREST, Storage, Realtime, etc.
- Start all services locally
- Print your local credentials and URLs

**Save the output — you'll need the local API URL and anon key.**

Typical local URLs:
| Service | URL |
|---------|-----|
| API (REST) | `http://127.0.0.1:54321` |
| DB (Postgres) | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio (UI) | `http://127.0.0.1:54323` |
| Inbucket (email) | `http://127.0.0.1:54324` |

---

## Step 4 — Run Migrations Locally

Your project has **17 migration files** in `supabase/migrations/`. Apply them to your local database:

```bash
# Apply all pending migrations
supabase migration up

# Or apply a specific number
supabase migration up --local
```

If you need to reset and re-apply all migrations:
```bash
supabase db reset
```

### Verify migrations applied
```bash
supabase migration list --local
```

You should see all migrations marked as `Applied`.

---

## Step 5 — Verify Tables & Schema

### Option A — Use Supabase Studio (GUI)
Open `http://127.0.0.1:54323` and navigate to:
- **Table Editor** → verify tables exist
- **Authentication** → verify trigger `handle_new_user` is configured
- **Database** → **Functions** → verify `has_role()` and other functions

### Option B — Use psql CLI
```bash
# Connect to local database
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Then run verification queries:
```sql
-- List all public tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Expected output:
-- material_categories
-- materials
-- messages
-- notifications
-- profile_contacts
-- profiles
-- transaction_events
-- transactions
-- user_roles

-- Verify enums exist
SELECT typname FROM pg_type WHERE typname IN ('app_role', 'material_status', 'transaction_status');

-- Verify RLS is enabled on tables
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;

-- Verify functions exist
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- Verify triggers exist
SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';
```

### Option C — Use Supabase CLI query
```bash
# Run a quick check
supabase db query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
```

---

## Step 6 — Seed Test Data (Optional)

To populate categories and test data locally:

```bash
# If you have a seed file
supabase db seed

# Or run the categories insert manually
supabase db query "INSERT INTO public.material_categories (id, name, sort_order) VALUES ('cat-1', 'Drywall', 1), ('cat-2', 'Lumber', 2), ('cat-3', 'Insulation', 3), ('cat-4', 'Roofing', 4), ('cat-5', 'Electrical', 5), ('cat-6', 'Plumbing', 6), ('cat-7', 'Flooring', 7), ('cat-8', 'Doors/Windows', 8), ('cat-9', 'Hardware', 9), ('cat-10', 'Other', 10);"
```

---

## Step 7 — Configure Local Environment Variables

Create a `.env.local` file in your project root (it is already gitignored):

```bash
cp .env .env.local
```

Edit `.env.local` to point to your **local** Supabase instance:

```env
# Local Supabase (from `supabase start` output)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<your-local-anon-key>
VITE_SUPABASE_PROJECT_ID=hpstttefbupsximxqrev

# Server-side (same for local)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=<your-local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-local-service-role-key>

# Keep these the same (for Google OAuth you still need remote config, or use email/pass locally)
SUPABASE_PROJECT_ID=hpstttefbupsximxqrev
```

> **Note:** Get the exact values from the output of `supabase start`.

---

## Step 8 — Install Dependencies & Run the App

```bash
# Install dependencies
bun install

# Start the dev server
bun run dev
```

The app should now be running at `http://localhost:8080` and communicating with your **local** Supabase.

### Verify the app works locally
1. Open `http://localhost:8080`
2. Navigate to `/auth` and sign up with email/password
3. Check Supabase Studio (`http://127.0.0.1:54323`) → **Table Editor** → `profiles` to see the new user
4. Check `user_roles` to verify role assignment

---

## Step 9 — Deploy to Vercel

Once you've verified everything works locally, deploy to production.

### 9.1 Push database changes to remote (if needed)

```bash
# If you made schema changes locally, push them to your remote Supabase project
supabase db push
```

If you only changed code and not the schema, skip this step.

### 9.2 Configure Vercel Environment Variables

In your Vercel project dashboard → **Settings** → **Environment Variables**, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://hpstttefbupsximxqrev.supabase.co` | Production |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Production |
| `VITE_SUPABASE_PROJECT_ID` | `hpstttefbupsximxqrev` | Production |
| `SUPABASE_URL` | `https://hpstttefbupsximxqrev.supabase.co` | Production |
| `SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | Production |
| `SUPABASE_PROJECT_ID` | `hpstttefbupsximxqrev` | Production |

> **Important:** `SUPABASE_SERVICE_ROLE_KEY` must remain server-side only. Never prefix it with `VITE_`.

### 9.3 Deploy from Git

1. Push your code to GitHub/GitLab
2. Import the repo into Vercel
3. Vercel will read `vercel.json` and use `bun run build`
4. Ensure the build output directory is `.output`

### 9.4 Verify Production Deployment

After deployment:
1. Open your Vercel URL
2. Test auth flow
3. Check that database operations work
4. Review Vercel function logs for any errors

---

## Useful Commands Reference

```bash
# Local Supabase
supabase start          # Start all local services
supabase stop           # Stop local services
supabase status         # Check local service status
supabase db reset       # Reset local DB and re-apply migrations
supabase migration up   # Apply pending migrations
supabase migration list # List migrations and their status
supabase studio         # Open Studio in browser

# App
bun run dev             # Start dev server
bun run build           # Build for production
bun run preview         # Preview production build locally
```

---

## Troubleshooting

### Migration fails with "permission denied"
Make sure you're running `supabase migration up --local` (or just `supabase migration up` when the local stack is running). The local postgres user has full permissions.

### "No such file or directory" for Docker
Ensure Docker Desktop is running before `supabase start`.

### Auth doesn't work locally
Google OAuth requires a redirect URL configured in Supabase Auth. For local testing, use email/password auth, or configure the redirect URL in your remote Supabase project to include `http://localhost:8080`.

### Vercel build fails
Check that all environment variables are set and that `SUPABASE_SERVICE_ROLE_KEY` is NOT prefixed with `VITE_`.

### Tables missing after migration
Run `supabase db reset` to start fresh, then check the migration files for errors.

---

## Next Steps

- [ ] Set up Google OAuth redirect URLs in Supabase Auth settings for production
- [ ] Configure a custom domain in Vercel
- [ ] Set up branch previews (Vercel will automatically deploy PRs)
