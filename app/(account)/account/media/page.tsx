import type { Metadata } from "next";
import Link from "next/link";

import { CommunityActionButton } from "@/components/community/community-action-button";
import { ActionForm } from "@/components/operations/action-form";
import { OperationsNotice, OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { requireAuthenticatedUser } from "@/lib/auth";
import {
  removeOwnedCommunityMediaAction,
  uploadCommunityMediaAction,
} from "@/lib/community/actions/media";
import { COMMUNITY_MEDIA_MAX_FILE_LABEL } from "@/lib/community/media";
import { getCommunityMediaRepository } from "@/lib/community/media-runtime";
import { getCommunityRepository } from "@/lib/community/runtime";

export const metadata: Metadata = { title: "Media uploads" };
export const dynamic = "force-dynamic";

export default async function AccountMediaPage() {
  const [user, community, media] = await Promise.all([requireAuthenticatedUser("/account/media"), getCommunityRepository(), getCommunityMediaRepository()]);
  const member = community.availability.writable ? await community.getMemberProfileByPrincipalId(user.id) : null;
  const assets = member && media.available ? await media.listForOwner(member.id) : [];
  return (
    <OperationsPage eyebrow="Account / Community media" title="Media uploads" description="Upload profile and proof media into private object storage. Every upload stays private until a moderator approves it.">
      {!member || !media.available ? <OperationsNotice title="Uploads are fail-closed" tone="warning"><p>Create a public member profile and configure the reviewed D1, R2, feature-flag, and rate-limit bindings before uploads can be accepted.</p></OperationsNotice> : <>
        <OperationsPanel title="Upload media" description={`Allowed in the current staging path: JPEG, PNG, WebP, GIF, MP4, or WebM up to ${COMMUNITY_MEDIA_MAX_FILE_LABEL}. File signatures are checked server-side before private storage.`}>
          <ActionForm action={uploadCommunityMediaAction} submitLabel="Upload for review" pendingLabel="Uploading…">
            <label className="block"><span className="font-mono text-xs font-bold uppercase text-muted">Purpose</span><select name="purpose" className="mt-2 min-h-11 w-full border border-white/15 bg-canvas px-3 text-ink"><option value="profile-avatar">Member avatar</option><option value="profile-cover">Member cover</option><option value="athlete-avatar">Claimed athlete avatar</option><option value="athlete-cover">Claimed athlete cover</option><option value="skill-proof">Skill proof</option><option value="post-image">Post image</option><option value="post-video">Post video</option></select></label>
            <label className="mt-4 block"><span className="font-mono text-xs font-bold uppercase text-muted">File</span><input type="file" name="file" required accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" className="mt-2 min-h-11 w-full border border-white/15 p-3 text-sm text-ink" /></label>
          </ActionForm>
        </OperationsPanel>
        <OperationsPanel className="mt-7" title="Your uploads" description="Rejected files are retained as private audit records; no public URL is issued.">
        {assets.length ? <ul className="divide-y divide-white/10">{assets.map((asset) => <li key={asset.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-semibold text-ink">{asset.originalFilename}</p><p className="mt-1 text-xs uppercase text-muted">{asset.purpose} · {asset.mimeType} · {(asset.byteSize / 1024).toFixed(1)} KB</p><code className="mt-2 block break-all text-xs text-muted">Asset ID: {asset.id}</code></div><div className="flex flex-col items-end gap-2 text-right"><p className="font-mono text-xs uppercase text-accent">{asset.uploadStatus} / {asset.moderationStatus}</p>{asset.moderationStatus === "approved" ? <Link href={`/api/community/media/${asset.id}`} className="inline-flex text-sm text-accent">Open approved media →</Link> : null}{asset.uploadStatus === "uploaded" && asset.moderationStatus !== "removed" ? <CommunityActionButton action={removeOwnedCommunityMediaAction} fields={{ assetId: asset.id }} label="Remove media" pendingLabel="Removing…" confirmMessage="Remove this media from all application delivery? The audit record will be preserved." className="!border-rose-300/35 !text-rose-200 hover:!border-rose-300" /> : null}</div></li>)}</ul> : <p className="border border-dashed border-white/20 p-6 text-sm text-muted">No uploads yet.</p>}
        </OperationsPanel>
      </>}
    </OperationsPage>
  );
}
