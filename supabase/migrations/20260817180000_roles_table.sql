-- Roles as a table rather than a list repeated in thirteen places.
--
-- The role vocabulary was written down in a CHECK constraint, in three SQL
-- predicates, in src/constants/index.js, and inline in six React components.
-- Nothing connected them, so they could drift apart silently — the UI offering
-- a role the database would reject, or a component's idea of "quartermaster"
-- diverging from the one the policies enforce.
--
-- The capability columns are the point. `manages_inventory` and
-- `manages_members` are the same two decisions the predicates were making from
-- hardcoded lists; now both the database and the app read them from here.

create table public.roles (
  name              text primary key,
  label             text not null,
  sort_order        integer not null,
  manages_inventory boolean not null default false,
  manages_members   boolean not null default false
);

comment on table public.roles is
  'Troop role vocabulary and what each role may do. Changed only by migration.';

insert into public.roles (name, label, sort_order, manages_inventory, manages_members) values
  ('troop_leader',     'Troop Leader',              1, true,  true),
  ('assistant_leader', 'Assistant Troop Leader',    2, true,  true),
  ('scouter',          'Scouter',                   3, true,  true),
  ('quartermaster',    'Quartermaster',             4, true,  false),
  ('assistant_qm',     'Assistant Quartermaster',   5, true,  false),
  ('committee_member', 'Committee Member',          6, false, false),
  ('scout',            'Scout',                     7, false, false);

-- ─── Members now reference the vocabulary ─────────────────────────────────────
-- Replaces the CHECK constraint added alongside the role predicates. A foreign
-- key says the same thing and keeps saying it as the vocabulary changes.
-- No ON DELETE clause, so the default RESTRICT applies: a role that is in use
-- cannot be removed out from under the members holding it.

alter table public.members drop constraint if exists members_role_valid;

alter table public.members
  add constraint members_role_fkey
  foreign key (role) references public.roles (name)
  on update cascade;

-- ─── Read-only to everyone ────────────────────────────────────────────────────
-- ⚠️ There is deliberately no INSERT, UPDATE or DELETE policy. These rows are
-- policy, not data. If a troop leader could set manages_members = true on
-- 'scout', the privilege guards elsewhere in this schema would be pointless —
-- the escalation would simply move one table across. Changing what a role may
-- do requires a migration, which is reviewed and shows up in git history.

alter table public.roles enable row level security;

create policy "anyone signed in reads roles" on public.roles
  for select using (auth.role() = 'authenticated');

grant select on public.roles to authenticated;

-- ─── Predicates read the table ────────────────────────────────────────────────
-- Same answers as before, sourced from the roles table instead of from lists
-- repeated in each function body. Still security definer: they read
-- public.members, which carries its own policies, and a policy calling a
-- function that reads the same table recurses with 42P17.
--
-- coalesce keeps them returning false rather than NULL for a caller with no
-- member row. RLS treats a NULL USING as deny, but PL/pgSQL does not —
-- `if not NULL` never fires, which would skip the escalation guard for exactly
-- the callers least entitled to bypass it.

create or replace function public.can_manage_inventory()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select r.manages_inventory
    from public.members m
    join public.roles r on r.name = m.role
    where m.auth_user_id = (select auth.uid())
      and m.active
    limit 1
  ), false)
$$;

create or replace function public.can_manage_members()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select r.manages_members
    from public.members m
    join public.roles r on r.name = m.role
    where m.auth_user_id = (select auth.uid())
      and m.active
    limit 1
  ), false)
$$;
