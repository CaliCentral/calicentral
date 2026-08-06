import type { ImageLoaderProps } from "next/image";

const SANITY_IMAGE_ORIGIN = "https://cdn.sanity.io";
const SANITY_IMAGE_PATH_PREFIX = "/images/";
const DEFAULT_QUALITY = 82;
const MAX_IMAGE_WIDTH = 8192;

export default function sanityImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps) {
  let imageUrl: URL;

  try {
    imageUrl = new URL(src);
  } catch {
    throw new Error("The Sanity image loader requires an absolute image URL.");
  }

  if (
    imageUrl.origin !== SANITY_IMAGE_ORIGIN ||
    !imageUrl.pathname.startsWith(SANITY_IMAGE_PATH_PREFIX) ||
    imageUrl.username ||
    imageUrl.password
  ) {
    throw new Error("The Sanity image loader rejected an untrusted image URL.");
  }

  const normalizedWidth = Math.min(
    MAX_IMAGE_WIDTH,
    Math.max(1, Math.round(width)),
  );
  const normalizedQuality = Math.min(
    100,
    Math.max(1, Math.round(quality ?? DEFAULT_QUALITY)),
  );

  imageUrl.searchParams.set("w", String(normalizedWidth));
  imageUrl.searchParams.set("q", String(normalizedQuality));
  imageUrl.searchParams.set("fit", "max");
  imageUrl.searchParams.set("auto", "format");

  return imageUrl.toString();
}
