-- Public profile discovery must never query the base table.
drop policy if exists "members read profiles" on public.profiles;
drop policy if exists "authenticated profiles readable" on public.profiles;
drop policy if exists "users read own profile" on public.profiles;

create policy "owner or staff reads private profile"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_staff());

drop view if exists public.public_profiles;
create view public.public_profiles
with (security_invoker = false, security_barrier = true) as
select id, username, display_name, creator_type, avatar_url, city, state, bio,
       is_suspended, created_at, updated_at
from public.profiles
where is_suspended = false;

revoke all on public.public_profiles from public, anon;
grant select on public.public_profiles to authenticated;

comment on view public.public_profiles is
'Safe member directory. Email and all authentication data are intentionally excluded.';
