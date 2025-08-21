drop index if exists events_host_datetime_title_key;
create unique index if not exists events_code_key on public.events (code);

alter table public.wishlist_items
  add column if not exists event_id bigint references public.events(id) on delete cascade,
  add column if not exists claimed_by text;

alter table public.guests
  add column if not exists event_id bigint references public.events(id) on delete cascade,
  add column if not exists nickname text,
  add column if not exists rsvp text check (rsvp in ('yes','maybe','no'));

create index if not exists guests_event_idx on public.guests(event_id);
