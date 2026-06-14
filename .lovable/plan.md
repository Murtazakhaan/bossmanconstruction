## Bossman Construction Management — Web App Plan

A full-stack web app that connects U.S. contractors with low-income homeowners and nonprofits to donate surplus construction materials, with transaction tracking, in-app chat, admin oversight, and tax/reporting exports.

### Tech stack

- TanStack Start (React 19 + Vite 7) — existing scaffold
- Tailwind v4 with custom Industrial Navy theme tokens in `src/styles.css`
- Lovable Cloud (Supabase under the hood) for Postgres, Auth, Storage (material photos), Realtime (chat), and server functions
- Server-side logic via `createServerFn` (no edge functions for app logic)

### Brand & design system

- Logo: BCM mark uploaded as a Lovable Asset, used in nav and footer
- Palette: navy `#1a2748` (primary), deep navy `#2d3a5c`, concrete gray `#b8b5ad`, off-white `#f5f3ee` (background), plus muted danger/success
- Typography: bold uppercase display (Oswald/Anton-style) for headings to echo the logo; Inter for body
- Visual feel: industrial, structured, generous whitespace, sharp corners with small radius, subtle concrete texture on hero/auth backgrounds
- Sidebar dashboard layout for authenticated app; marketing-style public landing

### Routes

Public
- `/` — landing page (hero, how it works, who it's for, CTA to register)
- `/about`, `/contact`
- `/auth` — sign in / sign up with role selection (Contractor or Recipient; Admin invite-only)
- `/reset-password`

Authenticated (under `_authenticated/`)
- `/dashboard` — role-aware overview (donation totals, active transactions, quick actions)
- `/materials` — browse available materials (with filters: type, location, quantity)
- `/materials/$id` — material detail + request action (recipients)
- `/donations` — contractor: list own donations; create new (`/donations/new`)
- `/transactions` — list, filterable by status (pending / scheduled / in progress / completed / canceled)
- `/transactions/$id` — full transaction view: timeline, pickup details, embedded chat thread
- `/reports` — contractor: tax summary by year, donation history export (PDF/CSV)
- `/profile` — account, organization info, contact details
- `/admin` (gated by `admin` role) — users, materials catalog, all transactions, system reports, exports

### Database schema (Supabase)

- `profiles` — id (FK auth.users), full_name, org_name, phone, address, city, state, zip, role-agnostic fields
- `app_role` enum: `contractor`, `recipient`, `admin`
- `user_roles` — separate table (per security rules); `has_role()` security-definer function for RLS
- `material_categories` — seeded list (Drywall, Lumber, Insulation, Roofing, Electrical, Plumbing, Flooring, Doors/Windows, Hardware, Other)
- `materials` — id, contractor_id, category_id, title, description, quantity, unit, unit_value_usd, total_value_usd (generated), photo_urls[], pickup_address, pickup_city/state/zip, available_from, available_until, status (available / reserved / claimed / removed), created_at
- `transactions` — id, material_id, recipient_id, contractor_id, requested_quantity, status (requested / scheduled / in_progress / completed / canceled), pickup_scheduled_at, pickup_address, completed_at, value_at_completion_usd, created_at, updated_at
- `transaction_events` — id, transaction_id, actor_id, event_type, notes, created_at (audit trail)
- `messages` — id, transaction_id, sender_id, body, created_at (Realtime-subscribed per transaction)
- `notifications` — id, user_id, type, payload jsonb, read_at, created_at

RLS on all tables, scoped via `auth.uid()` and `has_role()`. Storage bucket `material-photos` (public read of resized images, authenticated write by owning contractor).

### Key server functions (`src/lib/*.functions.ts`)

- `listAvailableMaterials({ filters })`, `getMaterial({ id })`
- `createMaterial`, `updateMaterial`, `archiveMaterial`
- `requestMaterial({ materialId, quantity, preferredPickup })` → creates transaction
- `updateTransactionStatus({ id, status, scheduledAt? })` with role-aware authorization + writes `transaction_events`
- `sendMessage({ transactionId, body })`
- `getContractorYearReport({ year })` — aggregates donation totals for tax summary
- `getAdminOverview()` and `exportTransactionsCsv({ from, to })`
- `inviteAdmin({ email })` — admin-only

All authenticated via `requireSupabaseAuth` middleware; service-role lazy-imported only inside admin handlers after verifying `has_role(uid, 'admin')`.

### Reports & tax write-offs

- Contractor "Annual Tax Summary" page: totals + per-transaction line items, recipient (anonymized to org type for privacy), donation date, fair-market value; "Download PDF" and "Download CSV" actions
- Admin monthly summary: total value distributed, top contractors, recipients served, downloadable

### Notifications & realtime

- Realtime chat per transaction via Supabase Realtime channel keyed on `transactions:{id}`
- Status-change notifications written to `notifications` table; bell icon in header with unread badge
- (Email notifications deferred; spec'd as a Resend hookup in a later pass)

### Technical notes

- Auth: email/password to start; Google OAuth optional later via Lovable broker
- Roles: separate `user_roles` table + `has_role()` SECURITY DEFINER function; admin role granted only via privileged server fn
- Public landing uses public server fns (admin-elevated) for any data; protected routes live under `_authenticated/`
- Photo uploads via Supabase Storage with client-side resize before upload
- Pagination + URL-driven filters via `validateSearch` on list routes
- Loaders prime TanStack Query cache; components use `useSuspenseQuery`

### Build order

1. Theme tokens, logo asset, fonts, landing page, auth pages
2. Enable Lovable Cloud; migrations for roles, profiles, categories, materials, transactions, events, messages, notifications + RLS + grants; storage bucket
3. Authenticated shell (sidebar layout, role-aware nav, dashboard)
4. Contractor flows: create/edit material with photo upload; donation list
5. Recipient flows: browse, filter, material detail, request
6. Transaction detail: timeline, status transitions, chat (realtime)
7. Reports: contractor tax summary + CSV/PDF export
8. Admin dashboard: users, all transactions, system reports, CSV exports, invite admin
9. Notifications (in-app), polish, empty states, error/notfound boundaries, SEO metadata on public routes

### Out of scope for v1 (noted for later)

- Email/SMS notifications, hardware-store rebate integration, QR-code material scanning, mobile native apps, multi-language, payments
