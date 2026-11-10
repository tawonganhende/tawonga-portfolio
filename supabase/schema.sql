create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  start_at timestamp without time zone not null,
  end_at timestamp without time zone,
  all_day boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_start_at_idx on public.events (start_at);
create index if not exists events_is_published_idx on public.events (is_published, start_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

alter table public.events enable row level security;

drop policy if exists "Public can view published events" on public.events;
create policy "Public can view published events"
on public.events
for select
using (is_published = true);

drop policy if exists "Authenticated can manage events" on public.events;
create policy "Authenticated can manage events"
on public.events
for all
to authenticated
using (true)
with check (true);