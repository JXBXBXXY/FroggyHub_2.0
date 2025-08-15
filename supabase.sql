-- profiles
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  nickname text not null,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles owner" on public.profiles
  for all using (auth.uid() = id);

-- events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  code text unique not null,
  title text not null,
  event_date date,
  created_at timestamptz default now()
);
alter table public.events enable row level security;
create policy "select own/participant events" on public.events
  for select using (
    owner_id = auth.uid()
    or id in (select event_id from public.participants where user_id = auth.uid())
  );
create policy "insert events" on public.events
  for insert with check (owner_id = auth.uid());
create policy "update own events" on public.events
  for update using (owner_id = auth.uid());
create policy "delete own events" on public.events
  for delete using (owner_id = auth.uid());

-- participants
create table public.participants (
  event_id uuid references public.events(id) on delete cascade,
  user_id  uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key(event_id, user_id)
);
alter table public.participants enable row level security;
create policy "self participant" on public.participants
  for all using (auth.uid() = user_id);

-- wishlist_items
create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  url text,
  reserved_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
alter table public.wishlist_items enable row level security;
create policy "view event wishlist" on public.wishlist_items
  for select using (
    event_id in (
      select event_id from public.participants where user_id = auth.uid()
      union select id from public.events where owner_id = auth.uid()
    )
  );
create policy "insert own wishlist items" on public.wishlist_items
  for insert with check (owner_id = auth.uid());
create policy "update own wishlist items" on public.wishlist_items
  for update using (owner_id = auth.uid());
create policy "reserve wishlist items" on public.wishlist_items
  for update using (
    event_id in (
      select event_id from public.participants where user_id = auth.uid()
      union select id from public.events where owner_id = auth.uid()
    )
  );

-- cookie_consents
create table public.cookie_consents (
  user_id uuid primary key references auth.users on delete cascade,
  consented boolean not null default false,
  updated_at timestamptz default now()
);
alter table public.cookie_consents enable row level security;
create policy "cookie owner" on public.cookie_consents
  for all using (auth.uid() = user_id);
