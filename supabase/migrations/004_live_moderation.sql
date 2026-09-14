create policy "users delete own messages" on public.live_chat for delete to authenticated
using (user_id=auth.uid());

create policy "staff moderate messages" on public.live_chat for delete to authenticated
using (public.is_staff());

create policy "users cancel own requests" on public.live_requests for delete to authenticated
using (user_id=auth.uid() or public.is_staff());

create policy "hosts delete empty scheduled rooms" on public.live_rooms for delete to authenticated
using (
  (host_id=auth.uid() or public.is_staff())
  and status='scheduled'
  and not exists(select 1 from public.live_chat c where c.room_id=live_rooms.id)
  and not exists(select 1 from public.live_requests r where r.room_id=live_rooms.id)
  and not exists(select 1 from public.gift_events g where g.room_id=live_rooms.id)
);

-- Gift transaction/event rows are deliberately immutable for audit integrity.
