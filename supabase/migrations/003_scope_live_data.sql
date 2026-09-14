create or replace function public.is_live_room_member(target_room uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.live_requests r where r.room_id=target_room and r.user_id=auth.uid())
  or exists(select 1 from public.live_rooms r where r.id=target_room and r.host_id=auth.uid());
$$;
revoke all on function public.is_live_room_member(uuid) from public, anon;
grant execute on function public.is_live_room_member(uuid) to authenticated;

drop policy if exists "members read rooms" on public.live_rooms;
create policy "members read relevant rooms" on public.live_rooms for select to authenticated
using (status='live' or host_id=auth.uid() or public.is_live_room_member(id) or public.is_staff());

drop policy if exists "members read chat" on public.live_chat;
create policy "room members read chat" on public.live_chat for select to authenticated
using (public.is_live_room_member(room_id) or public.is_staff());

drop policy if exists "members send chat" on public.live_chat;
create policy "room members send chat" on public.live_chat for insert to authenticated
with check (user_id=auth.uid() and public.is_live_room_member(room_id));

drop policy if exists "gift events readable" on public.gift_events;
create policy "room members read gifts" on public.gift_events for select to authenticated
using (public.is_live_room_member(room_id) or public.is_staff());

-- Inserts remain disabled until the server-verified coin/payment ledger is connected.
