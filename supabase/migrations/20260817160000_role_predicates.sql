-- Role predicates for row-level security.
--
-- Until now every policy asked `auth.role() = 'authenticated'`, which means
-- "holds an account" — not "belongs to this troop". With signup open that is
-- effectively the public, so these predicates replace account-holding with
-- troop membership as the unit of authorisation.
--
-- Every predicate requires `active`. A member who has left the troop keeps
-- their login until it is deleted by hand, so role alone is not enough.

-- ─── Role vocabulary ──────────────────────────────────────────────────────────
-- `role` was free text. Now that policies branch on it, a typo would silently
-- deny access (or, worse, quietly grant nothing and look like a bug elsewhere).
-- Values match ROLES in src/constants/index.js.

alter table public.members
  add constraint members_role_valid check (role in (
    'scout',
    'troop_leader',
    'assistant_leader',
    'quartermaster',
    'assistant_qm',
    'committee_member',
    'scouter'
  ));

-- ─── Predicates ───────────────────────────────────────────────────────────────
-- security definer is REQUIRED, not stylistic: these read public.members, and
-- members carries its own RLS policies. A policy that calls a function that
-- reads the same table recurses — Postgres raises 42P17. Running as the owner
-- bypasses RLS on that internal read and breaks the cycle.
--
-- `set search_path = ''` with fully-qualified names stops a caller-controlled
-- search_path from resolving these to something else.

create or replace function public.current_member_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.members
  where auth_user_id = (select auth.uid())
    and active
  limit 1
$$;

comment on function public.current_member_role() is
  'Troop role of the signed-in user, or NULL if they are not an active member.';

-- The coalesce is not decoration. current_member_role() is NULL for anyone
-- without a member row, and `NULL in (...)` is NULL, not false. RLS happens to
-- treat a NULL USING expression as deny — but PL/pgSQL does not: `if not NULL`
-- never fires, which would skip the escalation guard in the privilege trigger
-- for exactly the users least entitled to bypass it. Returning a real boolean
-- makes every caller behave the same way.

-- May run the storeroom: items, stock levels, checkouts, categories, locations.
create or replace function public.can_manage_inventory()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_member_role() in (
    'quartermaster', 'assistant_qm',
    'troop_leader', 'assistant_leader', 'scouter'
  ), false)
$$;

-- May manage people: add members, change roles, link logins.
-- Deliberately excludes quartermasters — running the storeroom must not carry
-- the ability to promote yourself out of it.
create or replace function public.can_manage_members()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_member_role() in (
    'troop_leader', 'assistant_leader', 'scouter'
  ), false)
$$;

-- Belongs to the troop at all. The floor for reading anything.
create or replace function public.is_troop_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_member_role() is not null
$$;

grant execute on function public.current_member_role() to authenticated;
grant execute on function public.can_manage_inventory() to authenticated;
grant execute on function public.can_manage_members()   to authenticated;
grant execute on function public.is_troop_member()      to authenticated;
