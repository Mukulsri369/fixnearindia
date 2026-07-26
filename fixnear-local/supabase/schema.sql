-- ============================================================
-- FixNear India — complete database setup
-- Run this once in the Supabase SQL editor.
-- ============================================================

-- ---------- Roles enum ----------
do $$ begin
  create type public.app_role as enum ('admin', 'customer', 'technician');
exception when duplicate_object then null; end $$;

-- ---------- updated_at helper ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

drop policy if exists "profiles readable by everyone" on public.profiles;
create policy "profiles readable by everyone" on public.profiles
  for select using (true);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = user_id);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- user_roles  (roles NEVER live on profiles)
-- ============================================================
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select, insert on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

drop policy if exists "users read own roles" on public.user_roles;
create policy "users read own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "users claim base roles" on public.user_roles;
create policy "users claim base roles" on public.user_roles
  for insert to authenticated
  with check (auth.uid() = user_id and role in ('customer', 'technician'));

-- security definer role check (prevents RLS recursion)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

revoke all on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, anon;

-- ============================================================
-- auto-create profile + customer role on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- categories
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;

drop policy if exists "categories are public" on public.categories;
create policy "categories are public" on public.categories for select using (true);

drop policy if exists "admins manage categories" on public.categories;
create policy "admins manage categories" on public.categories
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

insert into public.categories (name, slug, icon, description) values
  ('Air Conditioner', 'air-conditioner', 'AirVent', 'Split & window AC service, gas refill, cooling issues'),
  ('Refrigerator', 'refrigerator', 'Refrigerator', 'Single & double door fridge cooling and compressor repair'),
  ('Washing Machine', 'washing-machine', 'WashingMachine', 'Front load & top load drum, motor and drainage repair'),
  ('Television', 'television', 'Tv', 'LED, LCD, Smart TV panel, display and sound repair'),
  ('Mobile Phone', 'mobile-phone', 'Smartphone', 'Screen, battery, charging port and software repair'),
  ('Laptop', 'laptop', 'Laptop', 'Hinge, keyboard, screen, battery and OS repair'),
  ('Desktop Computer', 'desktop-computer', 'Monitor', 'Motherboard, PSU, storage and assembly service'),
  ('Microwave Oven', 'microwave-oven', 'Microwave', 'Magnetron, heating and control panel repair'),
  ('Water Purifier', 'water-purifier', 'Droplets', 'RO/UV filter change, service and installation'),
  ('Geyser', 'geyser', 'Flame', 'Water heater element, thermostat and leakage repair'),
  ('Inverter & Battery', 'inverter-battery', 'BatteryCharging', 'Home inverter, UPS and battery service'),
  ('CCTV & Security', 'cctv-security', 'Cctv', 'Camera, DVR and wiring installation and repair'),
  ('Printer', 'printer', 'Printer', 'Inkjet & laser printer head, roller and driver issues'),
  ('Fan & Small Appliance', 'fan-small-appliance', 'Fan', 'Ceiling fan, mixer, iron and small appliance repair'),
  ('Other Electronics', 'other-electronics', 'CircuitBoard', 'Any other electronic device or gadget repair')
on conflict (slug) do nothing;

-- ============================================================
-- technicians
-- ============================================================
create table if not exists public.technicians (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  business_name text,
  experience_years integer default 0,
  address text,
  city text,
  district text,
  state text,
  pincode text,
  lat double precision,
  lng double precision,
  service_radius_km integer default 10,
  is_approved boolean default false,
  is_available boolean default true,
  avg_rating numeric default 0,
  total_reviews integer default 0,
  profile_photo_url text,
  shop_photo_url text,
  visiting_card_url text,
  aadhaar_url text,
  pan_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.technicians to authenticated;
grant select on public.technicians to anon;
grant all on public.technicians to service_role;
alter table public.technicians enable row level security;

drop policy if exists "approved technicians are public" on public.technicians;
create policy "approved technicians are public" on public.technicians
  for select using (
    is_approved
    or exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "users create own technician profile" on public.technicians;
create policy "users create own technician profile" on public.technicians
  for insert to authenticated with check (
    exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid())
  );

drop policy if exists "technicians update own record" on public.technicians;
create policy "technicians update own record" on public.technicians
  for update to authenticated using (
    exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

drop trigger if exists technicians_updated_at on public.technicians;
create trigger technicians_updated_at before update on public.technicians
  for each row execute function public.set_updated_at();

-- ============================================================
-- technician_categories
-- ============================================================
create table if not exists public.technician_categories (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  unique (technician_id, category_id)
);

grant select, insert, delete on public.technician_categories to authenticated;
grant select on public.technician_categories to anon;
grant all on public.technician_categories to service_role;
alter table public.technician_categories enable row level security;

drop policy if exists "technician categories are readable" on public.technician_categories;
create policy "technician categories are readable" on public.technician_categories
  for select using (true);

drop policy if exists "technicians manage own categories" on public.technician_categories;
create policy "technicians manage own categories" on public.technician_categories
  for all to authenticated
  using (exists (
    select 1 from public.technicians t
    join public.profiles p on p.id = t.profile_id
    where t.id = technician_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.technicians t
    join public.profiles p on p.id = t.profile_id
    where t.id = technician_id and p.user_id = auth.uid()
  ));

-- ============================================================
-- technician_service_areas
-- ============================================================
create table if not exists public.technician_service_areas (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians(id) on delete cascade,
  city text not null,
  state text not null
);

grant select, insert, delete on public.technician_service_areas to authenticated;
grant select on public.technician_service_areas to anon;
grant all on public.technician_service_areas to service_role;
alter table public.technician_service_areas enable row level security;

drop policy if exists "service areas readable" on public.technician_service_areas;
create policy "service areas readable" on public.technician_service_areas
  for select using (true);

drop policy if exists "technicians manage own areas" on public.technician_service_areas;
create policy "technicians manage own areas" on public.technician_service_areas
  for all to authenticated
  using (exists (
    select 1 from public.technicians t
    join public.profiles p on p.id = t.profile_id
    where t.id = technician_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.technicians t
    join public.profiles p on p.id = t.profile_id
    where t.id = technician_id and p.user_id = auth.uid()
  ));

-- ============================================================
-- repair_requests
-- ============================================================
create table if not exists public.repair_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id),
  brand text,
  model text,
  issue_description text not null,
  address text,
  city text,
  state text,
  pincode text,
  lat double precision,
  lng double precision,
  preferred_visit_time text,
  priority text default 'medium',
  status text default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.repair_requests to authenticated;
grant all on public.repair_requests to service_role;
alter table public.repair_requests enable row level security;

drop policy if exists "customers read own requests" on public.repair_requests;
create policy "customers read own requests" on public.repair_requests
  for select to authenticated using (
    auth.uid() = customer_id
    or public.has_role(auth.uid(), 'admin')
    or exists (
      select 1 from public.request_assignments ra
      join public.technicians t on t.id = ra.technician_id
      join public.profiles p on p.id = t.profile_id
      where ra.repair_request_id = repair_requests.id and p.user_id = auth.uid()
    )
  );

drop policy if exists "customers create own requests" on public.repair_requests;
create policy "customers create own requests" on public.repair_requests
  for insert to authenticated with check (auth.uid() = customer_id);

drop policy if exists "request participants update" on public.repair_requests;
create policy "request participants update" on public.repair_requests
  for update to authenticated using (
    auth.uid() = customer_id
    or public.has_role(auth.uid(), 'admin')
    or exists (
      select 1 from public.request_assignments ra
      join public.technicians t on t.id = ra.technician_id
      join public.profiles p on p.id = t.profile_id
      where ra.repair_request_id = repair_requests.id and p.user_id = auth.uid()
    )
  );

drop policy if exists "customers delete own requests" on public.repair_requests;
create policy "customers delete own requests" on public.repair_requests
  for delete to authenticated using (auth.uid() = customer_id);

drop trigger if exists repair_requests_updated_at on public.repair_requests;
create trigger repair_requests_updated_at before update on public.repair_requests
  for each row execute function public.set_updated_at();

-- ============================================================
-- repair_request_images
-- ============================================================
create table if not exists public.repair_request_images (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  url text not null,
  sort_order integer default 0
);

grant select, insert, delete on public.repair_request_images to authenticated;
grant all on public.repair_request_images to service_role;
alter table public.repair_request_images enable row level security;

drop policy if exists "images follow request visibility" on public.repair_request_images;
create policy "images follow request visibility" on public.repair_request_images
  for select to authenticated using (
    exists (select 1 from public.repair_requests r where r.id = repair_request_id)
  );

drop policy if exists "customers add own request images" on public.repair_request_images;
create policy "customers add own request images" on public.repair_request_images
  for insert to authenticated with check (
    exists (select 1 from public.repair_requests r
            where r.id = repair_request_id and r.customer_id = auth.uid())
  );

drop policy if exists "customers delete own request images" on public.repair_request_images;
create policy "customers delete own request images" on public.repair_request_images
  for delete to authenticated using (
    exists (select 1 from public.repair_requests r
            where r.id = repair_request_id and r.customer_id = auth.uid())
  );

-- ============================================================
-- request_assignments
-- ============================================================
create table if not exists public.request_assignments (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  technician_id uuid not null references public.technicians(id) on delete cascade,
  status text default 'pending',
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (repair_request_id, technician_id)
);

grant select, insert, update on public.request_assignments to authenticated;
grant all on public.request_assignments to service_role;
alter table public.request_assignments enable row level security;

drop policy if exists "assignment participants read" on public.request_assignments;
create policy "assignment participants read" on public.request_assignments
  for select to authenticated using (
    exists (select 1 from public.repair_requests r
            where r.id = repair_request_id and r.customer_id = auth.uid())
    or exists (select 1 from public.technicians t
               join public.profiles p on p.id = t.profile_id
               where t.id = technician_id and p.user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "customers create assignments" on public.request_assignments;
create policy "customers create assignments" on public.request_assignments
  for insert to authenticated with check (
    exists (select 1 from public.repair_requests r
            where r.id = repair_request_id and r.customer_id = auth.uid())
  );

drop policy if exists "assignment participants update" on public.request_assignments;
create policy "assignment participants update" on public.request_assignments
  for update to authenticated using (
    exists (select 1 from public.repair_requests r
            where r.id = repair_request_id and r.customer_id = auth.uid())
    or exists (select 1 from public.technicians t
               join public.profiles p on p.id = t.profile_id
               where t.id = technician_id and p.user_id = auth.uid())
  );

drop trigger if exists request_assignments_updated_at on public.request_assignments;
create trigger request_assignments_updated_at before update on public.request_assignments
  for each row execute function public.set_updated_at();

-- ============================================================
-- reviews
-- ============================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.request_assignments(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  reviewee_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (assignment_id, reviewer_id)
);

grant select, insert on public.reviews to authenticated;
grant select on public.reviews to anon;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;

drop policy if exists "reviews are public" on public.reviews;
create policy "reviews are public" on public.reviews for select using (true);

drop policy if exists "users write own reviews" on public.reviews;
create policy "users write own reviews" on public.reviews
  for insert to authenticated with check (auth.uid() = reviewer_id);

-- ============================================================
-- notifications
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  type text,
  data jsonb,
  read boolean default false,
  created_at timestamptz not null default now()
);

grant select, insert, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;

drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications" on public.notifications
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists "authenticated insert notifications" on public.notifications;
create policy "authenticated insert notifications" on public.notifications
  for insert to authenticated with check (true);

-- ============================================================
-- Storage: repair images
-- ============================================================
insert into storage.buckets (id, name, public)
values ('repair-images', 'repair-images', true)
on conflict (id) do nothing;

drop policy if exists "repair images are public" on storage.objects;
create policy "repair images are public" on storage.objects
  for select using (bucket_id = 'repair-images');

drop policy if exists "authenticated upload repair images" on storage.objects;
create policy "authenticated upload repair images" on storage.objects
  for insert to authenticated with check (bucket_id = 'repair-images');

drop policy if exists "owners delete repair images" on storage.objects;
create policy "owners delete repair images" on storage.objects
  for delete to authenticated using (bucket_id = 'repair-images' and owner = auth.uid());

-- ---------- helpful indexes ----------
create index if not exists idx_requests_customer on public.repair_requests(customer_id);
create index if not exists idx_requests_status on public.repair_requests(status);
create index if not exists idx_requests_city on public.repair_requests(city);
create index if not exists idx_assignments_tech on public.request_assignments(technician_id);
create index if not exists idx_assignments_request on public.request_assignments(repair_request_id);
create index if not exists idx_tech_city on public.technicians(city);
