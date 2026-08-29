import type { Metadata } from "next";

import { ShopDirectory } from "@/components/shop/shop-directory";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import { Container } from "@/components/ui/container";
import { getProducts } from "@/lib/content";
import { featureConfig } from "@/lib/features/config";
import { createPublicMetadata } from "@/lib/site/metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return createPublicMetadata({
    path: "/shop",
    title: "Curated calisthenics shop",
    description:
      "Browse Cali Central's curated external product records for calisthenics equipment, apparel, training accessories, nutrition, and recovery.",
    noIndex: !featureConfig.shop,
  });
}

type Props = {
  readonly searchParams: Promise<{
    category?: string | string[];
  }>;
};

export default async function ShopPage({ searchParams }: Props) {
  const [products, params] = await Promise.all([getProducts(), searchParams]);
  const category = Array.isArray(params.category)
    ? params.category[0]
    : params.category;

  return (
    <>
      <header className="technical-grid border-b border-white/10 bg-canvas py-16 sm:py-20 lg:py-24">
        <Container>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
            Shop / Curated external products
          </p>
          <h1 className="mt-5 max-w-5xl text-balance font-display text-6xl font-black uppercase leading-[0.88] tracking-[-0.065em] text-ink sm:text-7xl lg:text-8xl">
            Useful gear. Clear relationships. No checkout theater.
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-7 text-muted sm:text-lg">
            Cali Central publishes editorial product-discovery records and links
            to external manufacturers or retailers. Prices and availability can
            change; checkout never happens on Cali Central.
          </p>
        </Container>
      </header>
      <section
        className="bg-canvas py-16 sm:py-20 lg:py-24"
        aria-labelledby="shop-directory-heading"
      >
        <Container>
          <div className="mb-9 border-t border-white/15 pt-5">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
              Product directory / Published records only
            </p>
            <h2
              id="shop-directory-heading"
              className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.05em] text-ink sm:text-5xl"
            >
              Curated field
            </h2>
          </div>
          {!featureConfig.shop ? (
            <ContentEmptyState
              eyebrow="Shop / Feature unavailable"
              title="The curated shop is not enabled"
              description="Product discovery is behind a server-controlled release flag. No purchase, retailer, or affiliate destination is exposed while it is disabled."
            />
          ) : products.length ? (
            <ShopDirectory products={products} category={category} />
          ) : (
            <ContentEmptyState
              eyebrow="Shop / Awaiting editorial review"
              title="No product records are published"
              description="Cali Central will not invent products, prices, retailer links, ratings, or commercial relationships to fill this directory."
            />
          )}
        </Container>
      </section>
    </>
  );
}
