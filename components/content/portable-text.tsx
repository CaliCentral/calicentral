import Link from "next/link";
import type { ReactNode } from "react";
import {
  PortableText,
  type PortableTextComponents,
} from "@portabletext/react";

import { ContentImage } from "@/components/content/content-image";
import type { ArticlePortableTextBlock } from "@/types/article";
import type { EditorialImage } from "@/types/content";

type PortableTextContentProps = {
  readonly value: readonly ArticlePortableTextBlock[];
};

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const ENCODED_AMBIGUOUS_PATH_PATTERN =
  /%(?:0[0-9a-f]|1[0-9a-f]|7f|2f|5c)/i;
const INTERNAL_LINK_ORIGIN = "https://internal.cali-central.invalid";

function safeExternalHref(value: unknown) {
  if (
    typeof value !== "string" ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    return undefined;
  }

  try {
    const url = new URL(value.trim());

    if (
      (url.protocol === "https:" || url.protocol === "http:") &&
      !url.username &&
      !url.password
    ) {
      return url.toString();
    }

    if (
      url.protocol === "mailto:" &&
      url.pathname.trim() &&
      !url.hash
    ) {
      return url.toString();
    }
  } catch {
    // Malformed or unsupported links are rendered as plain text.
  }

  return undefined;
}

function safeInternalHref(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    CONTROL_CHARACTER_PATTERN.test(value) ||
    ENCODED_AMBIGUOUS_PATH_PATTERN.test(value)
  ) {
    return undefined;
  }

  try {
    const url = new URL(value, INTERNAL_LINK_ORIGIN);

    return url.origin === INTERNAL_LINK_ORIGIN
      ? `${url.pathname}${url.search}${url.hash}`
      : undefined;
  } catch {
    return undefined;
  }
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function isEditorialImage(value: unknown): value is EditorialImage {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    "src" in value &&
    typeof value.src === "string" &&
    "width" in value &&
    typeof value.width === "number" &&
    "height" in value &&
    typeof value.height === "number" &&
    "alt" in value &&
    typeof value.alt === "string" &&
    "decorative" in value &&
    typeof value.decorative === "boolean"
  );
}

function MissingLink({ children }: { readonly children: ReactNode }) {
  return <span>{children}</span>;
}

const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="text-on-light/86">{children}</p>,
    h2: ({ children }) => (
      <h2 className="scroll-mt-28 pt-7 font-display text-3xl font-black leading-[1.02] tracking-[-0.045em] text-on-light sm:text-4xl">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="scroll-mt-28 pt-3 font-display text-2xl font-extrabold leading-tight tracking-[-0.035em] text-on-light">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-10 border-l-4 border-accent-dark pl-6 text-xl font-bold leading-8 text-on-light">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="space-y-3 pl-6 text-on-light/86 marker:text-accent-dark">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal space-y-3 pl-6 text-on-light/86 marker:font-mono marker:font-bold marker:text-accent-dark">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="list-[square] pl-2">{children}</li>
    ),
    number: ({ children }) => <li className="pl-2">{children}</li>,
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-bold text-on-light">{children}</strong>
    ),
    em: ({ children }) => <em>{children}</em>,
    externalLink: ({ children, value }) => {
      const href = safeExternalHref(value?.href);
      const opensInNewTab =
        value?.blank === true && !href?.startsWith("mailto:");

      return href ? (
        <a
          href={href}
          target={opensInNewTab ? "_blank" : undefined}
          rel={opensInNewTab ? "noopener noreferrer" : undefined}
          className="font-semibold text-accent-dark underline decoration-accent-dark/40 underline-offset-4 transition-colors hover:decoration-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-dark"
        >
          {children}
          {opensInNewTab ? (
            <span className="sr-only"> (opens in a new tab)</span>
          ) : null}
        </a>
      ) : (
        <MissingLink>{children}</MissingLink>
      );
    },
    internalLink: ({ children, value }) => {
      const href = safeInternalHref(value?.href);

      return href ? (
        <Link
          href={href}
          className="font-semibold text-accent-dark underline decoration-accent-dark/40 underline-offset-4 transition-colors hover:decoration-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-dark"
        >
          {children}
        </Link>
      ) : (
        <MissingLink>{children}</MissingLink>
      );
    },
  },
  types: {
    pullQuote: ({ value }) => {
      const quote = getString(value?.quote);
      const attribution = getString(value?.attribution);

      return quote ? (
        <blockquote className="my-12 border-y border-on-light/20 py-8 sm:my-14 sm:py-10">
          <p className="text-balance font-display text-3xl font-black leading-[1.03] tracking-[-0.045em] text-accent-dark sm:text-4xl">
            “{quote}”
          </p>
          {attribution ? (
            <footer className="mt-5 font-mono text-xs font-bold uppercase tracking-[0.13em] text-muted-dark">
              — {attribution}
            </footer>
          ) : null}
        </blockquote>
      ) : null;
    },
    factBox: ({ value }) => {
      const title =
        getString(value?.heading) || getString(value?.title);
      const items = getStringArray(value?.items);

      return (
        <aside className="my-10 border-l-4 border-accent bg-on-light p-6 text-ink sm:p-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Field data
          </p>
          {title ? (
            <p className="mt-3 font-display text-2xl font-black leading-tight tracking-[-0.035em]">
              {title}
            </p>
          ) : null}
          {items.length > 0 ? (
            <ul className="mt-5 divide-y divide-white/12 border-y border-white/12">
              {items.map((item) => (
                <li
                  key={item}
                  className="grid grid-cols-[0.75rem_1fr] gap-3 py-3 text-sm leading-6 text-ink/80"
                >
                  <span aria-hidden="true" className="mt-2 size-1 bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
      );
    },
    divider: ({ value }) => {
      const label = getString(value?.label);

      return (
        <div
          role="separator"
          className="my-12 flex items-center gap-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-dark"
        >
          <span aria-hidden="true" className="h-px flex-1 bg-on-light/20" />
          {label ? <span>{label}</span> : null}
          <span aria-hidden="true" className="h-px w-12 bg-accent" />
        </div>
      );
    },
    editorialImage: ({ value }) => {
      const image = value?.image;

      if (!isEditorialImage(image)) {
        return null;
      }

      return (
        <figure
          className="relative my-10 overflow-hidden bg-on-light/10"
          style={{ aspectRatio: `${image.width} / ${image.height}` }}
        >
          <ContentImage
            image={image}
            sizes="(min-width: 1024px) 48rem, 100vw"
            showDetails
          />
        </figure>
      );
    },
  },
  unknownType: () => null,
  unknownMark: ({ children }) => <span>{children}</span>,
};

export function PortableTextContent({ value }: PortableTextContentProps) {
  return <PortableText value={[...value]} components={portableTextComponents} />;
}
