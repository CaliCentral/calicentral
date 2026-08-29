import Link from "next/link";

import { Container } from "@/components/ui/container";
import { getCommunityRepository } from "@/lib/community/runtime";

export async function CommunityPreviewSection() {
  const repository = await getCommunityRepository();
  if (!repository.availability.writable) return null;

  const page = await (async () => {
    try {
      return await repository.listPosts({ limit: 3 });
    } catch {
      return null;
    }
  })();
  if (!page?.items.length) return null;

  return (
      <section className="border-t border-white/10 bg-surface-2 py-14 sm:py-18">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
                From the community
              </p>
              <h2 className="mt-3 font-display text-4xl font-black uppercase tracking-[-0.05em] text-ink sm:text-5xl">
                Field signals
              </h2>
            </div>
            <Link
              href="/community"
              className="inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
            >
              Open field feed →
            </Link>
          </div>
          <ul className="mt-8 grid gap-4 lg:grid-cols-3">
            {page.items.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/community/posts/${post.id}`}
                  className="block h-full border border-white/15 bg-surface p-5 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-accent">
                    @{post.author.handle}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-black uppercase tracking-[-0.03em] text-ink">
                    {post.author.displayName}
                  </h3>
                  <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-muted">
                    {post.body || "Shared a Cali Central record with the community."}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
  );
}
