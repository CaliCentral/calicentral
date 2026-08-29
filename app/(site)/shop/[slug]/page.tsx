import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentImage } from "@/components/content/content-image";
import { ProductSaveControl } from "@/components/shop/product-save-control";
import { categoryLabel } from "@/components/shop/product-card";
import { Container } from "@/components/ui/container";
import { getProductPage } from "@/lib/content";
import { isPublicSlug } from "@/lib/content/public-slug";
import {
  createPublicMetadata,
  publicRobotsMetadata,
} from "@/lib/site/metadata";
import { resolveProductDestination } from "@/types/product";

type Props = { readonly params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductPage(slug, { stega: false });
  if (!product || !isPublicSlug(product.slug)) {
    return {
      title: "Product not found",
      robots: publicRobotsMetadata(true),
    };
  }

  const image = product.seo?.image ?? product.images[0];
  return createPublicMetadata({
    path: `/shop/${product.slug}`,
    title: product.seo?.title ?? `${product.name} — Curated product`,
    description: product.seo?.description ?? product.shortDescription,
    socialImage: image
      ? {
          src: image.src,
          width: image.width,
          height: image.height,
          alt: image.alt,
        }
      : undefined,
    noIndex: product.seo?.noIndex,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductPage(slug);
  if (!product || !isPublicSlug(product.slug)) notFound();

  const image = product.images[0];
  const destination = resolveProductDestination(product);
  const returnTo = `/shop/${product.slug}`;
  const paidDestination =
    destination?.kind === "affiliate" ||
    ["sponsored", "advertising"].includes(product.commercialRelationship);

  return (
    <article>
      <header className="technical-grid border-b border-white/10 bg-canvas py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
            <div className="relative aspect-[4/3] overflow-hidden border border-white/20 bg-surface">
              {image ? (
                <ContentImage
                  image={image}
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  priority
                  showDetails
                />
              ) : (
                <div className="technical-grid absolute inset-0 grid place-items-center p-8 text-center font-mono text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                  Product imagery not published
                </div>
              )}
            </div>
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
                Shop / {categoryLabel(product.category)} / {product.subcategory}
              </p>
              <h1 className="mt-4 text-balance font-display text-6xl font-black uppercase leading-[0.88] tracking-[-0.065em] text-ink sm:text-7xl">
                {product.name}
              </h1>
              <p className="mt-5 text-sm font-bold uppercase tracking-[0.04em] text-ink">
                By{" "}
                <Link
                  href={`/organizations/${product.brand.slug}`}
                  className="underline decoration-white/35 underline-offset-4 hover:text-accent"
                >
                  {product.brand.name}
                </Link>
              </p>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                {product.shortDescription}
              </p>
              {product.prototypeStatus ? (
                <p className="mt-5 font-mono text-xs font-bold uppercase tracking-[0.11em] text-muted">
                  Fictional prototype product / Not a real commercial offer
                </p>
              ) : null}
              {product.disclosure && product.commercialRelationship !== "none" ? (
                <div className="mt-6 border border-accent/45 bg-accent/10 p-4">
                  <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.13em] text-accent">
                    Commercial disclosure
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink">
                    {product.disclosure}
                  </p>
                </div>
              ) : null}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {destination ? (
                  <a
                    href={destination.url}
                    target="_blank"
                    rel={
                      paidDestination
                        ? "sponsored noopener noreferrer"
                        : "noopener noreferrer"
                    }
                    className="clip-corner inline-flex min-h-12 items-center bg-accent px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-canvas hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    {destination.label} ↗
                  </a>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex min-h-12 items-center border border-white/10 px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white/40"
                  >
                    No retailer link published
                  </span>
                )}
                <ProductSaveControl
                  productId={product.canonicalId}
                  returnTo={returnTo}
                />
              </div>
              <p className="mt-4 max-w-2xl text-xs leading-5 text-muted">
                External destinations are operated by third parties. Cali Central
                does not process payment, guarantee price, or confirm live stock.
              </p>
            </div>
          </div>
        </Container>
      </header>

      <section
        className="bg-surface-2 py-16 sm:py-20"
        aria-labelledby="product-fit-heading"
      >
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
                Editorial context / No rating
              </p>
              <h2
                id="product-fit-heading"
                className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.05em] text-ink"
              >
                Why it is listed
              </h2>
              <p className="mt-6 max-w-3xl text-base leading-7 text-muted">
                {product.editorialSummary}
              </p>
              <div className="mt-8 grid gap-7 sm:grid-cols-2">
                <TagList label="Use cases" values={product.useCases} />
                <TagList label="Disciplines" values={product.disciplines} />
                <TagList label="Training level" values={product.trainingLevel} />
                <TagList
                  label="Environment"
                  values={product.environments.map((value) =>
                    value === "indoor" ? "Indoor" : "Outdoor",
                  )}
                />
              </div>
            </div>
            <div>
              <h2 className="font-display text-4xl font-black uppercase tracking-[-0.05em] text-ink">
                Commerce record
              </h2>
              <dl className="mt-7 divide-y divide-white/10 border-y border-white/10">
                <Value label="Price" value={product.price?.display ?? "Not published"} />
                <Value
                  label="Price checked"
                  value={product.price?.checkedAt ?? "Not applicable"}
                />
                <Value
                  label="Portable"
                  value={product.portable ? "Yes" : "Not marked portable"}
                />
                <Value
                  label="Retailer"
                  value={product.retailer?.name ?? "Not published"}
                />
                <Value
                  label="Countries"
                  value={
                    product.countryAvailability.length
                      ? product.countryAvailability.join(", ")
                      : "Not published"
                  }
                />
                <Value
                  label="Relationship"
                  value={product.commercialRelationship}
                />
                <Value
                  label="Last checked"
                  value={product.lastCheckedAt ?? "Not published"}
                />
              </dl>
              <p className="mt-6 border border-white/15 p-5 text-sm leading-6 text-muted">
                {product.availabilityNote ||
                  "No product availability statement is published."}
              </p>
            </div>
          </div>
          <Link
            href="/shop"
            className="mt-12 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            ← Return to curated shop
          </Link>
        </Container>
      </section>
    </article>
  );
}

function TagList({ label, values }: { readonly label: string; readonly values: readonly string[] }) {
  return (
    <div>
      <h3 className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.13em] text-muted">
        {label}
      </h3>
      {values.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <li
              key={value}
              className="border border-white/15 px-3 py-2 text-xs font-bold text-ink"
            >
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">Not published</p>
      )}
    </div>
  );
}

function Value({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-4 py-4">
      <dt className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted">
        {label}
      </dt>
      <dd className="break-words text-sm font-bold capitalize text-ink">{value}</dd>
    </div>
  );
}
