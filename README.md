# Sri Viswa Admissions

TanStack Start + React + Supabase admission portal for Sri Viswa institutions.

## Required environment

Create `.env.local` in the repo root.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Use the Supabase project URL and the `anon`/publishable key from `Project Settings -> API`.
Do not use the service role key in browser code.

## Install

```bash
npm install
```

If you prefer Bun:

```bash
bun install
```

## Run locally

```bash
npm run dev -- --host 0.0.0.0
```

Open the local preview URL shown by Vite.

## Build check

```bash
npm run build
```

## Database migration

Apply the latest SQL migration in Supabase before testing the Sri Viswa start flow.

Latest migration:

```text
supabase/migrations/20260713153000_add_admission_selection.sql
```

If you use the Supabase CLI:

```bash
supabase db push
```

Or run the SQL manually in the Supabase SQL Editor.

## Main flow to test

1. Open `/apply`
2. Select `Sri Viswa Jr College -> SVJR -> I-MPC -> Day Scholar (Main Campus)`
3. Save draft
4. Refresh the page
5. Confirm the selection still appears
6. Open the application from `/applications`
7. Confirm Institution, Branch, Course, and Campus show correctly

## Current note

The Sri Viswa start-admission flow uses local master mappings in `src/data/sriVishwaAdmissionMasters.ts`.
These values are persisted in `applications.admission_selection` until the Supabase campus/program/branch master tables are fully aligned.
