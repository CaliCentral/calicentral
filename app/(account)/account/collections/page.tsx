import type { Metadata } from "next";
import Link from "next/link";

import { CollectionForm } from "@/components/account/collection-form";
import { OperationsPage, OperationsPanel } from "@/components/operations/page-shell";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getCommunityRepository } from "@/lib/community/runtime";

export const metadata: Metadata = { title: "Collections" };

const date = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export default async function CollectionsPage() {
  const user = await requireAuthenticatedUser("/account/collections");
  const repository = await getCommunityRepository();
  if (!repository.availability.writable) {
    return (
      <OperationsPage eyebrow="Account / Community unavailable" title="Collections" description="Community persistence is not configured. No collection state is simulated.">
        <OperationsPanel title="Database unavailable" description="Configure the reviewed D1 binding and enable community features before using collections.">
          <span />
        </OperationsPanel>
      </OperationsPage>
    );
  }
  const member = await repository.getMemberProfileByPrincipalId(user.id);
  if (!member) {
    return (
      <OperationsPage eyebrow="Account / Public member profile" title="Collections" description="Create a public member identity before organizing your private library.">
        <OperationsPanel title="Create your member profile" description="Private account and contributor information will not be published automatically.">
          <Link href="/account/profile#public-member-profile" className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent">Create public profile →</Link>
        </OperationsPanel>
      </OperationsPage>
    );
  }
  const collections = await repository.listCollections(member.id);

  return (
    <OperationsPage
      eyebrow="Account / Private library"
      title="Collections"
      description="Organize saved posts, stories, videos, athletes, teams, and competitions into private folders."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.42fr)] xl:items-start">
        <div>
          {collections.length ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {collections.map((collection) => (
                <li key={collection.id}>
                  <Link
                    href={`/account/collections/${collection.id}`}
                    className="block h-full border border-white/15 bg-surface p-6 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.13em] text-accent">
                      Private collection / {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                    </p>
                    <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-[-0.035em] text-ink">
                      {collection.name}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
                      {collection.description || "No description."}
                    </p>
                    <p className="mt-5 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-white/40">
                      Updated {date.format(new Date(collection.updatedAt))}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <OperationsPanel title="No collections" description="Create your first private collection, then add any item already in Saved.">
              <span />
            </OperationsPanel>
          )}
        </div>
        <OperationsPanel title="New collection" description="Collection names and contents are private by default.">
          <CollectionForm />
        </OperationsPanel>
      </div>
    </OperationsPage>
  );
}
