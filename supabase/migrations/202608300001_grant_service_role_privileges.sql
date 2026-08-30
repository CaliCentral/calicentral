-- service_role has BYPASSRLS but was never given base table privileges by any
-- prior migration (only anon/authenticated received explicit grants). RLS
-- bypass and table-level GRANTs are independent Postgres mechanisms, so every
-- service-role write -- the migration importers in scripts/migration/, and
-- any future use of lib/supabase/admin.ts's admin client -- failed with
-- "permission denied" on all 66 public tables. Also set default privileges so
-- tables added by future migrations aren't silently missing this again.

grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

alter default privileges in schema public grant all privileges on tables to service_role;
alter default privileges in schema public grant all privileges on sequences to service_role;
alter default privileges in schema public grant all privileges on functions to service_role;
