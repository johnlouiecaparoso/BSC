# BSC — CSU Accomplishment Tracking System

Balanced Scorecard performance tracking for Caraga State University offices. Offices
submit quarterly accomplishments against KPIs; admins review, score, and report.

This is the **dashboards and KPI-reporting** proof piece — the reference project for
analytics and reporting work.

## Stack

Vue 3 · Vite · Pinia · vue-router · Supabase · Chart.js via vue-chartjs ·
vee-validate + yup · vue-toastification · Tailwind

## Commands

```bash
npm run dev
npm run build
npm run preview
```

No test or lint script configured. If a client project grows from this, add vitest and
eslint early — `ecolink` has a working setup worth copying.

## Layout

```
src/
  pages/
    admin/     office/     auth/      role-scoped page trees
  services/    adminService · analyticsService · authService · bscService ·
               officeService · quarterlyService  — all data access lives here
  stores/      adminStore · authStore · bscStore · notificationStore · officeStore
  components/  layouts/  router/  utils/  lib/  assets/
```

Root holds incremental SQL patches applied over time:
`supabase-schema.sql`, `supabase_complete_setup.sql`, `supabase_rls_fix.sql`,
`add_bsc_entry_quarter.sql`, `add_office_delete_policy.sql`,
`add_quarterly_delete_policy.sql`.

## Conventions

- **Services own Supabase; stores own state; components own rendering.** Keep that
  separation — it's the thing that makes this codebase readable.
- Quarterly data is the core domain concept. `quarterlyService` and the quarter column
  added by `add_bsc_entry_quarter.sql` are load-bearing; check both before changing
  anything about periods.
- Validation is vee-validate + yup schemas. Add to the existing schema rather than doing
  ad-hoc checks in the component.
- User feedback goes through `vue-toastification` via `notificationStore` — don't
  `alert()`.

## Gotchas

- The SQL files are a **patch history, not a schema**. `supabase_complete_setup.sql` is
  the closest thing to a current full schema; the `add_*.sql` and `*_rls_fix.sql` files
  were applied on top. Read them in filename order before changing the database.
- Several RLS policies were added reactively (`add_office_delete_policy`,
  `add_quarterly_delete_policy`). If a delete silently does nothing, it's a missing
  policy, not a broken query.
- `VITE_`-prefixed env vars ship to the browser. Only the anon key belongs there.
- Chart.js components need explicit re-render on data change in Vue — check existing
  chart components for the established pattern rather than inventing one.
