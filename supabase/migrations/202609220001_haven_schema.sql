-- Apply with Supabase CLI (`supabase db push`) or in the Supabase SQL editor.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text, avatar_url text, created_at timestamptz not null default now()
);
create table public.saved_listings (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id text not null, created_at timestamptz not null default now(), primary key (user_id, listing_id)
);
create table public.bookings (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  listing_id text not null, check_in date not null, check_out date not null,
  guests integer not null check (guests > 0), total_cents integer not null check (total_cents >= 0),
  status text not null default 'confirmed' check (status in ('pending','confirmed','cancelled')),
  created_at timestamptz not null default now()
);
create table public.transactions (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0), currency text not null default 'USD',
  status text not null default 'authorized' check (status in ('authorized','captured','refunded','failed')),
  provider_reference text, created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.saved_listings enable row level security;
alter table public.bookings enable row level security;
alter table public.transactions enable row level security;
create policy "own profile" on public.profiles for all using (auth.uid()=id) with check (auth.uid()=id);
create policy "own saved stays" on public.saved_listings for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own bookings" on public.bookings for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own transactions" on public.transactions for select using (auth.uid()=user_id);
create or replace function public.create_profile_for_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.create_profile_for_new_user();
