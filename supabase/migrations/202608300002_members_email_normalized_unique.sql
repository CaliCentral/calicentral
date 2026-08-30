-- provision_auth_user() inserts a new public.members row for every new
-- auth.users row, unconditionally, with no check for an existing member at
-- that email. Under Google as the sole provider this is safe in practice
-- (one Google account owns one email, and repeat sign-in reuses the same
-- auth.users row), but nothing in the schema actually enforces the "one
-- verified email -> one member" invariant the contributorIdentityClaim
-- retirement relies on. Adding a future auth provider (or any Supabase Auth
-- flow that can create a second auth.users row for an already-registered
-- email, e.g. email/password or invite-by-email, without account linking
-- enabled) would silently create a second, unrelated member for the same
-- person instead of colliding.
--
-- email_normalized is citext, so comparison is already case-insensitive;
-- this only needs a plain unique constraint, matching the existing
-- public.profiles.handle precedent. A standard unique constraint treats
-- multiple nulls as distinct, so D1-imported or Sanity-imported members
-- without a known email remain unaffected.
alter table public.members
  add constraint members_email_normalized_key unique (email_normalized);
