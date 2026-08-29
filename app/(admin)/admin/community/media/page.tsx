import type { Metadata } from "next";

import { CommunityActionButton } from "@/components/community/community-action-button";
import { ActionForm } from "@/components/operations/action-form";
import { OperationsNotice, OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { requireEditor } from "@/lib/auth";
import {
  moderateCommunityMediaAction,
  removeCommunityMediaAsModeratorAction,
} from "@/lib/community/actions/media";
import { getCommunityMediaRepository } from "@/lib/community/media-runtime";

export const metadata: Metadata = { title: "Media moderation" };
export const dynamic = "force-dynamic";

export default async function MediaModerationPage() {
  await requireEditor("/admin/community/media");
  const repository = await getCommunityMediaRepository();
  const assets = repository.available ? await repository.listForModeration() : [];
  return <OperationsPage eyebrow="Admin / Trust & Safety" title="Media moderation" description="Review private R2 uploads before any public delivery. Decisions are append-only audited.">
    {!repository.available ? <OperationsNotice title="Media bindings are not configured" tone="warning"><p>The moderation route is installed but cannot access D1 or R2 in this environment.</p></OperationsNotice> : <OperationsPanel title="Review and removal" description="Approval makes an asset public through the guarded application route; rejection keeps it private. Authorized removal revokes every application delivery path while preserving audit history.">
      {assets.length ? <ul className="space-y-4">{assets.map((asset) => <li key={asset.id} className="border border-white/15 p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold text-ink">{asset.originalFilename}</p><p className="mt-1 text-xs uppercase text-muted">{asset.purpose} · {asset.mimeType} · {(asset.byteSize / 1024).toFixed(1)} KB · {asset.moderationStatus}</p></div><a href={`/api/community/media/${asset.id}`} target="_blank" rel="noopener noreferrer" className="text-sm text-accent">Private reviewer preview ↗</a></div>{asset.moderationStatus === "pending" ? <><ActionForm action={moderateCommunityMediaAction} submitLabel="Approve" intent="approved" className="mt-4"><input type="hidden" name="assetId" value={asset.id} /><input type="hidden" name="decision" value="approved" /><label className="block text-xs uppercase text-muted">Review note<input name="note" maxLength={500} className="mt-2 min-h-11 w-full border border-white/15 bg-canvas px-3 text-ink" /></label></ActionForm><ActionForm action={moderateCommunityMediaAction} submitLabel="Reject" intent="rejected" className="mt-2"><input type="hidden" name="assetId" value={asset.id} /><input type="hidden" name="decision" value="rejected" /></ActionForm></> : null}<div className="mt-4"><CommunityActionButton action={removeCommunityMediaAsModeratorAction} fields={{ assetId: asset.id }} label="Remove media" pendingLabel="Removing…" confirmMessage="Remove this media from every application delivery path? Existing moderation and audit history will be preserved." className="!border-rose-300/35 !text-rose-200 hover:!border-rose-300" /></div></li>)}</ul> : <p className="border border-dashed border-white/20 p-6 text-sm text-muted">No uploaded media is available for review or removal.</p>}
    </OperationsPanel>}
  </OperationsPage>;
}
