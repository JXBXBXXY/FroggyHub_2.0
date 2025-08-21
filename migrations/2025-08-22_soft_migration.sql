-- 1) Уникальность только по code
create unique index if not exists events_code_key on public.events(code);

-- 2) Связи wishlist_items → events
alter table public.wishlist_items
  add column if not exists event_id bigint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'wishlist_items_event_id_fkey'
  ) then
    alter table public.wishlist_items
      add constraint wishlist_items_event_id_fkey
      foreign key (event_id) references public.events(id) on delete cascade;
  end if;
end$$;

-- 3) Связи guests → events и доп. поля
alter table public.guests
  add column if not exists event_id bigint,
  add column if not exists nickname text,
  add column if not exists rsvp text check (rsvp in ('yes','maybe','no'));

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'guests_event_id_fkey'
  ) then
    alter table public.guests
      add constraint guests_event_id_fkey
      foreign key (event_id) references public.events(id) on delete cascade;
  end if;
end$$;
