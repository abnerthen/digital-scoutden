-- Integrity for the link between a troop member and their login.
--
-- public.members and auth.users are deliberately separate tables: auth.users
-- belongs to GoTrue and holds credentials, members is the troop roster and
-- includes the many people who never sign in. members.auth_user_id is the only
-- join between them, and until now nothing enforced it — it could point at a
-- user that had been deleted, or at no user at all, with no way to notice.

-- ─── The link must point at a real account ────────────────────────────────────
-- ON DELETE SET NULL rather than CASCADE: removing someone's login should not
-- delete them from the troop roster, only unlink them. Their history in the
-- log stays attributable either way.

alter table public.members
  add constraint members_auth_user_id_fkey
  foreign key (auth_user_id) references auth.users (id)
  on delete set null;

-- ─── Email matching must be unambiguous ───────────────────────────────────────
-- The existing UNIQUE (email) is case-sensitive, so 'QM@troop.test' and
-- 'qm@troop.test' can both exist as separate members. link_member_on_confirm
-- matches on lower(email), so it would be arbitrary which row got claimed.
-- Address comparison is case-insensitive in practice; make the constraint agree.

drop index if exists public.members_email_key_ci;
create unique index members_email_key_ci
  on public.members (lower(email));

-- ─── Seeing the two tables disagree ───────────────────────────────────────────
-- Reconciliation between the roster and the account list. Three states matter:
--
--   linked      a member with a working login
--   no login    a member who has never been invited, or never accepted
--   orphan      an account with no member row — someone who signed up
--               uninvited, or whose member row was deleted. Under the role
--               policies they can see nothing, but they should not linger.
--
-- security definer because authenticated has no grant on auth.users, and gated
-- on can_manage_members() so the account list is not readable by the troop at
-- large.

create or replace function public.account_link_report()
returns table (state text, full_name text, email text, role text, active boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.can_manage_members() then
    raise exception 'Only troop leaders may review account links'
      using errcode = '42501';
  end if;

  return query
    select
      case when m.auth_user_id is not null then 'linked' else 'no login' end,
      m.full_name, m.email, m.role, m.active
    from public.members m
    union all
    select 'orphan', null, u.email::text, null, null
    from auth.users u
    where not exists (
      select 1 from public.members m where m.auth_user_id = u.id
    );
end $$;

grant execute on function public.account_link_report() to authenticated;
