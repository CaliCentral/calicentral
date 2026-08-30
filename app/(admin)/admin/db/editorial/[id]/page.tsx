import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProvenancePanel } from "@/components/admin-db/provenance-panel";
import { ActionForm } from "@/components/operations/action-form";
import { FieldShell, SelectInput, TextArea, TextInput } from "@/components/operations/field";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { PendingButton } from "@/components/operations/pending-button";
import { requireEditor } from "@/lib/auth";
import {
  transitionEditorialAction,
  updateEditorialCoreAction,
  updateStoryFieldsAction,
  updateVideoFieldsAction,
} from "@/lib/supabase/admin-actions";
import { SupabaseAdminRepository } from "@/lib/supabase/admin-repository";
import { editorialPublicationStates, videoOwnershipStatuses } from "@/lib/supabase/admin-validation";

export const metadata: Metadata = { title: "Admin — Editorial content (Supabase)" };
export const dynamic = "force-dynamic";

const repository = new SupabaseAdminRepository();

type Props = { params: Promise<{ id: string }> };

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default async function AdminSupabaseEditorialDetailPage({ params }: Props) {
  const { id } = await params;
  await requireEditor(`/admin/db/editorial/${id}`);

  const record = await repository.getEditorialForAdmin(id);
  if (!record) notFound();

  const { content, history, story, video } = record;
  const currentState = history.find((entry) => entry.is_current);

  return (
    <OperationsPage
      eyebrow="Internal / Editorial content"
      title={content.title}
      description="Core fields, type-specific fields, and publication state all live on this one editorial_content record. Publishing here is what makes content visible on the public site."
      actions={
        <Link href="/admin/db/editorial" className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent">
          Back to editorial
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <OperationsPanel title="Edit core fields" eyebrow={`Content type: ${content.content_type}`}>
            <ActionForm action={updateEditorialCoreAction} submitLabel="Save changes" pendingLabel="Saving…" className="grid gap-4 sm:grid-cols-2" onSuccess="refresh">
              <input type="hidden" name="id" value={content.id} />
              <FieldShell id="title" label="Title" required>
                <TextInput id="title" name="title" defaultValue={content.title} required />
              </FieldShell>
              <FieldShell id="slug" label="Slug" required>
                <TextInput id="slug" name="slug" defaultValue={content.slug} required />
              </FieldShell>
              <div className="sm:col-span-2">
                <FieldShell id="excerpt" label="Excerpt">
                  <TextArea id="excerpt" name="excerpt" defaultValue={content.excerpt ?? ""} rows={4} />
                </FieldShell>
              </div>
              <div className="sm:col-span-2">
                <PendingButton pendingLabel="Saving…" className="bg-accent text-canvas hover:bg-accent-strong">
                  Save changes
                </PendingButton>
              </div>
            </ActionForm>
          </OperationsPanel>

          {content.content_type === "story" ? (
            <OperationsPanel title="Story fields" eyebrow="Type-specific">
              <ActionForm action={updateStoryFieldsAction} submitLabel="Save story fields" pendingLabel="Saving…" className="grid gap-4 sm:grid-cols-2" onSuccess="refresh">
                <input type="hidden" name="id" value={content.id} />
                <FieldShell id="category" label="Category">
                  <TextInput id="category" name="category" defaultValue={story?.category ?? ""} />
                </FieldShell>
                <FieldShell id="eyebrow" label="Eyebrow">
                  <TextInput id="eyebrow" name="eyebrow" defaultValue={story?.eyebrow ?? ""} />
                </FieldShell>
                <FieldShell id="readTimeMinutes" label="Read time (minutes)">
                  <TextInput id="readTimeMinutes" name="readTimeMinutes" type="number" min={1} defaultValue={story?.read_time_minutes ?? ""} />
                </FieldShell>
                <div className="flex items-center gap-2 pt-7">
                  <input id="featured" name="featured" type="checkbox" defaultChecked={Boolean(story?.featured)} className="h-5 w-5 border border-white/20 bg-canvas" />
                  <label htmlFor="featured" className="text-sm font-bold uppercase tracking-[0.08em] text-ink">
                    Featured
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <PendingButton pendingLabel="Saving…" className="bg-accent text-canvas hover:bg-accent-strong">
                    Save story fields
                  </PendingButton>
                </div>
              </ActionForm>
            </OperationsPanel>
          ) : null}

          {content.content_type === "video" ? (
            <OperationsPanel title="Video fields" eyebrow="Type-specific">
              <ActionForm action={updateVideoFieldsAction} submitLabel="Save video fields" pendingLabel="Saving…" className="grid gap-4 sm:grid-cols-2" onSuccess="refresh">
                <input type="hidden" name="id" value={content.id} />
                <FieldShell id="ownershipStatus" label="Ownership status" required>
                  <SelectInput id="ownershipStatus" name="ownershipStatus" defaultValue={video?.ownership_status ?? ""}>
                    {videoOwnershipStatuses.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </SelectInput>
                </FieldShell>
                <FieldShell id="sourcePlatform" label="Source platform">
                  <TextInput id="sourcePlatform" name="sourcePlatform" defaultValue={video?.source_platform ?? ""} />
                </FieldShell>
                <FieldShell id="sourceAccount" label="Source account">
                  <TextInput id="sourceAccount" name="sourceAccount" defaultValue={video?.source_account ?? ""} />
                </FieldShell>
                <FieldShell id="durationSeconds" label="Duration (seconds)">
                  <TextInput id="durationSeconds" name="durationSeconds" type="number" min={1} defaultValue={video?.duration_seconds ?? ""} />
                </FieldShell>
                <div className="sm:col-span-2">
                  <FieldShell id="originalPostUrl" label="Original post URL">
                    <TextInput id="originalPostUrl" name="originalPostUrl" defaultValue={video?.original_post_url ?? ""} />
                  </FieldShell>
                </div>
                <div className="sm:col-span-2">
                  <PendingButton pendingLabel="Saving…" className="bg-accent text-canvas hover:bg-accent-strong">
                    Save video fields
                  </PendingButton>
                </div>
              </ActionForm>
            </OperationsPanel>
          ) : null}

          <OperationsPanel title="Publication state" eyebrow={`Current: ${currentState?.state ?? "unknown"}`} description="Transitions run through the transition_editorial_publication database function -- this is the only control that changes what the public site can see.">
            <ActionForm action={transitionEditorialAction} submitLabel="Transition state" pendingLabel="Transitioning…" className="grid gap-4 sm:grid-cols-2" onSuccess="refresh">
              <input type="hidden" name="id" value={content.id} />
              <FieldShell id="state" label="New state" required>
                <SelectInput id="state" name="state" defaultValue={currentState?.state ?? "draft"}>
                  {editorialPublicationStates.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </SelectInput>
              </FieldShell>
              <FieldShell id="reason" label="Reason" description="Optional. Recorded on the publication-state history entry.">
                <TextInput id="reason" name="reason" />
              </FieldShell>
              <div className="sm:col-span-2">
                <PendingButton pendingLabel="Transitioning…" className="bg-accent text-canvas hover:bg-accent-strong">
                  Transition state
                </PendingButton>
              </div>
            </ActionForm>

            <div className="mt-6 border-t border-white/10 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-ink">History</h3>
              {history.length === 0 ? (
                <p className="mt-2 text-sm text-muted">No publication-state history recorded yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {history.map((entry) => (
                    <li key={entry.id} className="border border-white/10 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-accent">
                          {entry.state}
                          {entry.is_current ? " (current)" : ""}
                        </span>
                        <span className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
                          {formatDate(entry.changed_at)}
                        </span>
                      </div>
                      {entry.reason ? <p className="mt-1 text-xs text-muted">{entry.reason}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </OperationsPanel>
        </div>

        <div className="space-y-6">
          <ProvenancePanel targetType="editorial_content" targetId={content.id} />
        </div>
      </div>
    </OperationsPage>
  );
}
