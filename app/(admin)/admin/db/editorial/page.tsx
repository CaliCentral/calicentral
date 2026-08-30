import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/operations/action-form";
import { FieldShell, SelectInput, TextArea, TextInput } from "@/components/operations/field";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { PendingButton } from "@/components/operations/pending-button";
import { requireEditor } from "@/lib/auth";
import { createEditorialDraftAction } from "@/lib/supabase/admin-actions";
import { SupabaseAdminRepository } from "@/lib/supabase/admin-repository";

export const metadata: Metadata = { title: "Admin — Editorial (Supabase)" };
export const dynamic = "force-dynamic";

const repository = new SupabaseAdminRepository();

const contentTypes = ["story", "video"] as const;

type SearchParams = Record<string, string | string[] | undefined>;
type Props = { readonly searchParams: Promise<SearchParams> };

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function oneOf<const Values extends readonly string[]>(
  value: string,
  values: Values,
): Values[number] | undefined {
  return values.includes(value) ? (value as Values[number]) : undefined;
}

export default async function AdminSupabaseEditorialPage({ searchParams }: Props) {
  await requireEditor("/admin/db/editorial");
  const params = await searchParams;
  const type = oneOf(first(params.type), contentTypes);

  const items = await repository.listEditorialForAdmin(type);

  return (
    <OperationsPage
      eyebrow="Internal / Editorial content"
      title="Editorial"
      description="Stories and videos share one publication workflow through editorial_content. Every publication state is listed here, including drafts and unpublished content excluded from the public site."
      actions={
        <Link
          href="/admin/db"
          className="inline-flex min-h-12 items-center border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Back to Supabase admin
        </Link>
      }
    >
      <OperationsPanel title="Create draft" eyebrow="New editorial content" className="mt-6">
        <ActionForm action={createEditorialDraftAction} submitLabel="Create draft" pendingLabel="Creating…" className="grid gap-4 sm:grid-cols-2">
          <FieldShell id="contentType" label="Content type" required>
            <SelectInput id="contentType" name="contentType" defaultValue="story">
              {contentTypes.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </SelectInput>
          </FieldShell>
          <FieldShell id="slug" label="Slug" required>
            <TextInput id="slug" name="slug" required />
          </FieldShell>
          <FieldShell id="title" label="Title" required>
            <TextInput id="title" name="title" required />
          </FieldShell>
          <div className="sm:col-span-2">
            <FieldShell id="excerpt" label="Excerpt">
              <TextArea id="excerpt" name="excerpt" rows={3} />
            </FieldShell>
          </div>
          <div className="sm:col-span-2">
            <PendingButton pendingLabel="Creating…" className="bg-accent text-canvas hover:bg-accent-strong">
              Create draft
            </PendingButton>
          </div>
        </ActionForm>
      </OperationsPanel>

      <OperationsPanel title={`All editorial content (${items.length})`} className="mt-6">
        <form method="get" className="mb-6 grid gap-3 border border-white/12 bg-canvas p-4 sm:grid-cols-3">
          <label>
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
              Content type
            </span>
            <select
              name="type"
              defaultValue={type ?? ""}
              className="mt-2 min-h-11 w-full border border-white/20 bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="">All</option>
              {contentTypes.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center border border-accent bg-accent px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-canvas"
            >
              Apply filter
            </button>
            <Link
              href="/admin/db/editorial"
              className="inline-flex min-h-11 items-center border border-white/20 px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink hover:border-accent"
            >
              Clear
            </Link>
          </div>
        </form>

        {items.length === 0 ? (
          <p className="text-sm text-muted">No editorial content visible yet (or none exist in this local database).</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {items.map((item) => {
              // Supabase-js infers a nested single-row FK join as an array
              // without generated Database types to tell it otherwise, even
              // with !inner -- editorial_publication_state is a one-to-one
              // "current state" row per editorial_content id (see the
              // provenance panel's source_records handling for the same
              // pattern).
              const state = Array.isArray(item.editorial_publication_state)
                ? item.editorial_publication_state[0]
                : item.editorial_publication_state;
              return (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/admin/db/editorial/${item.id}`} className="font-bold text-ink hover:text-accent">
                      {item.title}
                    </Link>
                    <p className="text-xs text-muted">
                      {item.content_type} &middot; {state?.state ?? "unknown"} &middot; updated {new Date(item.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    href={`/admin/db/editorial/${item.id}`}
                    className="text-xs font-bold uppercase tracking-[0.1em] text-accent hover:underline"
                  >
                    Edit
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </OperationsPanel>
    </OperationsPage>
  );
}
