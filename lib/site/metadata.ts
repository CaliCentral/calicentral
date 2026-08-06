import type { Metadata } from "next";

import {
  absoluteSiteUrl,
  isPublicIndexingEnabled,
} from "@/lib/site/config";

export const siteName = "Cali Central";

export const defaultSocialImage = {
  src: "/social/cali-central-og.png",
  width: 1200,
  height: 630,
  alt: "Cali Central — independent calisthenics media",
} as const;

type SocialImageInput = {
  readonly src: string;
  readonly width?: number;
  readonly height?: number;
  readonly alt?: string;
};

type PublicMetadataInput = {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly socialTitle?: string;
  readonly socialImage?: SocialImageInput;
  readonly noIndex?: boolean;
  readonly absoluteTitle?: boolean;
};

function boundedText(value: string, maximumLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maximumLength) {
    return normalized;
  }

  const candidate = normalized.slice(0, maximumLength + 1);
  const wordBoundary = candidate.lastIndexOf(" ");
  const end = wordBoundary >= maximumLength * 0.7
    ? wordBoundary
    : maximumLength;

  return `${candidate.slice(0, end).trimEnd()}…`;
}

function safeImageUrl(value: string): string | null {
  try {
    const url = value.startsWith("/")
      ? new URL(absoluteSiteUrl(value))
      : new URL(value);

    if (
      (url.protocol === "https:" || url.protocol === "http:") &&
      !url.username &&
      !url.password
    ) {
      return url.toString();
    }
  } catch {
    // The durable local image below is used for malformed CMS metadata.
  }

  return null;
}

export function resolveSocialImage(
  image?: SocialImageInput,
  fallbackAlt: string = defaultSocialImage.alt,
) {
  const source = image?.src
    ? safeImageUrl(image.src)
    : null;

  return {
    url: source ?? absoluteSiteUrl(defaultSocialImage.src),
    width:
      image?.width && image.width > 0
        ? image.width
        : defaultSocialImage.width,
    height:
      image?.height && image.height > 0
        ? image.height
        : defaultSocialImage.height,
    alt: boundedText(image?.alt?.trim() || fallbackAlt, 180),
  };
}

export function publicRobotsMetadata(
  noIndex = false,
): Metadata["robots"] {
  if (!isPublicIndexingEnabled || noIndex) {
    return {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    };
  }

  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

export function createPublicMetadata({
  path,
  title,
  description,
  socialTitle = title,
  socialImage,
  noIndex = false,
  absoluteTitle = false,
}: PublicMetadataInput): Metadata {
  const canonical = absoluteSiteUrl(path);
  const normalizedDescription = boundedText(description, 180);
  const image = resolveSocialImage(
    socialImage,
    socialTitle.includes(siteName)
      ? socialTitle
      : `${socialTitle} — ${siteName}`,
  );

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: normalizedDescription,
    alternates: {
      canonical,
    },
    ...(noIndex
      ? { robots: publicRobotsMetadata(true) }
      : {}),
    openGraph: {
      type: "website",
      url: canonical,
      title: socialTitle,
      description: normalizedDescription,
      siteName,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: normalizedDescription,
      images: [
        {
          url: image.url,
          alt: image.alt,
        },
      ],
    },
  };
}
