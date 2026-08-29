import "server-only";

import { resolveEffectiveRole } from "@/lib/auth/identity";
import type { PortalRole, PortalUser } from "@/lib/auth/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const roleWeight: Readonly<Record<PortalRole, number>> = {
  contributor: 0,
  editor: 1,
  admin: 2,
};

function highestPortalRole(values: readonly { role_name: string }[]): PortalRole {
  let role: PortalRole = "contributor";
  for (const value of values) {
    if (value.role_name !== "contributor" && value.role_name !== "editor" && value.role_name !== "admin") continue;
    if (roleWeight[value.role_name] > roleWeight[role]) role = value.role_name;
  }
  return role;
}

export async function getSupabasePortalUser(): Promise<PortalUser | null> {
  const client = await createSupabaseServerClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user?.email) return null;

  const { data: member, error: memberError } = await client
    .from("members")
    .select("id, access_status")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();
  if (memberError || !member) return null;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    client.from("profiles").select("display_name, avatar_url, profile_configured").eq("member_id", member.id).maybeSingle(),
    client.from("member_roles").select("role_name").eq("member_id", member.id).is("revoked_at", null),
  ]);

  const accessStatus = member.access_status;
  if (accessStatus !== "active" && accessStatus !== "pending" && accessStatus !== "suspended" && accessStatus !== "archived") return null;

  // Mirrors the Auth.js session callback's use of resolveEffectiveRole: a
  // CALI_CENTRAL_ADMIN_EMAILS/CALI_CENTRAL_EDITOR_EMAILS match elevates the
  // app-layer PortalUser.role (page-level requireEditor/requireAdmin gating)
  // the same way regardless of which auth backend is active. This does not
  // grant any Postgres RLS capability by itself -- private.has_role()/
  // has_capability() only ever consult member_roles/member_capabilities, so a
  // bootstrap admin still needs an explicit member_roles row before any RLS
  // write policy accepts their writes. That is intentional: RLS capability
  // grants must remain an explicit, auditable database action, never an
  // env-var-driven bypass.
  const storedRole = highestPortalRole(roles ?? []);
  const role = resolveEffectiveRole(storedRole, authData.user.email);

  return {
    id: member.id,
    displayName: profile?.display_name ?? authData.user.user_metadata.full_name ?? "Member",
    email: authData.user.email,
    avatarUrl: profile?.avatar_url ?? null,
    role,
    accessStatus,
    authProvider: "google",
    profileConfigured: profile?.profile_configured === true,
  };
}
