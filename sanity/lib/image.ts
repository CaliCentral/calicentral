import "server-only";

import {
  createImageUrlBuilder,
  type SanityImageCrop,
  type SanityImageHotspot,
  type SanityImageSource,
} from "@sanity/image-url";

import { dataset, isSanityConfigured, projectId } from "@/sanity/env";
import type { EditorialImage } from "@/types/content";

type JsonRecord = Record<string, unknown>;

const MAX_CONTENT_IMAGE_WIDTH = 2400;
const DEFAULT_IMAGE_QUALITY = 82;

const imageBuilder = isSanityConfigured
  ? createImageUrlBuilder({ projectId, dataset })
  : null;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function clampFraction(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function imageCrop(value: unknown): SanityImageCrop | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const left = finiteNumber(value.left);
  const right = finiteNumber(value.right);
  const top = finiteNumber(value.top);
  const bottom = finiteNumber(value.bottom);

  if (
    left === undefined ||
    right === undefined ||
    top === undefined ||
    bottom === undefined
  ) {
    return undefined;
  }

  return {
    left: clampFraction(left),
    right: clampFraction(right),
    top: clampFraction(top),
    bottom: clampFraction(bottom),
  };
}

function imageHotspot(value: unknown): SanityImageHotspot | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const x = finiteNumber(value.x);
  const y = finiteNumber(value.y);
  const width = finiteNumber(value.width);
  const height = finiteNumber(value.height);

  if (
    x === undefined ||
    y === undefined ||
    width === undefined ||
    height === undefined
  ) {
    return undefined;
  }

  return {
    x: clampFraction(x),
    y: clampFraction(y),
    width: clampFraction(width),
    height: clampFraction(height),
  };
}

function sourceDimensions(asset: JsonRecord): {
  width: number;
  height: number;
} | null {
  const metadata = isRecord(asset.metadata) ? asset.metadata : {};
  const dimensions = isRecord(metadata.dimensions)
    ? metadata.dimensions
    : {};
  const width =
    finiteNumber(dimensions.width) ?? finiteNumber(asset.width);
  const height =
    finiteNumber(dimensions.height) ?? finiteNumber(asset.height);

  if (width && height && width > 0 && height > 0) {
    return { width, height };
  }

  const assetIdentifier =
    optionalString(asset._id) ?? optionalString(asset._ref);
  const encodedDimensions = assetIdentifier?.match(
    /-(\d+)x(\d+)-[a-z0-9]+$/i,
  );

  if (!encodedDimensions) {
    return null;
  }

  return {
    width: Number(encodedDimensions[1]),
    height: Number(encodedDimensions[2]),
  };
}

function imageSource(
  value: unknown,
): {
  source: SanityImageSource;
  asset: JsonRecord;
  crop?: SanityImageCrop;
} | null {
  if (!isRecord(value) || !isRecord(value.asset)) {
    return null;
  }

  const asset = value.asset;
  const assetReference =
    optionalString(asset._ref) ?? optionalString(asset._id);
  const assetUrl = optionalString(asset.url);

  if (!assetReference && !assetUrl) {
    return null;
  }

  const crop = imageCrop(value.crop);
  const hotspot = imageHotspot(value.hotspot);
  const source: SanityImageSource = {
    asset: assetReference
      ? { _ref: assetReference }
      : { url: assetUrl as string },
    ...(crop ? { crop } : {}),
    ...(hotspot ? { hotspot } : {}),
  };

  return { source, asset, crop };
}

/**
 * Converts a projected Sanity image into the serializable image shape consumed
 * by the application. Crop and hotspot data are applied by Sanity's URL
 * builder, while intrinsic dimensions and LQIP metadata prevent layout shift.
 */
export function normalizeSanityImage(
  value: unknown,
): EditorialImage | undefined {
  const projectedImage = isRecord(value) ? value : {};
  const resolved = imageSource(value);

  if (!resolved || !imageBuilder) {
    return undefined;
  }

  const original = sourceDimensions(resolved.asset);

  if (!original) {
    return undefined;
  }

  const cropWidth =
    original.width *
    Math.max(
      0.01,
      1 - (resolved.crop?.left ?? 0) - (resolved.crop?.right ?? 0),
    );
  const cropHeight =
    original.height *
    Math.max(
      0.01,
      1 - (resolved.crop?.top ?? 0) - (resolved.crop?.bottom ?? 0),
    );
  const width = Math.max(
    1,
    Math.round(Math.min(cropWidth, MAX_CONTENT_IMAGE_WIDTH)),
  );
  const height = Math.max(1, Math.round((cropHeight / cropWidth) * width));
  const decorative = projectedImage.decorative === true;
  const metadata = isRecord(resolved.asset.metadata)
    ? resolved.asset.metadata
    : {};
  const src = imageBuilder
    .image(resolved.source)
    .width(width)
    .quality(DEFAULT_IMAGE_QUALITY)
    .auto("format")
    .url();

  return {
    src,
    width,
    height,
    alt: decorative ? "" : optionalString(projectedImage.alt) ?? "",
    decorative,
    caption: optionalString(projectedImage.caption),
    credit: optionalString(projectedImage.credit),
    blurDataURL:
      optionalString(metadata.lqip) ??
      optionalString(projectedImage.blurDataURL),
  };
}
