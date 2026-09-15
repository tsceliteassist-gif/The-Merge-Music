create extension if not exists pgcrypto;

alter table public.live_rooms add column if not exists description text;
alter table public.live_rooms add column if not exists cover_image_url text;
alter table public.live_rooms add column if not exists livekit_room_name text unique;
alter table public.live_rooms add column if not exists viewer_count integer not null default 0 check (viewer_count >= 0);

update public.live_rooms set livekit_room_name = 'merge-' || id::text where livekit_room_name is null;
alter table public.live_rooms alter column livekit_room_name set not null;

create type public.report_status as enum ('open','reviewing','resolved','dismissed');

create table if not exists public.gift_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null,
  coin_cost integer not null check (coin_cost > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  coins integer not null default 0 check (coins >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.gift_transactions (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id),
  receiver_id uuid not null references auth.users(id),
  room_id uuid not null references public.live_rooms(id),
  gift_id uuid not null references public.gift_catalog(id),
  quantity integer not null default 1 check (quantity between 1 and 100),
  coin_amount integer not null check (coin_amount > 0),
  status text not null default 'completed' check (status in ('completed','reversed')),
  created_at timestamptz not null default now()
);

create table if not exists public.creator_ledger (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id),
  transaction_id uuid not null unique references public.gift_transactions(id),
  gross_coins integer not null,
  platform_coins integer not null,
  creator_coins integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id),
  reported_user_id uuid references auth.users(id),
  room_id uuid references public.live_rooms(id),
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'stripe',
  provider_event_id text not null unique,
  event_type text not null,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace view public.live_chat_public with (security_invoker=true) as
select c.id,c.room_id,c.user_id,p.username,c.message,c.created_at
from public.live_chat c join public.profiles p on p.id=c.user_id;
grant select on public.live_chat_public to authenticated;

create or replace function public.send_gift_transaction(p_sender_id uuid,p_receiver_id uuid,p_room_id uuid,p_gift_id uuid,p_quantity integer)
returns public.gift_transactions language plpgsql security definer set search_path=public as $$
declare gift public.gift_catalog; balance integer; total integer; tx public.gift_transactions; platform integer;
begin
  if auth.role() <> 'service_role' then raise exception 'server authorization required'; end if;
  if not exists(select 1 from public.live_rooms where id=p_room_id and host_id=p_receiver_id and status='live') then raise exception 'live room or recipient is invalid'; end if;
  select * into gift from public.gift_catalog where id=p_gift_id and active=true for share;
  if not found then raise exception 'gift not found'; end if;
  if p_quantity < 1 or p_quantity > 100 then raise exception 'invalid quantity'; end if;
  total := gift.coin_cost*p_quantity;
  select coins into balance from public.user_balances where user_id=p_sender_id for update;
  if balance is null or balance < total then raise exception 'insufficient coins'; end if;
  update public.user_balances set coins=coins-total,updated_at=now() where user_id=p_sender_id;
  insert into public.gift_transactions(sender_id,receiver_id,room_id,gift_id,quantity,coin_amount) values(p_sender_id,p_receiver_id,p_room_id,p_gift_id,p_quantity,total) returning * into tx;
  platform := floor(total*0.30);
  insert into public.creator_ledger(creator_id,transaction_id,gross_coins,platform_coins,creator_coins) values(p_receiver_id,tx.id,total,platform,total-platform);
  return tx;
end $$;

create or replace function public.credit_coin_purchase(p_user_id uuid,p_provider_event_id text,p_coins integer)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.role() <> 'service_role' then raise exception 'server authorization required'; end if;
  if p_coins <= 0 then raise exception 'invalid coin amount'; end if;
  insert into public.payment_events(provider_event_id,event_type,processed) values(p_provider_event_id,'checkout.session.completed',true) on conflict(provider_event_id) do nothing;
  if not found then return; end if;
  insert into public.user_balances(user_id,coins) values(p_user_id,p_coins) on conflict(user_id) do update set coins=user_balances.coins+excluded.coins,updated_at=now();
end $$;

revoke all on function public.send_gift_transaction(uuid,uuid,uuid,uuid,integer) from public,anon,authenticated;
revoke all on function public.credit_coin_purchase(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.send_gift_transaction(uuid,uuid,uuid,uuid,integer) to service_role;
grant execute on function public.credit_coin_purchase(uuid,text,integer) to service_role;

alter table public.gift_catalog enable row level security;
alter table public.user_balances enable row level security;
alter table public.gift_transactions enable row level security;
alter table public.creator_ledger enable row level security;
alter table public.reports enable row level security;
alter table public.payment_events enable row level security;

create policy "members read active gifts" on public.gift_catalog for select to authenticated using(active=true);
create policy "users read own balance" on public.user_balances for select to authenticated using(user_id=auth.uid());
create policy "users read sent gifts" on public.gift_transactions for select to authenticated using(sender_id=auth.uid() or receiver_id=auth.uid() or public.is_staff());
create policy "creators read own ledger" on public.creator_ledger for select to authenticated using(creator_id=auth.uid() or public.is_staff());
create policy "users create reports" on public.reports for insert to authenticated with check(reporter_id=auth.uid());
create policy "users read own reports" on public.reports for select to authenticated using(reporter_id=auth.uid() or public.is_staff());
create policy "staff update reports" on public.reports for update to authenticated using(public.is_staff());
create policy "staff read payment events" on public.payment_events for select to authenticated using(public.is_staff());

insert into public.gift_catalog(name,icon,coin_cost) values
('Applause','👏',10),('Fire','🔥',25),('Crown','👑',100)
on conflict do nothing;

-- After the accounts are created in Supabase Auth, assign authority server-side:
-- insert into public.user_roles(user_id,role) select id,'master_admin' from auth.users where email='tinastylez.customs@gmail.com' on conflict do nothing;
-- Assign EJAY's owner-level authority using master_admin until a dedicated owner role is introduced.
