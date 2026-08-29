import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentImage } from "@/components/content/content-image";
import { ContentCommunityActions } from "@/components/community/content-discussion";
import { Container } from "@/components/ui/container";
import { getOrganizationPage } from "@/lib/content";
import { isPublicSlug } from "@/lib/content/public-slug";
import {
  createPublicMetadata,
  publicRobotsMetadata,
} from "@/lib/site/metadata";

type Props = { readonly params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const organization = await getOrganizationPage(slug, { stega: false });
  if (!organization || !isPublicSlug(organization.slug)) {
    return {
      title: "Organization not found",
      robots: publicRobotsMetadata(true),
    };
  }

  const image = organization.seo?.image ?? organization.logo;
  return createPublicMetadata({
    path: `/organizations/${organization.slug}`,
    title: organization.seo?.title ?? `${organization.name} — Organization profile`,
    description: organization.seo?.description ?? organization.description,
    socialImage: image
      ? {
          src: image.src,
          width: image.width,
          height: image.height,
          alt: image.alt,
        }
      : undefined,
    noIndex: organization.seo?.noIndex,
  });
}

export default async function OrganizationPage({ params }: Props) {
  const { slug } = await params;
  const organization = await getOrganizationPage(slug);
  if (!organization || !isPublicSlug(organization.slug)) notFound();

  const location = [
    organization.city,
    organization.administrativeArea,
    organization.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <article>
      <header className="technical-grid border-b border-white/10 bg-canvas py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[12rem_minmax(0,1fr)] lg:items-start">
            <div className="relative aspect-square overflow-hidden border border-white/20 bg-surface">
              {organization.logo ? (
                <ContentImage
                  image={organization.logo}
                  sizes="12rem"
                  priority
                  className="p-5"
                />
              ) : (
                <div className="technical-grid absolute inset-0 grid place-items-center font-display text-5xl font-black uppercase text-accent">
                  {organization.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("")}
                </div>
              )}
            </div>
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
                Organization file / {organization.organizationType.replaceAll("-", " ")}
              </p>
              <h1 className="mt-4 max-w-5xl text-balance font-display text-6xl font-black uppercase leading-[0.88] tracking-[-0.065em] text-ink sm:text-7xl lg:text-8xl">
                {organization.name}
              </h1>
              {location ? (
                <p className="mt-6 text-sm font-bold uppercase tracking-[0.04em] text-ink">
                  {location}
                </p>
              ) : null}
              <p className="mt-6 max-w-3xl text-base leading-7 text-muted sm:text-lg">
                {organization.description}
              </p>
              {organization.prototypeStatus ? (
                <p className="mt-6 font-mono text-xs font-bold uppercase tracking-[0.11em] text-muted">
                  Fictional prototype record / Not a real organization
                </p>
              ) : null}
            </div>
          </div>
        </Container>
      </header>

      <ContentCommunityActions
        targetType="organization"
        targetId={organization.canonicalId}
        title={organization.name}
        returnTo={`/organizations/${organization.slug}`}
        followType="organization"
      />

      <section
        className="bg-surface-2 py-16 sm:py-20"
        aria-labelledby="organization-record-heading"
      >
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
                Identity / Public record
              </p>
              <h2
                id="organization-record-heading"
                className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.05em] text-ink"
              >
                Organization record
              </h2>
              <dl className="mt-7 divide-y divide-white/10 border-y border-white/10">
                <Value
                  label="Type"
                  value={organization.organizationType.replaceAll("-", " ")}
                />
                <Value label="Lifecycle" value={organization.lifecycleStatus} />
                <Value
                  label="Scope"
                  value={organization.geographicScope || "Not published"}
                />
                <Value label="Base" value={location || "Not published"} />
              </dl>
            </div>
            <div>
              <h2 className="font-display text-4xl font-black uppercase tracking-[-0.05em] text-ink">
                Public links and disciplines
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
                Links are canonical public destinations supplied with the
                organization record. Publication does not imply partnership or
                endorsement by Cali Central.
              </p>
              {organization.disciplines.length ? (
                <ul className="mt-7 flex flex-wrap gap-2" aria-label="Disciplines">
                  {organization.disciplines.map((discipline) => (
                    <li
                      key={discipline}
                      className="border border-white/15 px-3 py-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-ink"
                    >
                      {discipline}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-7 text-sm text-muted">No disciplines published.</p>
              )}
              {organization.website || organization.socialLinks.length ? (
                <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
                  {organization.website ? (
                    <li>
                      <ExternalLink label="Official website" url={organization.website} />
                    </li>
                  ) : null}
                  {organization.socialLinks.map((link) => (
                    <li key={`${link.label}:${link.url}`}>
                      <ExternalLink label={link.label} url={link.url} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-8 border border-white/15 p-5 text-sm leading-6 text-muted">
                  No public website or social destination is published for this
                  record.
                </p>
              )}
            </div>
          </div>
          <Link
            href="/"
            className="mt-12 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            ← Cali Central home
          </Link>
        </Container>
      </section>
    </article>
  );
}

function Value({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-4 py-4">
      <dt className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted">
        {label}
      </dt>
      <dd className="text-sm font-bold capitalize text-ink">{value}</dd>
    </div>
  );
}

function ExternalLink({ label, url }: { readonly label: string; readonly url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-12 items-center justify-between gap-4 py-3 font-bold text-ink hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      {label}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
