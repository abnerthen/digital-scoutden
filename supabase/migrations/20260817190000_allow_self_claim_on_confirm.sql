-- Let an invited member's login attach to their own member row.
--
-- 20260817162000 added two triggers that turn out to contradict each other:
--
--   link_member_on_confirm   sets members.auth_user_id when an invited user
--                            confirms their email
--   guard_member_privileges  refuses any change to auth_user_id unless
--                            can_manage_members()
--
-- GoTrue confirms the user on its own connection, with no JWT, so
-- can_manage_members() is false and the guard rejects the link. The whole
-- confirmation transaction rolls back and the invite link dies with
-- "Error confirming user" — invitations could never be accepted.
--
-- Rather than exempting the trigger by ambient session state, the guard now
-- states the one case that is legitimately self-service: an unclaimed member
-- row may be claimed by a confirmed account bearing the same email address.
-- Anyone pointing a login at somebody else's row still fails, because the
-- addresses will not match, and a row that is already claimed cannot be taken.

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
     -- Un-linking takes access away, so it is never an escalation. It also has
     -- to be allowed: members.auth_user_id is ON DELETE SET NULL, so deleting
     -- an account makes the foreign key null this column — and the guard
     -- refusing that made "Database error deleting user" of every attempt to
     -- remove a login.
     and new.auth_user_id is not null
     and not public.can_manage_members()
     -- The self-claim exemption: previously unclaimed, and the account taking
     -- it has proved control of the same mailbox this member is listed under.
     and not (
       old.auth_user_id is null
       and exists (
         select 1 from auth.users u
         where u.id = new.auth_user_id
           and lower(u.email) = lower(new.email)
           and u.email_confirmed_at is not null
       )
     ) then
    raise exception 'Only troop leaders may link a login to a member'
      using errcode = '42501';
  end if;

  return new;
end $$;
