-- Local development seed data.
-- Applied automatically by `supabase start` and `supabase db reset`.
-- Fixed UUIDs so the fixture is identical after every reset.
--
-- Sign in at http://localhost:5173, password `password123` for all of:
--   qm@troop.test      quartermaster   — runs the storeroom
--   sam@troop.test     troop_leader    — manages members and roles
--   jordan@troop.test  scout           — read only
--   former@troop.test  quartermaster, but INACTIVE — should be refused

-- The pulled migration ends with pg_dump's `set_config('search_path','')`, and the
-- seed runs in that same session — so unqualified table names would not resolve.
set search_path = public, extensions;

-- ─── Safety guard ─────────────────────────────────────────────────────────────
-- This file is for local development only. It is never applied by `db push`,
-- which handles migrations alone — but `db push --include-seed` and
-- `db reset --linked` both target the remote database. If either is ever run by
-- accident, abort rather than write fixture data into a database that has real
-- records in it. A freshly reset local database is empty, so seeding proceeds.
do $$
begin
  if (select count(*) from public.members) > 0 then
    raise exception
      'Refusing to seed: members table is not empty. supabase/seed.sql is for local development only.';
  end if;
end $$;

-- ─── Auth users ───────────────────────────────────────────────────────────────
-- One login per privilege tier, so the RLS policies can actually be exercised:
-- a quartermaster, a plain scout, a troop leader, and a deactivated former
-- quartermaster. All share the password `password123`.

-- The token columns must be '' rather than NULL: GoTrue scans them into
-- non-nullable strings and a NULL makes every login fail with
-- "Database error querying schema". Wrapped in a pg_temp function so adding a
-- login is one line rather than twenty; it vanishes with the session.
create function pg_temp.seed_auth_user(uid uuid, addr text, pw text)
returns void language plpgsql as $fn$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
    confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    uid, 'authenticated', 'authenticated', addr,
    -- pgcrypto is installed into the `extensions` schema, not public
    extensions.crypt(pw, extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb, false, false,
    '', '', '', '', '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid, uid,
    jsonb_build_object(
      'sub', uid::text, 'email', addr,
      'email_verified', true, 'phone_verified', false
    ),
    'email', now(), now(), now()
  );
end $fn$;

select pg_temp.seed_auth_user('aaaaaaaa-0000-4000-8000-000000000001', 'qm@troop.test',     'password123');
select pg_temp.seed_auth_user('aaaaaaaa-0000-4000-8000-000000000004', 'jordan@troop.test', 'password123');
select pg_temp.seed_auth_user('aaaaaaaa-0000-4000-8000-000000000003', 'sam@troop.test',    'password123');
select pg_temp.seed_auth_user('aaaaaaaa-0000-4000-8000-000000000007', 'former@troop.test', 'password123');

-- ─── Members ──────────────────────────────────────────────────────────────────
-- The Buy More / Write Off / Archive modals filter to quartermaster +
-- assistant_qm, so at least one of each is needed for those dropdowns.

insert into members (id, auth_user_id, full_name, email, role, active) values
  ('b0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
   'Alex Tan',    'qm@troop.test',        'quartermaster',    true),
  ('b0000000-0000-4000-8000-000000000002', null,
   'Priya Nair',  'priya@troop.test',     'assistant_qm',     true),
  ('b0000000-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000003',
   'Sam Lee',     'sam@troop.test',       'troop_leader',     true),
  ('b0000000-0000-4000-8000-000000000004', 'aaaaaaaa-0000-4000-8000-000000000004',
   'Jordan Wong', 'jordan@troop.test',    'scout',            true),
  ('b0000000-0000-4000-8000-000000000005', null,
   'Mei Chen',    'mei@troop.test',       'scout',            true),
  ('b0000000-0000-4000-8000-000000000006', null,
   'Ravi Kumar',  'ravi@troop.test',      'scout',            true),
  -- Inactive, and deliberately still a quartermaster with a working login: the
  -- policies must key off `active`, not role alone, or someone who has left the
  -- troop keeps their access.
  ('b0000000-0000-4000-8000-000000000007', 'aaaaaaaa-0000-4000-8000-000000000007',
   'Old Scout',   'former@troop.test',    'quartermaster',    false);

-- ─── Categories ───────────────────────────────────────────────────────────────

insert into categories (id, name, protected) values
  ('c0000000-0000-4000-8000-000000000001', 'Tentage',    true),
  ('c0000000-0000-4000-8000-000000000002', 'Cooking',    false),
  ('c0000000-0000-4000-8000-000000000003', 'Navigation', false),
  ('c0000000-0000-4000-8000-000000000004', 'Safety',     false);

-- ─── Locations ────────────────────────────────────────────────────────────────

-- grid_* lay the room out on a 6-column schematic:
--   ┌───────┬───────┬───────┐
--   │Shelf A│Shelf B│ Cage  │   (Cage is two rows tall)
--   ├───────┴───────┤       │
--   │     Loft      │       │
--   └───────────────┴───────┘
insert into locations (id, name, protected, grid_x, grid_y, grid_w, grid_h) values
  ('a1000000-0000-4000-8000-000000000001', 'Shelf A — Tentage', false, 0, 0, 2, 1),
  ('a1000000-0000-4000-8000-000000000002', 'Shelf B — Cooking', false, 2, 0, 2, 1),
  ('a1000000-0000-4000-8000-000000000003', 'Cage (locked)',     true,  4, 0, 2, 2),
  ('a1000000-0000-4000-8000-000000000004', 'Loft',              false, 0, 1, 4, 1);

-- ─── Items ────────────────────────────────────────────────────────────────────
-- Mixed states: healthy stock, low stock (quantity <= 2 triggers the banner),
-- units already out, a pending delivery, and an archived item.

insert into items (id, name, category_id, location_id, quantity, total_owned, unit, notes, removed, removed_reason) values
  ('d0000000-0000-4000-8000-000000000001', '4-Man Tent',
   'c0000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
   6, 8, 'tents', 'Two out with Eagle Patrol', false, null),
  ('d0000000-0000-4000-8000-000000000002', 'Groundsheet',
   'c0000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
   12, 12, 'sheets', null, false, null),
  ('d0000000-0000-4000-8000-000000000003', 'Trangia Stove',
   'c0000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002',
   2, 5, 'sets', 'Low stock — triggers the warning banner', false, null),
  ('d0000000-0000-4000-8000-000000000004', 'Billy Can',
   'c0000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002',
   9, 9, 'cans', null, false, null),
  ('d0000000-0000-4000-8000-000000000005', 'Prismatic Compass',
   'c0000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003',
   1, 4, 'units', 'Low stock', false, null),
  -- total_owned > quantity with no open transaction = pending delivery,
  -- which is what enables Check In on an item with nothing checked out
  ('d0000000-0000-4000-8000-000000000006', 'First Aid Kit',
   'c0000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000003',
   3, 6, 'kits', 'Three ordered, not yet delivered', false, null),
  -- deliberately left with no location, to exercise the unassigned case
  ('d0000000-0000-4000-8000-000000000007', 'Kerosene Lamp',
   'c0000000-0000-4000-8000-000000000004', null,
   0, 0, 'lamps', null, true, 'Damaged beyond repair');

-- ─── Groups ───────────────────────────────────────────────────────────────────

insert into groups (id, name, type) values
  ('e0000000-0000-4000-8000-000000000001', 'Eagle Patrol', 'led'),
  ('e0000000-0000-4000-8000-000000000002', 'Kitchen Crew', 'collective');

insert into group_members (id, group_id, member_id, name, is_leader) values
  (gen_random_uuid(), 'e0000000-0000-4000-8000-000000000001',
   'b0000000-0000-4000-8000-000000000004', 'Jordan Wong', true),
  (gen_random_uuid(), 'e0000000-0000-4000-8000-000000000001',
   'b0000000-0000-4000-8000-000000000005', 'Mei Chen',    false),
  (gen_random_uuid(), 'e0000000-0000-4000-8000-000000000002',
   'b0000000-0000-4000-8000-000000000006', 'Ravi Kumar',  false);

-- ─── Open transaction ─────────────────────────────────────────────────────────
-- returned_at is null, so this is an outstanding checkout. It exercises the
-- Check In flow and the derived group "Items Out" counts.

insert into transactions (
  id, item_id, group_id, qty, requester_id, checkout_checker_id,
  event, checkout_remarks, checked_out_at, returned_at
) values (
  'f0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000001',
  'e0000000-0000-4000-8000-000000000001',
  2,
  'b0000000-0000-4000-8000-000000000004',
  'b0000000-0000-4000-8000-000000000001',
  'District Camp', 'Both checked for tears before issue',
  now() - interval '3 days', null
);

-- ─── Log ──────────────────────────────────────────────────────────────────────
-- requester_id and checker_id are NOT NULL with no default, so every row
-- must name a member.

insert into log (id, type, item_id, qty, unit, requester_id, checker_id, event, notes, created_at) values
  (gen_random_uuid(), 'ADD', 'd0000000-0000-4000-8000-000000000001', 8, 'tents',
   'b0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
   'New purchase', 'Initial stock', now() - interval '30 days'),
  (gen_random_uuid(), 'OUT', 'd0000000-0000-4000-8000-000000000001', 2, 'tents',
   'b0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001',
   'District Camp', 'Both checked for tears before issue', now() - interval '3 days'),
  (gen_random_uuid(), 'WRITEOFF', 'd0000000-0000-4000-8000-000000000007', 2, 'lamps',
   'b0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002',
   'Write-off', 'Glass shattered in transit', now() - interval '10 days');
