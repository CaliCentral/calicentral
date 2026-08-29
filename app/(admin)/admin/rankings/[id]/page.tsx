import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import { requireEditor } from "@/lib/auth";
import { getSanityAdminRankingSnapshot } from "@/lib/content/sanity-source";
import {
  adminDateLabel,
  adminStatusLabel,
  rankingDimensionsLabel,
  rankingValueLabel,
} from "@/lib/presentation/admin-rankings";

export const metadata: Metadata = {
  title: "Admin — Ranking snapshot",
};

type Props = { params: Promise<{ id: string }> };

function DefinitionField({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string | undefined;
}) {
  return (
    <div className="border-b border-white/10 py-3 first:pt-0 last:border-b-0 last:pb-0">
      <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-ink">
        {value || "Not set"}
      </dd>
    </div>
  );
}

export default async function AdminRankingDetailPage({ params }: Props) {
  const { id } = await params;
  await requireEditor(`/admin/rankings/${id}`);

  const snapshot = await getSanityAdminRankingSnapshot(id);

  if (!snapshot) {
    notFound();
  }

  const system = snapshot.system;
  const provider = system?.provider;

  return (
    <OperationsPage
      eyebrow="Internal / Ranking snapshot"
      title={system?.name ?? "Ranking snapshot"}
      description="Read-only provider attribution, lifecycle state, canonical athlete linkage, and public source provenance."
      actions={
        <Link
          href="/admin/rankings"
          className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Back to rankings
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.65fr)_minmax(0,1.35fr)]">
        <div className="space-y-6">
          <OperationsPanel title="Snapshot lifecycle">
            <dl>
              <DefinitionField
                label="Snapshot canonical ID"
                value={snapshot.canonicalId}
              />
              <DefinitionField
                label="Publication status"
                value={`${adminStatusLabel(snapshot.publicationStatus)}${
                  snapshot.publicationStatus === "published"
                    ? " / Publication candidate"
                    : " / Not public"
                }`}
              />
              <DefinitionField
                label="Ranking date"
                value={adminDateLabel(snapshot.rankingDate)}
              />
              <DefinitionField
                label="Source published"
                value={adminDateLabel(snapshot.sourcePublishedAt)}
              />
              <DefinitionField
                label="Checked at"
                value={adminDateLabel(
                  snapshot.checkedAt ?? snapshot.provenance.checkedAt,
                )}
              />
              <DefinitionField label="Season" value={snapshot.season} />
            </dl>
          </OperationsPanel>

          <OperationsPanel title="Provider">
            <dl>
              <DefinitionField
                label="Provider canonical ID"
                value={provider?.canonicalId}
              />
              <DefinitionField label="Name" value={provider?.name} />
              <DefinitionField
                label="Status"
                value={adminStatusLabel(provider?.status)}
              />
              <DefinitionField
                label="Integration method"
                value={adminStatusLabel(provider?.integrationMethod)}
              />
              <DefinitionField
                label="Geographic scope"
                value={provider?.geographicScope}
              />
              <DefinitionField
                label="Disciplines"
                value={
                  provider?.disciplines.length
                    ? provider.disciplines.join(", ")
                    : undefined
                }
              />
              <DefinitionField
                label="Attribution requirement"
                value={provider?.attributionRequirement}
              />
            </dl>
            {provider?.website ? (
              <a
                href={provider.website}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex font-mono text-xs font-bold uppercase tracking-[0.1em] text-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
              >
                Provider website ↗
              </a>
            ) : null}
          </OperationsPanel>
        </div>

        <div className="space-y-6">
          <OperationsPanel title="Ranking system definition">
            <p className="mb-5 text-sm leading-6 text-muted">
              {rankingDimensionsLabel(system)}
            </p>
            <dl className="grid gap-x-8 sm:grid-cols-2">
              <DefinitionField
                label="System canonical ID"
                value={system?.canonicalId}
              />
              <DefinitionField label="System slug" value={system?.slug} />
              <DefinitionField
                label="System status"
                value={adminStatusLabel(system?.status)}
              />
              <DefinitionField
                label="Ranking kind"
                value={adminStatusLabel(system?.rankingKind)}
              />
              <DefinitionField label="Discipline" value={system?.discipline} />
              <DefinitionField label="Movement" value={system?.movement} />
              <DefinitionField label="Category" value={system?.category} />
              <DefinitionField label="Division" value={system?.division} />
              <DefinitionField
                label="Weight class"
                value={system?.weightClass}
              />
              <DefinitionField
                label="Sex division"
                value={system?.sexDivision}
              />
              <DefinitionField label="Age group" value={system?.ageGroup} />
              <DefinitionField
                label="Geographic scope"
                value={system?.geographicScope}
              />
              <DefinitionField
                label="Methodology version"
                value={
                  snapshot.methodologyVersion ?? system?.methodologyVersion
                }
              />
            </dl>
          </OperationsPanel>

          <OperationsPanel
            title="Entries"
            description="Canonical athlete links remain separate from provider display names and provider athlete IDs."
          >
            {snapshot.entries.length === 0 ? (
              <p className="text-sm leading-6 text-muted">
                This snapshot has no stored entries.
              </p>
            ) : (
              <ul className="space-y-3">
                {snapshot.entries.map((entry) => (
                  <li
                    key={entry.canonicalId}
                    className="flex flex-col justify-between gap-4 border border-white/12 bg-canvas p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      {entry.athleteId ? (
                        <Link
                          href={`/admin/athletes/${encodeURIComponent(entry.athleteId)}`}
                          className="font-bold text-ink hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
                        >
                          {entry.athleteName ??
                            entry.sourceDisplayName ??
                            entry.athleteId}
                        </Link>
                      ) : (
                        <p className="font-bold text-ink">
                          {entry.sourceDisplayName ?? "Unmatched entry"}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted">
                        Provider ID: {entry.providerAthleteId ?? "Not set"} ·{" "}
                        {adminStatusLabel(entry.status)}
                      </p>
                    </div>
                    <p className="shrink-0 font-display text-2xl font-black text-accent">
                      {rankingValueLabel(entry, system)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </OperationsPanel>

          <OperationsPanel title="Source provenance">
            <dl className="grid gap-x-8 sm:grid-cols-2">
              <DefinitionField
                label="Source title"
                value={snapshot.provenance.title}
              />
              <DefinitionField
                label="Source type"
                value={adminStatusLabel(snapshot.provenance.type)}
              />
              <DefinitionField
                label="External record ID"
                value={snapshot.provenance.externalRecordId}
              />
              <DefinitionField
                label="Verification status"
                value={adminStatusLabel(
                  snapshot.provenance.verificationStatus,
                )}
              />
              <DefinitionField
                label="Published at"
                value={adminDateLabel(snapshot.provenance.publishedAt)}
              />
              <DefinitionField
                label="Checked at"
                value={adminDateLabel(snapshot.provenance.checkedAt)}
              />
            </dl>
            {snapshot.provenance.url ? (
              <a
                href={snapshot.provenance.url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex font-mono text-xs font-bold uppercase tracking-[0.1em] text-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
              >
                View source ↗
              </a>
            ) : (
              <p className="mt-5 text-sm text-muted">Source URL not set.</p>
            )}
          </OperationsPanel>
        </div>
      </div>
    </OperationsPage>
  );
}
