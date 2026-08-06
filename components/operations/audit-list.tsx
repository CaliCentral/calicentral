import Link from "next/link";

import { OperationsEmptyState } from "@/components/operations/operations-empty-state";
import type { AuditEvent } from "@/lib/operations/types";
import { formatOperationsDate } from "@/lib/presentation/operations";

export function AuditList({
  events,
  compact = false,
}: {
  readonly events: readonly AuditEvent[];
  readonly compact?: boolean;
}) {
  if (!events.length) {
    return (
      <OperationsEmptyState
        title="No audit activity"
        description="Server-authored operational events will appear here after meaningful changes."
      />
    );
  }

  return (
    <ol className="divide-y divide-white/10 border border-white/15 bg-canvas/35">
      {events.map((event) => {
        const href =
          event.targetType === "submission"
            ? `/admin/submissions/${encodeURIComponent(event.targetDocumentId)}`
            : `/admin/contributors/${encodeURIComponent(event.targetDocumentId)}`;

        return (
          <li
            key={event.id}
            className={`grid gap-3 p-4 ${
              compact ? "" : "sm:grid-cols-[minmax(0,1fr)_auto]"
            }`}
          >
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold leading-6 text-ink">
                {event.summary}
              </p>
              <p className="mt-1 break-words font-mono text-[0.66rem] uppercase tracking-[0.09em] text-muted">
                {event.eventType} · {event.actor?.displayName ?? "System actor"} ·{" "}
                {event.actorRole}
              </p>
            </div>
            <div className={compact ? "mt-2" : "sm:text-right"}>
              <time
                dateTime={event.createdAt}
                className="block whitespace-nowrap text-xs text-muted"
              >
                {formatOperationsDate(event.createdAt, true)}
              </time>
              <Link
                href={href}
                className="mt-2 inline-flex min-h-9 items-center font-mono text-[0.66rem] font-bold uppercase tracking-[0.1em] text-accent underline decoration-accent/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Open target
              </Link>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
