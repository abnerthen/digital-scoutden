-- Replace the blanket "authenticated users have full access" policies with
-- role-aware ones.
--
-- ⚠️ The drops are load-bearing. Postgres policies are permissive and OR'd
-- together, so leaving the old policy in place next to a strict one yields
-- `strict OR wide-open` — which is wide open. Every table must lose its old
-- policy in the same statement block that gains the new ones.

-- ─── Reference data: readable by the troop, edited by the storeroom team ──────

drop policy if exists "Authenticated users have full access" on public.categories;

create policy "troop reads categories" on public.categories
  for select using (public.is_troop_member());

create policy "storeroom writes categories" on public.categories
  for all
  using      (public.can_manage_inventory())
  with check (public.can_manage_inventory());

drop policy if exists "Authenticated users have full access" on public.locations;

create policy "troop reads locations" on public.locations
  for select using (public.is_troop_member());

create policy "storeroom writes locations" on public.locations
  for all
  using      (public.can_manage_inventory())
  with check (public.can_manage_inventory());

-- ─── Inventory ────────────────────────────────────────────────────────────────

drop policy if exists "Authenticated users have full access" on public.items;

create policy "troop reads items" on public.items
  for select using (public.is_troop_member());

create policy "storeroom writes items" on public.items
  for all
  using      (public.can_manage_inventory())
  with check (public.can_manage_inventory());

drop policy if exists "Authenticated users have full access" on public.item_units;

create policy "troop reads item units" on public.item_units
  for select using (public.is_troop_member());

create policy "storeroom writes item units" on public.item_units
  for all
  using      (public.can_manage_inventory())
  with check (public.can_manage_inventory());

-- ─── Checkouts ────────────────────────────────────────────────────────────────

drop policy if exists "Authenticated users have full access" on public.transactions;

create policy "troop reads transactions" on public.transactions
  for select using (public.is_troop_member());

create policy "storeroom writes transactions" on public.transactions
  for all
  using      (public.can_manage_inventory())
  with check (public.can_manage_inventory());

-- ─── Patrols ──────────────────────────────────────────────────────────────────

drop policy if exists "Authenticated users have full access" on public.groups;

create policy "troop reads groups" on public.groups
  for select using (public.is_troop_member());

create policy "storeroom writes groups" on public.groups
  for all
  using      (public.can_manage_inventory())
  with check (public.can_manage_inventory());

drop policy if exists "Authenticated users have full access" on public.group_members;

create policy "troop reads group members" on public.group_members
  for select using (public.is_troop_member());

create policy "storeroom writes group members" on public.group_members
  for all
  using      (public.can_manage_inventory())
  with check (public.can_manage_inventory());

-- ─── People ───────────────────────────────────────────────────────────────────
-- Contains names and email addresses of minors, so it is the most sensitive
-- table here. Readable by the troop, written only by adult leadership.
-- Quartermasters are excluded: see the escalation guard in the next migration
-- for the half that RLS cannot express.

drop policy if exists "Authenticated users have full access" on public.members;

create policy "troop reads members" on public.members
  for select using (public.is_troop_member());

create policy "leaders write members" on public.members
  for all
  using      (public.can_manage_members())
  with check (public.can_manage_members());

-- ─── Ledger ───────────────────────────────────────────────────────────────────
-- Append-only, deliberately. There is no UPDATE policy and no DELETE policy, so
-- nobody — quartermaster, troop leader, or anyone else — can rewrite history.
-- A log that can be edited is not evidence of anything.
--
-- Correcting a mistake means appending a correcting entry, which is what a
-- ledger has always meant.

drop policy if exists "Authenticated users have full access" on public.log;

create policy "troop reads log" on public.log
  for select using (public.is_troop_member());

create policy "storeroom appends to log" on public.log
  for insert with check (public.can_manage_inventory());
