import type { Metadata } from "next";
import Link from "next/link";

import { MetricCard } from "@/components/operations/metric-card";
import { OperationsNotice, OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { requireEditor } from "@/lib/auth";
import { SupabaseAdminRepository } from "@/lib/supabase/admin-repository";

export const metadata: Metadata = {
  title: "Admin — Supabase (db)",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

const repository = new SupabaseAdminRepository();

const sections = [
  { href: "/admin/db/editorial", label: "Editorial", description: "Stories and videos: draft, review, publish, unpublish, revisions." },
  { href: "/admin/db/athletes", label: "Athletes", description: "Canonical athlete records, identity state, external identities." },
  { href: "/admin/db/organizations", label: "Organizations", description: "Federations, leagues, competition organizers, gyms." },
  { href: "/admin/db/competitions", label: "Competitions", description: "Competition editions and their public visibility." },
  { href: "/admin/db/rankings", label: "Rankings", description: "Ranking providers, systems, and published snapshots." },
  { href: "/admin/db/sporting-results", label: "Sporting results", description: "Official result review queue and source-truth writes." },
  { href: "/admin/db/provenance", label: "Provenance lookup", description: "Ad-hoc source/provenance/audit inspection by record id." },
] as const;

export default async function AdminSupabaseIndexPage() {
  await requireEditor("/admin/db");

  const [athletes, organizations, competitions, sportingResults] = await Promise.all([
    repository.listAthletes(),
    repository.listOrganizations(),
    repository.listCompetitions(),
    repository.listSportingResults(),
  ]);

  const pendingResults = sportingResults.filter((r) => r.result_status === "submitted" || r.result_status === "provisional").length;

  return (
    <OperationsPage
      eyebrow="Internal / Supabase-backed admin"
      title="Editorial &amp; sport desk (Supabase)"
      description="This section reads and writes Postgres directly through Supabase, enforced by row-level security. It runs alongside the existing Sanity-backed admin during the migration; nothing here deletes or bypasses Sanity/D1."
    >
      <OperationsNotice title="Dual-run" tone="neutral">
        This is the Supabase-native admin, not a replacement for
        /admin yet. Sanity and D1 remain the source of truth for the public
        site until the cutover gates in docs/supabase-migration.md pass.
      </OperationsNotice>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Athletes" value={athletes.length} />
        <MetricCard label="Organizations" value={organizations.length} />
        <MetricCard label="Competitions" value={competitions.length} />
        <MetricCard label="Results needing review" value={pendingResults} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="block">
            <OperationsPanel title={section.label} className="transition-colors hover:border-accent/60">
              <p>{section.description}</p>
            </OperationsPanel>
          </Link>
        ))}
      </div>
    </OperationsPage>
  );
}
