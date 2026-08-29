import { ActionForm } from "@/components/operations/action-form";
import { reportCommunityContentAction } from "@/lib/community/actions/interactions";
import { COMMUNITY_REPORT_REASONS } from "@/lib/community/reporting";

export function ReportForm({
  targetType,
  targetId,
  returnTo,
}: {
  readonly targetType: "member" | "post" | "comment" | "media";
  readonly targetId: string;
  readonly returnTo: string;
}) {
  return (
    <details>
      <summary className="cursor-pointer font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        Report
      </summary>
      <div className="mt-3 border border-white/15 bg-canvas/60 p-4">
        <ActionForm
          action={reportCommunityContentAction}
          submitLabel="Submit report"
          pendingLabel="Submitting…"
          onSuccess="refresh"
          submitClassName="w-full sm:w-auto"
        >
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="block font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white/55">
            Reason
            <select
              name="reason"
              required
              className="mt-2 min-h-12 w-full border border-white/15 bg-surface px-3 text-sm normal-case tracking-normal text-ink focus:border-accent focus:outline-none"
              defaultValue=""
            >
              <option value="" disabled>
                Choose a reason
              </option>
              {COMMUNITY_REPORT_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white/55">
            Details (optional)
            <textarea
              name="details"
              maxLength={2000}
              rows={3}
              className="mt-2 w-full resize-y border border-white/15 bg-surface p-3 text-sm normal-case leading-6 tracking-normal text-ink focus:border-accent focus:outline-none"
            />
          </label>
          <p className="mt-3 text-xs leading-5 text-muted">
            Reports are private. Do not include passwords, addresses, or other
            unnecessary sensitive information.
          </p>
        </ActionForm>
      </div>
    </details>
  );
}
