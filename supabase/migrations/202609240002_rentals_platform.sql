-- Haven inventory, operational workflow, and seed data.
-- This migration extends 202609220001_haven_schema.sql.
create type public.user_role as enum ('guest', 'host', 'admin');
alter table public.profiles add column if not exists role public.user_role not null default 'guest';

create table public.listings (
  id text primary key,
  host_id uuid references public.profiles(id) on delete set null,
  title text not null,
  city text not null,
  region text not null,
  property_type text not null check (property_type in ('Cottage','Apartment','Home','Cabin','Suite')),
  bedrooms integer not null check (bedrooms > 0),
  guests_max integer not null check (guests_max > 0),
  nightly_cents integer not null check (nightly_cents > 0),
  cleaning_cents integer not null default 4600 check (cleaning_cents >= 0),
  instant_book boolean not null default false,
  description text not null,
  published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.listing_photos (
  id uuid primary key default gen_random_uuid(), listing_id text not null references public.listings(id) on delete cascade,
  url text not null, alt_text text not null default '', position integer not null default 0
);
create table public.amenities (id uuid primary key default gen_random_uuid(), name text unique not null, icon text);
create table public.listing_amenities (listing_id text references public.listings(id) on delete cascade, amenity_id uuid references public.amenities(id) on delete cascade, primary key(listing_id, amenity_id));
create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(), listing_id text not null references public.listings(id) on delete cascade,
  starts_on date not null, ends_on date not null, reason text not null default 'host_block', check (ends_on > starts_on)
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(), listing_id text not null references public.listings(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade, rating integer not null check(rating between 1 and 5), body text not null,
  created_at timestamptz not null default now(), unique(listing_id, author_id)
);
alter table public.bookings add constraint booking_dates_valid check (check_out > check_in);
alter table public.bookings add column if not exists cancellation_reason text;
alter table public.bookings add column if not exists cancelled_at timestamptz;

create or replace function public.listing_is_available(p_listing_id text, p_check_in date, p_check_out date)
returns boolean language sql stable as $$
  select not exists (select 1 from public.bookings b where b.listing_id=p_listing_id and b.status in ('pending','confirmed') and daterange(b.check_in,b.check_out,'[)') && daterange(p_check_in,p_check_out,'[)'))
  and not exists (select 1 from public.availability_blocks a where a.listing_id=p_listing_id and daterange(a.starts_on,a.ends_on,'[)') && daterange(p_check_in,p_check_out,'[)'));
$$;
create or replace function public.book_listing(p_listing_id text, p_check_in date, p_check_out date, p_guests integer)
returns public.bookings language plpgsql security definer set search_path=public as $$
declare v_listing public.listings; v_booking public.bookings; v_total integer;
begin
  if auth.uid() is null then raise exception 'Please sign in before booking'; end if;
  select * into v_listing from listings where id=p_listing_id and published=true;
  if not found then raise exception 'This stay is unavailable'; end if;
  if p_guests < 1 or p_guests > v_listing.guests_max then raise exception 'Guest count is not allowed for this stay'; end if;
  if not listing_is_available(p_listing_id,p_check_in,p_check_out) then raise exception 'Those dates are no longer available'; end if;
  v_total := ((p_check_out-p_check_in)*v_listing.nightly_cents)+v_listing.cleaning_cents;
  insert into bookings(user_id,listing_id,check_in,check_out,guests,total_cents,status) values(auth.uid(),p_listing_id,p_check_in,p_check_out,p_guests,v_total,'pending') returning * into v_booking;
  return v_booking;
end; $$;

alter table public.listings enable row level security; alter table public.listing_photos enable row level security;
alter table public.amenities enable row level security; alter table public.listing_amenities enable row level security;
alter table public.availability_blocks enable row level security; alter table public.reviews enable row level security;
create policy "published listings are public" on public.listings for select using (published or host_id=auth.uid());
create policy "listing photos are public" on public.listing_photos for select using (true);
create policy "amenities are public" on public.amenities for select using (true);
create policy "listing amenities are public" on public.listing_amenities for select using (true);
create policy "reviews are public" on public.reviews for select using (true);
create policy "host manages own listing" on public.listings for all using(host_id=auth.uid()) with check(host_id=auth.uid());
create policy "host manages availability" on public.availability_blocks for all using(exists(select 1 from listings where id=listing_id and host_id=auth.uid())) with check(exists(select 1 from listings where id=listing_id and host_id=auth.uid()));
create policy "guest writes own review" on public.reviews for insert with check(author_id=auth.uid());

insert into public.listings(id,title,city,region,property_type,bedrooms,guests_max,nightly_cents,instant_book,description,published) values
('sunlit-garden-cottage','Sunlit Garden Cottage','Asheville','North Carolina','Cottage',2,4,14200,false,'A quiet cottage with a private garden, easy parking, and a sunny reading nook.',true),
('quiet-harbor-view','Quiet Harbor View','Portland','Maine','Apartment',1,2,16800,true,'A peaceful, lift-accessible apartment overlooking the working harbor.',true),
('maple-house','The Maple House','Woodstock','Vermont','Home',3,6,21500,false,'A restored village home, a short level walk from cafés and the green.',true),
('blue-ridge-cabin','Blue Ridge Cabin','Boone','North Carolina','Cabin',2,4,15600,true,'A warm cedar cabin with a wide porch and thoughtful step-free entry.',true),
('old-town-courtyard','Old Town Courtyard Flat','Savannah','Georgia','Apartment',1,2,13900,false,'Ground-floor comfort beside Savannah historic squares.',true),
('lakeside-morning','Lakeside Morning','Lake Placid','New York','Home',3,6,24900,false,'A bright lake home with two bedrooms on the main floor.',true),
('willow-farm-stay','Willow Farm Stay','Hudson Valley','New York','Suite',1,2,11800,true,'A private suite on a small working farm, with breakfast included.',true),
('seaside-reading-room','Seaside Reading Room','Cannon Beach','Oregon','Cottage',2,4,18900,false,'A welcoming beach cottage, five minutes from the water.',true),
('heritage-row-home','Heritage Row Home','Charleston','South Carolina','Home',2,4,19800,true,'A carefully restored home with a shaded porch and local host.',true),
('meadow-lane-studio','Meadow Lane Studio','Berkshires','Massachusetts','Suite',1,2,12600,false,'A quiet garden studio with its own entrance and simple comforts.',true)
on conflict (id) do nothing;
