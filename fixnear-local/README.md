# FixNear India — Plain React (Vite) version

A complete client-side React JS rebuild of the FixNear marketplace: landing page,
auth, customer repair requests with image uploads, technician onboarding,
technician job management and profile editing. All backend work is done directly
against Supabase (Postgres + Auth + Storage) with Row Level Security.

## 1. Create the project locally

You already created a Vite app named `fixnear`. Copy every file from this folder
into it (overwrite `src/`, `index.html`, `vite.config.js`, `package.json`).

If you want to start clean instead:

```bash
npm create vite@latest fixnear -- --template react
cd fixnear
# copy the files from this folder over the generated ones
```

## 2. Install dependencies

```bash
npm install
```

(If you copied the provided `package.json`, this installs everything:
react-router-dom, @supabase/supabase-js, @tanstack/react-query, tailwindcss v4,
framer-motion, lucide-react, sonner.)

## 3. Set up the database

1. Create a free project at https://supabase.com
2. Open **SQL Editor** and run the whole of `supabase/schema.sql` from this folder.
   It creates the enum, all tables, GRANTs, RLS policies, the `has_role`
   function, triggers, the seed categories and the `repair-images` storage bucket
   with its policies.
3. In **Authentication → Providers**, keep Email enabled. Enable Google if you
   want Google sign-in, and add `http://localhost:5173` to
   **Authentication → URL Configuration → Redirect URLs**.

## 4. Configure environment variables

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
**Project Settings → API**.

## 5. Run it

```bash
npm run dev
```

Open http://localhost:5173

## 6. Optional: fully local database

```bash
npm install -g supabase
supabase init
supabase start          # local Postgres + Auth + Storage on Docker
supabase db reset       # applies supabase/schema.sql if placed in supabase/migrations/
```

`supabase start` prints a local API URL (`http://127.0.0.1:54321`) and anon key —
put those in `.env` instead.

## Project structure

```
src/
  main.jsx                 app entry (ReactDOM + providers)
  App.jsx                  all routes (react-router-dom)
  index.css                design tokens + Tailwind v4
  lib/supabaseClient.js    single Supabase client
  hooks/useAuth.jsx        session/user/role context
  hooks/useCategories.js   React Query hooks
  services/                all database access (categories, profiles, repairs, technicians)
  components/              Header, Footer, Layout, ProtectedRoute, cards, UI primitives
  pages/                   Home, Auth, Dashboard, NewRequest, Requests, RequestDetail,
                           TechnicianRequests, RegisterTechnician, Profile, About,
                           Contact, Privacy, Terms, NotFound
supabase/schema.sql        complete database setup
```

## Roles

- `customer` — created automatically on first sign-in
- `technician` — granted when the technician application form is submitted
- `admin` — grant manually:
  `insert into user_roles (user_id, role) values ('<uuid>', 'admin');`

Technicians must be approved before they appear in matching:
`update technicians set is_approved = true where id = '<uuid>';`
