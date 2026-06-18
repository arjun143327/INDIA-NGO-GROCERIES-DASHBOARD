create extension if not exists pgcrypto;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  role text not null check (role in ('school_staff', 'ngo_admin')),
  school_id uuid references public.schools (id),
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name_en text not null,
  name_ta text not null,
  category text,
  unit text not null,
  default_quantity numeric,
  estimated_cost numeric,
  purchase_cycle text,
  image_url text,
  tracking_mode text not null default 'measured' check (tracking_mode in ('measured', 'estimated', 'count_only', 'reorder_only')),
  threshold_qty numeric not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.stock_entries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  item_id uuid not null references public.inventory_items (id) on delete cascade,
  qty_added numeric not null check (qty_added > 0),
  entry_date date not null,
  total_expense numeric default 0,
  notes text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  item_id uuid not null references public.inventory_items (id) on delete cascade,
  qty_used numeric not null check (qty_used > 0),
  used_on date not null,
  meal_type text check (meal_type in ('Breakfast', 'Lunch', 'Snack')),
  notes text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.price_updates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  item_id uuid not null references public.inventory_items (id) on delete cascade,
  old_price numeric,
  new_price numeric not null,
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create or replace view public.current_stock_view
with (security_invoker = true) as
with stock_totals as (
  select item_id, sum(qty_added) as total_added
  from public.stock_entries
  group by item_id
),
usage_totals as (
  select item_id, sum(qty_used) as total_used
  from public.usage_logs
  group by item_id
)
select
  i.school_id,
  i.id as item_id,
  i.name_en,
  i.name_ta,
  i.name_en || ' (' || i.name_ta || ')' as item_name,
  i.category,
  i.unit,
  i.image_url,
  i.threshold_qty,
  i.estimated_cost,
  coalesce(st.total_added, 0) - coalesce(ut.total_used, 0) as current_stock
from public.inventory_items i
left join stock_totals st on st.item_id = i.id
left join usage_totals ut on ut.item_id = i.id
where i.is_active = true;

grant select on public.current_stock_view to authenticated;

alter table public.profiles enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_entries enable row level security;
alter table public.usage_logs enable row level security;
alter table public.price_updates enable row level security;

create or replace function public.get_my_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select school_id from public.profiles where id = auth.uid()
$$;

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "items_select" on public.inventory_items;
create policy "items_select"
on public.inventory_items
for select
using (
  public.get_my_role() = 'ngo_admin'
  or school_id = public.get_my_school_id()
);

drop policy if exists "items_insert" on public.inventory_items;
create policy "items_insert"
on public.inventory_items
for insert
with check (
  public.get_my_role() = 'ngo_admin'
  or school_id = public.get_my_school_id()
);

drop policy if exists "stock_select" on public.stock_entries;
create policy "stock_select"
on public.stock_entries
for select
using (
  public.get_my_role() = 'ngo_admin'
  or school_id = public.get_my_school_id()
);

drop policy if exists "stock_insert" on public.stock_entries;
create policy "stock_insert"
on public.stock_entries
for insert
with check (
  school_id = public.get_my_school_id()
  and created_by = auth.uid()
);

drop policy if exists "usage_select" on public.usage_logs;
create policy "usage_select"
on public.usage_logs
for select
using (
  public.get_my_role() = 'ngo_admin'
  or school_id = public.get_my_school_id()
);

drop policy if exists "usage_insert" on public.usage_logs;
create policy "usage_insert"
on public.usage_logs
for insert
with check (
  school_id = public.get_my_school_id()
  and created_by = auth.uid()
);

drop policy if exists "items_update" on public.inventory_items;
create policy "items_update"
on public.inventory_items
for update
using (
  public.get_my_role() = 'ngo_admin'
  or school_id = public.get_my_school_id()
);

drop policy if exists "price_updates_select" on public.price_updates;
create policy "price_updates_select"
on public.price_updates
for select
using (
  public.get_my_role() = 'ngo_admin'
  or school_id = public.get_my_school_id()
);

drop policy if exists "price_updates_insert" on public.price_updates;
create policy "price_updates_insert"
on public.price_updates
for insert
with check (
  school_id = public.get_my_school_id()
  and updated_by = auth.uid()
);

-- Automatic Profile Creation Trigger
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'school_staff');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
