import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import { requireEditor } from "@/lib/auth";
import { getSanityAdminAthleteDetail } from "@/lib/content/sanity-source";
import {
  adminDateLabel,
  adminStatusLabel,
  rankingDimensionsLabel,
  rankingValueLabel,
} from "@/lib/presentation/admin-rankings";

export const metadata: Metadata = {
  title: "Admin — Athlete",
};

type Props = { params: Promise<{ id: string }> };

function ReviewField({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="border-b border-white/10 py-3 first:pt-0 last:border-b-0 last:pb-0">
      <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-ink">{value}</dd>
    </div>
  );
}

export default async function AdminAthleteDetailPage({ params }: Props) {
  const { id } = await params;
  await requireEditor(`/admin/athletes/${id}`);

  const detail = await getSanityAdminAthleteDetail(id);
  const athlete = detail.athlete;

  if (!athlete) {
    notFound();
  }

  const athleteIdentities = detail.identities;
  const athleteRankings = detail.rankings.flatMap((snapshot) =>
    snapshot.entries.map((entry) => ({ snapshot, entry })),
  );
  const isPublic =
    athlete.verification.profileStatus === "approved" ||
    athlete.prototypeStatus === "fictional-prototype" ||
    athlete.prototypeStatus === "sample-record";

  return (
    <OperationsPage
      eyebrow="Internal / Canonical athlete"
      title={athlete.name}
      description="Editor-only identity, profile-review, external-source, and ranking linkage. These states do not grant one another."
      actions={
        <Link
          href="/admin/athletes"
          className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Back to athletes
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.65fr)_minmax(0,1.35fr)]">
        <div className="space-y-6">
          <OperationsPanel title="Canonical profile state">
            <dl>
              <ReviewField label="Canonical ID" value={athlete.canonicalId} />
              <ReviewField label="Slug" value={athlete.slug ?? "Not set"} />
              <ReviewField
                label="Public profile"
                value={
                  isPublic
                    ? athlete.verification.profileStatus === "approved"
                      ? "Approved for public profile"
                      : "Public prototype / sample marker"
                    : "Internal / not approved"
                }
              />
              <ReviewField
                label="Profile review"
                value={
                  athlete.verification.profileStatus === "not-reviewed"
                    ? "Needs review"
                    : "Approved"
                }
              />
              <ReviewField
                label="Identity"
                value={adminStatusLabel(
                  athlete.verification.identityStatus,
                )}
              />
              <ReviewField
                label="Ranking eligible"
                value={
                  athlete.rankingEligible === undefined
                    ? "Not set"
                    : athlete.rankingEligible
                      ? "Yes"
                      : "No"
                }
              />
              <ReviewField
                label="Prototype marker"
                value={adminStatusLabel(athlete.prototypeStatus)}
              />
            </dl>
          </OperationsPanel>

          <OperationsPanel
            title="External identities"
            description="Provider matching is separate from profile-control and editorial publication review."
          >
            {athleteIdentities.length === 0 ? (
              <p className="text-sm leading-6 text-muted">
                No external athlete identity is linked.
              </p>
            ) : (
              <ul className="space-y-4">
                {athleteIdentities.map((identity) => (
                  <li
                    key={identity.canonicalId}
                    className="border border-white/12 bg-canvas p-4"
                  >
                    <p className="font-bold text-ink">
                      {identity.provider?.name ?? "Provider not linked"}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {identity.providerDisplayName} ·{" "}
                      {identity.providerAthleteId}
                    </p>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-muted">Match</dt>
                        <dd className="text-ink">
                          {adminStatusLabel(identity.matchingStatus)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">Review</dt>
                        <dd className="text-ink">
                          {identity.reviewStatus === "not-reviewed"
                            ? "Needs review"
                            : adminStatusLabel(identity.reviewStatus)}
                        </dd>
                      </div>
                    </dl>
                    {identity.providerAthleteUrl ? (
                      <a
                        href={identity.providerAthleteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex font-mono text-xs font-bold uppercase tracking-[0.1em] text-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
                      >
                        View provider profile ↗
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </OperationsPanel>
        </div>

        <OperationsPanel
          title="Provider-attributed rankings"
          description="Stored snapshots are shown regardless of their public lifecycle status. No position is inferred when a source record is absent."
        >
          {athleteRankings.length === 0 ? (
            <div className="border border-dashed border-white/20 p-5">
              <p className="font-bold text-ink">No ranking snapshot</p>
              <p className="mt-1 text-sm text-muted">Awaiting source</p>
            </div>
          ) : (
            <div className="space-y-5">
              {athleteRankings.map(({ snapshot, entry }) => (
                <article
                  key={`${snapshot.canonicalId}:${entry.canonicalId}`}
                  className="border border-white/15 bg-canvas p-5"
                >
                  <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-accent">
                    {snapshot.system?.provider?.name ?? "Provider not linked"}
                  </p>
                  <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-[-0.025em] text-ink">
                        {snapshot.system?.name ?? snapshot.canonicalId}
                      </h3>
                      <p className="mt-2 text-sm text-muted">
                        {rankingDimensionsLabel(snapshot.system)}
                      </p>
                    </div>
                    <p className="shrink-0 font-display text-3xl font-black text-accent">
                      {rankingValueLabel(entry, snapshot.system)}
                    </p>
                  </div>

                  <dl className="mt-5 grid gap-4 border-y border-white/10 py-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-muted">Ranking snapshot</dt>
                      <dd className="mt-1 text-ink">
                        {adminStatusLabel(snapshot.publicationStatus)} /{" "}
                        {snapshot.publicationStatus === "published"
                          ? "Publication candidate"
                          : "Not public"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Ranking system</dt>
                      <dd className="mt-1 text-ink">
                        {adminStatusLabel(snapshot.system?.status)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Provider</dt>
                      <dd className="mt-1 text-ink">
                        {adminStatusLabel(snapshot.system?.provider?.status)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Source</dt>
                      <dd className="mt-1 text-ink">
                        {adminStatusLabel(
                          snapshot.provenance.verificationStatus,
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                    <span>
                      Ranking date {adminDateLabel(snapshot.rankingDate)}
                    </span>
                    <Link
                      href={`/admin/rankings/${encodeURIComponent(snapshot.canonicalId)}`}
                      className="font-mono font-bold uppercase tracking-[0.1em] text-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
                    >
                      Review snapshot →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </OperationsPanel>
      </div>
    </OperationsPage>
  );
}
