-- Guards for the two things RLS cannot express on its own.

-- ─── Privilege escalation ─────────────────────────────────────────────────────
-- A policy's WITH CHECK only sees the NEW row, so "this column must be
-- unchanged" is not expressible in RLS. Without this, any member who can update
-- their own row could set role = 'troop_leader' and grant themselves everything.
--
-- Two columns are guarded. `role` is the obvious one. `auth_user_id` matters
-- just as much: pointing your own login at the troop leader's member row is
-- promotion under another name.

create or replace function public.guard_member_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and not public.can_manage_members() then
    raise exception 'Only troop leaders may change a member''s role'
      using errcode = '42501';
  end if;

  if new.auth_user_id is distinct from old.auth_user_id
     and not public.can_manage_members() then
    raise exception 'Only troop leaders may link a login to a member'
      using errcode = '42501';
  end if;

  return new;
end $$;

create trigger members_guard_privileges
  before update on public.members
  for each row execute function public.guard_member_privileges();

-- ─── Linking an invited member to their login ─────────────────────────────────
-- An invited member arrives as a fresh auth.users row with no connection to the
-- members table. This links them by email once — and only once — they have
-- proved they control the mailbox.
--
-- `email_confirmed_at is null` is what makes it safe: without it, anyone who
-- knows a member's address could sign up and claim their row, inheriting the
-- role. Accepting an invite sets this column, so invited members link on
-- acceptance.
--
-- `auth_user_id is null` stops an already-claimed row being taken over.

create or replace function public.link_member_on_confirm()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is null then
    return new;
  end if;

  update public.members
     set auth_user_id = new.id
   where lower(email) = lower(new.email)
     and auth_user_id is null;

  return new;
end $$;

create trigger on_auth_user_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.link_member_on_confirm();

-- A confirmed account with no matching members row gets no role, so every
-- predicate returns false and they can see nothing. Signing up uninvited
-- therefore grants access to precisely nothing.
