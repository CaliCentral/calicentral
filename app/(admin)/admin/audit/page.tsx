import type { Metadata } from "next";

import { AuditList } from "@/components/operations/audit-list";
import { FilterBar } from "@/components/operations/filter-bar";
import { OperationsPage } from "@/components/operations/page-shell";
import { requireAdmin } from "@/lib/auth";
import { getAuditEvents } from "@/lib/operations/submissions";
import {
  AUDIT_EVENT_TYPES,
  type AuditEvent,
} from "@/lib/operations/types";

export const metadata: Metadata = {
  title: "Editorial audit history",
};

type AuditPageProps = {
  readonly searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const [params] = await Promise.all([
    searchParams,
    requireAdmin("/admin/audit"),
  ]);
  const events = await getAuditEvents(250);
  const query = first(params.q).trim().toLowerCase();
  const eventType = first(params.eventType);
  const actor = first(params.actor);
  const targetType = first(params.targetType);
  const sort = first(params.sort) || "newest";
  const actorOptions = [
    ...new Map(
      events.flatMap((event) =>
        event.actor
          ? [
              [
                event.actor.id,
                { value: event.actor.id, label: event.actor.displayName },
              ] as const,
            ]
          : [],
      ),
    ).values(),
  ].sort((a, b) => a.label.localeCompare(b.label));
  const filtered = events
    .filter(
      (event) =>
        (!query ||
          event.summary.toLowerCase().includes(query) ||
          event.eventType.toLowerCase().includes(query)) &&
        (!eventType || event.eventType === eventType) &&
        (!actor || event.actor?.id === actor) &&
        (!targetType || event.targetType === targetType),
    )
    .sort(sortAudit(sort));

  return (
    <OperationsPage
      eyebrow="Administrator / Immutable operations history"
      title="Audit history"
      description="A limited, newest-first view of server-authored identity, submission, workflow, and moderation events. It contains no tokens or complete content snapshots."
    >
      <FilterBar
        search={first(params.q)}
        searchPlaceholder="Event summary or type"
        resetHref="/admin/audit"
        filters={[
          {
            name: "eventType",
            label: "Event",
            value: eventType,
            options: [
              { value: "", label: "All event types" },
              ...AUDIT_EVENT_TYPES.map((value) => ({
                value,
                label: humanize(value),
              })),
            ],
          },
          {
            name: "actor",
            label: "Actor",
            value: actor,
            options: [
              { value: "", label: "All actors" },
              ...actorOptions,
            ],
          },
          {
            name: "targetType",
            label: "Target",
            value: targetType,
            options: [
              { value: "", label: "All targets" },
              { value: "submission", label: "Submission" },
              { value: "contributor", label: "Contributor" },
            ],
          },
          {
            name: "sort",
            label: "Date order",
            value: sort,
            options: [
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
            ],
          },
        ]}
      />
      <p className="mt-6 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted">
        {filtered.length} {filtered.length === 1 ? "event" : "events"} shown ·
        maximum 250 loaded
      </p>
      <div className="mt-3">
        <AuditList events={filtered} />
      </div>
    </OperationsPage>
  );
}

function humanize(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function sortAudit(
  sort: string,
): (a: AuditEvent, b: AuditEvent) => number {
  return sort === "oldest"
    ? (a, b) => a.createdAt.localeCompare(b.createdAt)
    : (a, b) => b.createdAt.localeCompare(a.createdAt);
}
