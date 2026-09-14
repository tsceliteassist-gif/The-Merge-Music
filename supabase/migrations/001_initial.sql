create type public.app_role as enum ('master_admin','admin','moderator','user');
create type public.live_status as enum ('scheduled','live','ended');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null,
  creator_type text not null default 'fan', avatar_url text, city text, state text, bio text,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_roles (user_id uuid references auth.users(id) on delete cascade, role public.app_role not null default 'user', primary key(user_id,role));
create table public.live_rooms (id uuid primary key default gen_random_uuid(), host_id uuid not null references auth.users(id), title text not null, status public.live_status not null default 'scheduled', started_at timestamptz, ended_at timestamptz, created_at timestamptz not null default now());
create table public.live_chat (id bigint generated always as identity primary key, room_id uuid not null references public.live_rooms on delete cascade, user_id uuid not null references auth.users(id), message text not null check(char_length(message) between 1 and 500), created_at timestamptz not null default now());
create table public.live_requests (id bigint generated always as identity primary key, room_id uuid not null references public.live_rooms on delete cascade, user_id uuid not null references auth.users(id), media_type text not null check(media_type in ('audio','video')), status text not null default 'pending' check(status in ('pending','approved','denied','removed')), created_at timestamptz not null default now(), unique(room_id,user_id,media_type));
create table public.gift_events (id bigint generated always as identity primary key, room_id uuid not null references public.live_rooms on delete cascade, sender_id uuid not null references auth.users(id), recipient_id uuid not null references auth.users(id), gift_code text not null, coin_amount integer not null check(coin_amount>0), created_at timestamptz not null default now());
create table public.audit_logs (id bigint generated always as identity primary key, actor_id uuid not null references auth.users(id), action text not null, target_id uuid, details jsonb not null default '{}', created_at timestamptz not null default now());
create index on public.live_rooms(status); create index on public.live_chat(room_id,created_at); create index on public.audit_logs(created_at desc);

create or replace function public.current_user_role() returns public.app_role language sql stable security definer set search_path=public as $$ select coalesce((select role from public.user_roles where user_id=auth.uid() order by case role when 'master_admin' then 1 when 'admin' then 2 when 'moderator' then 3 else 4 end limit 1),'user'::public.app_role) $$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path=public as $$ select public.current_user_role() in ('master_admin','admin','moderator') $$;
create or replace function public.make_profile() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.user_roles(user_id,role) values(new.id,'user'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.make_profile();

alter table public.profiles enable row level security; alter table public.user_roles enable row level security; alter table public.live_rooms enable row level security; alter table public.live_chat enable row level security; alter table public.live_requests enable row level security; alter table public.gift_events enable row level security; alter table public.audit_logs enable row level security;
create policy "members read profiles" on public.profiles for select to authenticated using(true);
create policy "own profile insert" on public.profiles for insert to authenticated with check(id=auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy "staff manage profiles" on public.profiles for update to authenticated using(public.is_staff());
create policy "read own role" on public.user_roles for select to authenticated using(user_id=auth.uid() or public.is_staff());
create policy "master manages roles" on public.user_roles for all to authenticated using(public.current_user_role()='master_admin') with check(public.current_user_role()='master_admin');
create policy "members read rooms" on public.live_rooms for select to authenticated using(true);
create policy "staff create rooms" on public.live_rooms for insert to authenticated with check(public.is_staff() and host_id=auth.uid());
create policy "host or staff update rooms" on public.live_rooms for update to authenticated using(host_id=auth.uid() or public.is_staff());
create policy "members read chat" on public.live_chat for select to authenticated using(true);
create policy "members send chat" on public.live_chat for insert to authenticated with check(user_id=auth.uid());
create policy "staff moderate chat" on public.live_chat for delete to authenticated using(public.is_staff());
create policy "own requests" on public.live_requests for select to authenticated using(user_id=auth.uid() or public.is_staff());
create policy "create own request" on public.live_requests for insert to authenticated with check(user_id=auth.uid());
create policy "staff manage requests" on public.live_requests for update to authenticated using(public.is_staff());
create policy "gift events readable" on public.gift_events for select to authenticated using(true);
-- Gift inserts intentionally disabled until a server-verified payment/coin ledger is connected.
create policy "staff read audit" on public.audit_logs for select to authenticated using(public.is_staff());
create policy "staff insert audit" on public.audit_logs for insert to authenticated with check(actor_id=auth.uid() and public.is_staff());
alter publication supabase_realtime add table public.live_rooms, public.live_chat, public.live_requests;

-- AFTER THE OWNER SIGNS UP, run this statement once in Supabase SQL Editor:
-- insert into public.user_roles(user_id,role) select id,'master_admin' from auth.users where email='tinastylez.customs@gmail.com' on conflict do nothing;
