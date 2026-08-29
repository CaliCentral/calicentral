import type { Metadata } from "next";
import Link from "next/link";

import { LibraryItemCard } from "@/components/account/library-item-card";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getCommunityRepository } from "@/lib/community/runtime";
import { resolveCommunityTargets } from "@/lib/community/targets";
import { communitySaveTargetTypeSchema } from "@/lib/community/validation";
import type { CommunitySaveTargetType } from "@/lib/community/types";

export const metadata: Metadata = { title: "Saved library" };

type SavedPageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

const filters: readonly [string, string][] = [
  ["", "All"],
  ["post", "Posts"],
  ["story", "Stories"],
  ["video", "Videos"],
  ["athlete", "Athletes"],
  ["team", "Teams"],
  ["competition", "Competitions"],
  ["product", "Products"],
];

export default async function SavedPage({ searchParams }: SavedPageProps) {
  const [user, params] = await Promise.all([
    requireAuthenticatedUser("/account/saved"),
    searchParams,
  ]);
  const repository = await getCommunityRepository();
  if (!repository.availability.writable) {
    return <LibraryUnavailable title="Saved library" />;
  }
  const member = await repository.getMemberProfileByPrincipalId(user.id);
  if (!member) return <ProfileRequired title="Saved library" />;
  const candidate = first(params.type);
  const targetType = candidate && communitySaveTargetTypeSchema.safeParse(candidate).success
    ? (candidate as CommunitySaveTargetType)
    : undefined;
  const [items, collections] = await Promise.all([
    repository.listSaved(member.id, targetType, 100),
    repository.listCollections(member.id),
  ]);
  const targets = await resolveCommunityTargets(
    items.flatMap((item) =>
      item.targetType === "post"
        ? []
        : [{ type: item.targetType, id: item.targetId }],
    ),
  );
  const returnTo = `/account/saved${targetType ? `?type=${targetType}` : ""}`;

  return (
    <OperationsPage
      eyebrow="Account / Private library"
      title="Saved"
      description="Private bookmarks for community posts and canonical Cali Central records. Saved activity is never shown on your public member profile."
    >
      <nav aria-label="Saved item filters" className="mb-6">
        <ul className="flex flex-wrap gap-2">
          {filters.map(([value, label]) => {
            const active = (targetType ?? "") === value;
            return (
              <li key={value || "all"}>
                <Link
                  href={value ? `/account/saved?type=${value}` : "/account/saved"}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-10 items-center border px-3 font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    active
                      ? "border-accent bg-accent text-canvas"
                      : "border-white/15 text-muted hover:border-accent hover:text-accent"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {items.length ? (
        <div className="space-y-4">
          {items.map((item) => (
            <LibraryItemCard
              key={`${item.targetType}:${item.targetId}`}
              item={item}
              target={targets.get(`${item.targetType}:${item.targetId}`)}
              collections={collections}
              returnTo={returnTo}
            />
          ))}
        </div>
      ) : (
        <OperationsPanel
          title="No saved items"
          description="Use Save on a community post, story, video, athlete, team, competition, or curated product to build this private library."
        >
          <Link href="/community" className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent hover:text-accent-strong">
            Open community →
          </Link>
        </OperationsPanel>
      )}
    </OperationsPage>
  );
}

function LibraryUnavailable({ title }: { readonly title: string }) {
  return (
    <OperationsPage eyebrow="Account / Community unavailable" title={title} description="Community persistence is not configured. No private library state is simulated.">
      <OperationsPanel title="Database unavailable" description="Configure the reviewed D1 binding and enable community features before using this page.">
        <span />
      </OperationsPanel>
    </OperationsPage>
  );
}

function ProfileRequired({ title }: { readonly title: string }) {
  return (
    <OperationsPage eyebrow="Account / Public member profile" title={title} description="A public member profile supplies the stable community identity used for private saves and collections.">
      <OperationsPanel title="Create your member profile" description="Your authenticated email and contributor biography will not be published automatically.">
        <Link href="/account/profile#public-member-profile" className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent">Create public profile →</Link>
      </OperationsPanel>
    </OperationsPage>
  );
}
