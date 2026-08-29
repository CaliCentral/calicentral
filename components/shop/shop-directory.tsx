import Link from "next/link";

import { ProductCard, categoryLabel } from "@/components/shop/product-card";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import {
  PRODUCT_CATEGORIES,
  type Product,
  type ProductCategory,
} from "@/types/product";

export function ShopDirectory({
  products,
  category,
}: {
  readonly products: readonly Product[];
  readonly category?: string;
}) {
  const selectedCategory = PRODUCT_CATEGORIES.includes(category as ProductCategory)
    ? (category as ProductCategory)
    : undefined;
  const filtered = selectedCategory
    ? products.filter((product) => product.category === selectedCategory)
    : products;

  return (
    <>
      <form
        method="get"
        className="grid gap-4 border border-white/15 bg-surface p-5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end"
      >
        <label className="grid gap-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted">
          Category
          <select
            name="category"
            defaultValue={selectedCategory ?? ""}
            className="min-h-12 border border-white/20 bg-canvas px-3 text-sm normal-case tracking-normal text-ink outline-none focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <option value="">All categories</option>
            {PRODUCT_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {categoryLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="min-h-12 bg-accent px-5 text-xs font-bold uppercase tracking-[0.12em] text-canvas hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Apply filter
        </button>
        <Link
          href="/shop"
          className="inline-flex min-h-12 items-center justify-center border border-white/20 px-5 text-xs font-bold uppercase tracking-[0.12em] text-ink hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Clear
        </Link>
      </form>
      <p
        aria-live="polite"
        className="mt-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted"
      >
        {filtered.length} curated {filtered.length === 1 ? "record" : "records"}
      </p>
      {filtered.length ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.canonicalId} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <ContentEmptyState
            eyebrow="Shop directory / No matching records"
            title="No products match this filter"
            description="Choose another category or clear the current filter. Cali Central does not create placeholder products to fill a category."
          />
        </div>
      )}
    </>
  );
}
