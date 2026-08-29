import Link from "next/link";

import { ContentImage } from "@/components/content/content-image";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { readonly product: Product }) {
  const image = product.images[0];

  return (
    <article className="group flex h-full flex-col border border-white/15 bg-surface">
      <Link
        href={`/shop/${product.slug}`}
        className="relative aspect-[4/3] overflow-hidden border-b border-white/10 bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        {image ? (
          <ContentImage
            image={image}
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
            className="transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="technical-grid absolute inset-0 grid place-items-center px-7 text-center font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/45">
            Product imagery not published
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-accent">
          {categoryLabel(product.category)} / {product.subcategory}
        </p>
        <h2 className="mt-3 font-display text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-ink">
          <Link
            href={`/shop/${product.slug}`}
            className="hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            {product.name}
          </Link>
        </h2>
        <p className="mt-3 text-sm font-bold uppercase tracking-[0.04em] text-ink/75">
          By {product.brand.name}
        </p>
        <p className="mt-4 flex-1 text-sm leading-6 text-muted">
          {product.shortDescription}
        </p>
        <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/10 pt-4">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink">
            {product.price?.display ?? "Price not published"}
          </span>
          <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-accent">
            View record →
          </span>
        </div>
      </div>
    </article>
  );
}

export function categoryLabel(category: Product["category"]): string {
  switch (category) {
    case "equipment":
      return "Equipment";
    case "apparel":
      return "Apparel";
    case "training-content-accessories":
      return "Training & content accessories";
    case "nutrition-recovery":
      return "Nutrition & recovery";
  }
}
