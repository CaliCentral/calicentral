import type { Metadata } from "next";
import Link from "next/link";

import { CommunityActionButton } from "@/components/community/community-action-button";
import { MetricCard } from "@/components/operations/metric-card";
import {
  OperationsNotice,
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import { requireEditor } from "@/lib/auth";
import {
  moderateCommunityContentAction,
  updateCommunityReportAction,
} from "@/lib/community/actions/moderation";
import { getCommunityRepository } from "@/lib/community/runtime";

export const metadata: Metadata = { title: "Trust & Safety" };

const dateTime = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default async function CommunityModerationPage() {
  await requireEditor("/admin/community");
  const repository = await getCommunityRepository();
  if (!repository.availability.writable) {
    return (
      <OperationsPage
        eyebrow="Editorial desk / Trust & Safety"
        title="Trust & Safety"
        description="The private community report queue remains unavailable until the reviewed D1 binding and feature flag are active."
      >
        <OperationsPanel
          title="Database unavailable"
          description="No report count, reporter identity, or moderation state is simulated."
        >
          <span />
        </OperationsPanel>
      </OperationsPage>
    );
  }
  const [reports, auditEvents] = await Promise.all([
    repository.listReports(100),
    repository.listAuditEvents(100),
  ]);
  const submittedCount = reports.filter(
    (report) => report.status === "submitted",
  ).length;
  const inReviewCount = reports.filter(
    (report) => report.status === "in-review",
  ).length;
  const completedCount = reports.filter(
    (report) => report.status === "resolved" || report.status === "dismissed",
  ).length;

  return (
    <OperationsPage
      eyebrow="Editorial desk / Private Trust & Safety"
      title="Trust & Safety"
      description="A bounded private community queue for safety, privacy, rights, fraud, identity, and sporting-data concerns. Reporter identity, report details, and decisions never appear on public community pages."
    >
      <div className="space-y-10">
        <section aria-labelledby="trust-safety-overview">
          <h2 id="trust-safety-overview" className="sr-only">
            Loaded queue overview
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Reports loaded"
              value={reports.length}
              detail="Latest bounded set · maximum 100"
            />
            <MetricCard label="Submitted" value={submittedCount} />
            <MetricCard label="In review" value={inReviewCount} />
            <MetricCard
              label="Resolved or dismissed"
              value={completedCount}
              detail="Within the loaded set"
            />
          </div>
          <div className="mt-5 [&_a]:font-bold [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-3 [&_a]:focus-visible:outline-accent">
            <OperationsNotice title="Queue scope">
              <p>
                This screen handles community member, post, comment, and linked
                media reports. Published editorial or sporting-data changes
                still use the submission and corrections workflow. Review the{" "}
                <Link href="/community-guidelines">Community Guidelines</Link>,{" "}
                <Link href="/copyright">copyright process</Link>, and{" "}
                <Link href="/corrections">corrections process</Link> before
                taking an action outside this queue.
              </p>
            </OperationsNotice>
          </div>
        </section>

        <section aria-labelledby="community-report-queue">
          <h2
            id="community-report-queue"
            className="mb-5 font-display text-2xl font-black uppercase tracking-[-0.035em] text-ink"
          >
            Community report queue
          </h2>
          {reports.length ? (
            <ol className="space-y-4">
              {reports.map((report) => {
                const targetHref =
                  report.targetType === "post" && report.targetPublic === true
                    ? `/community/posts/${report.targetId}`
                    : undefined;
                const pending =
                  report.status === "submitted" ||
                  report.status === "in-review";
                const moderatable = report.targetHidden !== undefined;

                return (
                  <li
                    key={report.id}
                    className="border border-white/15 bg-surface p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-5">
                      <div>
                        <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.13em] text-accent">
                          {report.targetType} report / {report.status}
                        </p>
                        <h3 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.035em] text-ink">
                          {report.reason}
                        </h3>
                        <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-white/45">
                          Reporter @{report.reporter.handle} ·{" "}
                          {dateTime.format(new Date(report.createdAt))}
                        </p>
                      </div>
                      {targetHref ? (
                        <Link
                          href={targetHref}
                          className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
                        >
                          Open public target ↗
                        </Link>
                      ) : null}
                    </div>
                    <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-muted">
                      {report.details || "No optional details supplied."}
                    </p>
                    <p className="mt-3 break-all font-mono text-[0.65rem] uppercase tracking-[0.08em] text-white/35">
                      Target ID: {report.targetId}
                    </p>
                    {pending || moderatable ? (
                      <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-5">
                        {moderatable &&
                        (report.targetType === "post" ||
                          report.targetType === "comment") ? (
                          <CommunityActionButton
                            action={moderateCommunityContentAction}
                            fields={{
                              targetType: report.targetType,
                              targetId: report.targetId,
                              hidden: String(!report.targetHidden),
                            }}
                            label={`${report.targetHidden ? "Restore" : "Hide"} ${report.targetType}`}
                            pendingLabel={
                              report.targetHidden ? "Restoring…" : "Hiding…"
                            }
                            confirmMessage={
                              report.targetHidden
                                ? `Restore this ${report.targetType} to public community views?`
                                : `Hide this ${report.targetType} from public community views?`
                            }
                          />
                        ) : null}
                        {pending ? (
                          <>
                            <CommunityActionButton
                              action={updateCommunityReportAction}
                              fields={{
                                reportId: report.id,
                                status: "resolved",
                              }}
                              label="Resolve report"
                              pendingLabel="Resolving…"
                            />
                            <CommunityActionButton
                              action={updateCommunityReportAction}
                              fields={{
                                reportId: report.id,
                                status: "dismissed",
                              }}
                              label="Dismiss report"
                              pendingLabel="Dismissing…"
                            />
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : (
            <OperationsPanel
              title="No community reports"
              description="The bounded report queue is empty."
            >
              <span />
            </OperationsPanel>
          )}
        </section>

        <OperationsPanel
          title="Recent moderation audit"
          eyebrow="Private operator history"
          description="Privileged community moderation and report decisions only. Routine likes, saves, follows, and posts are not included."
        >
          {auditEvents.length ? (
            <ol className="divide-y divide-white/10">
              {auditEvents.map((event) => (
                <li key={event.id} className="py-4 first:pt-0 last:pb-0">
                  <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-accent">
                    {event.eventType} ·{" "}
                    {dateTime.format(new Date(event.createdAt))}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {event.summary}
                  </p>
                  <p className="mt-1 break-all font-mono text-[0.62rem] uppercase tracking-[0.08em] text-white/35">
                    {event.targetType} / {event.targetId}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm leading-6 text-muted">
              No privileged community actions have been recorded.
            </p>
          )}
        </OperationsPanel>
      </div>
    </OperationsPage>
  );
}
