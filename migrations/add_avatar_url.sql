alter table public.users_local
  add column if not exists avatar_url text;

create index if not exists guests_nickname_idx on public.guests(nickname);
