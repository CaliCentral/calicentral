import { communityIdSchema } from "@/lib/community/validation";

export type CommunityExternalMedia =
  | { readonly kind: "youtube"; readonly url: string; readonly host: string; readonly videoId: string; readonly thumbnailUrl: string }
  | { readonly kind: "link"; readonly url: string; readonly host: string };

// Uploads currently use a Next.js Server Action whose raw request ceiling is
// 1 MiB. Keep the application payload below that boundary with room for the
// multipart envelope. A larger limit requires a separately reviewed streaming
// or direct-to-R2 protocol; it must not be advertised while this path is used.
export const COMMUNITY_MEDIA_MAX_FILE_BYTES = 900 * 1024;
export const COMMUNITY_MEDIA_MAX_FILE_LABEL = "900 KiB";

const ALLOWED_MEDIA = {
  "image/jpeg": { extension: "jpg", maximum: COMMUNITY_MEDIA_MAX_FILE_BYTES },
  "image/png": { extension: "png", maximum: COMMUNITY_MEDIA_MAX_FILE_BYTES },
  "image/webp": { extension: "webp", maximum: COMMUNITY_MEDIA_MAX_FILE_BYTES },
  "image/gif": { extension: "gif", maximum: COMMUNITY_MEDIA_MAX_FILE_BYTES },
  "video/mp4": { extension: "mp4", maximum: COMMUNITY_MEDIA_MAX_FILE_BYTES },
  "video/webm": { extension: "webm", maximum: COMMUNITY_MEDIA_MAX_FILE_BYTES },
} as const;

export type CommunityMediaMimeType = keyof typeof ALLOWED_MEDIA;
export type CommunityMediaPurpose =
  | "profile-avatar" | "profile-cover" | "post-image" | "post-video"
  | "athlete-avatar" | "athlete-cover" | "skill-proof";

const IMAGE_ONLY_PURPOSES: ReadonlySet<CommunityMediaPurpose> = new Set([
  "profile-avatar",
  "profile-cover",
  "post-image",
  "athlete-avatar",
  "athlete-cover",
]);

function youtubeVideoId(url: URL): string | null {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  let candidate: string | null = null;
  if (host === "youtu.be") candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
  if (host === "youtube.com" || host === "m.youtube.com") {
    candidate = url.searchParams.get("v");
    if (!candidate) {
      const [section, id] = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(section ?? "")) candidate = id ?? null;
    }
  }
  return candidate && /^[A-Za-z0-9_-]{6,20}$/.test(candidate) ? candidate : null;
}

export function describeCommunityExternalMedia(value: string): CommunityExternalMedia | null {
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "");
  const videoId = youtubeVideoId(url);
  return videoId
    ? { kind: "youtube", url: url.toString(), host: "youtube.com", videoId, thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` }
    : { kind: "link", url: url.toString(), host };
}

export interface CommunityMediaStore {
  put(key: string, value: ArrayBuffer, options: {
    readonly httpMetadata: { readonly contentType: string };
    readonly customMetadata: Record<string, string>;
  }): Promise<unknown>;
  get(key: string): Promise<CommunityMediaObject | null>;
}

export interface CommunityMediaObject {
  readonly body: ReadableStream;
  readonly httpMetadata?: { readonly contentType?: string };
  readonly size?: number;
}

function hasMediaSignature(type: CommunityMediaMimeType, bytes: Uint8Array): boolean {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10";
  if (type === "image/gif") return new TextDecoder().decode(bytes.slice(0, 6)).match(/^GIF8[79]a$/) !== null;
  if (type === "image/webp") return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (type === "video/mp4") return new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp";
  if (type === "video/webm") return bytes.slice(0, 4).join(",") === "26,69,223,163";
  return false;
}

export function validateCommunityMedia(input: { readonly contentType: string; readonly bytes: ArrayBuffer }): {
  readonly contentType: CommunityMediaMimeType;
  readonly extension: string;
  readonly byteSize: number;
} {
  if (!(input.contentType in ALLOWED_MEDIA)) throw new Error("Unsupported media type.");
  const contentType = input.contentType as CommunityMediaMimeType;
  const rule = ALLOWED_MEDIA[contentType];
  if (input.bytes.byteLength < 12 || input.bytes.byteLength > rule.maximum) throw new Error("Media file size is outside the allowed range.");
  if (!hasMediaSignature(contentType, new Uint8Array(input.bytes, 0, Math.min(16, input.bytes.byteLength)))) throw new Error("Media content does not match its declared type.");
  return { contentType, extension: rule.extension, byteSize: input.bytes.byteLength };
}

export function validateCommunityMediaPurpose(
  purpose: CommunityMediaPurpose,
  contentType: CommunityMediaMimeType,
): void {
  if (IMAGE_ONLY_PURPOSES.has(purpose) && !contentType.startsWith("image/")) {
    throw new Error("This media purpose requires an image file.");
  }
  if (purpose === "post-video" && !contentType.startsWith("video/")) {
    throw new Error("Post video uploads require a video file.");
  }
}

export async function storeCommunityMedia(input: {
  readonly store?: CommunityMediaStore;
  readonly memberId: string;
  readonly purpose: CommunityMediaPurpose;
  readonly contentType: string;
  readonly bytes: ArrayBuffer;
  readonly assetId?: string;
}): Promise<{ readonly storageKey: string; readonly contentType: CommunityMediaMimeType; readonly byteSize: number }> {
  if (!input.store) throw new Error("Community media storage is not configured.");
  const memberId = communityIdSchema.parse(input.memberId);
  const validated = validateCommunityMedia(input);
  validateCommunityMediaPurpose(input.purpose, validated.contentType);
  const assetId = input.assetId ? communityIdSchema.parse(input.assetId) : crypto.randomUUID();
  const storageKey = `members/${encodeURIComponent(memberId)}/${input.purpose}/${assetId}.${validated.extension}`;
  await input.store.put(storageKey, input.bytes, {
    httpMetadata: { contentType: validated.contentType },
    customMetadata: { ownerMemberId: memberId, purpose: input.purpose },
  });
  return { storageKey, contentType: validated.contentType, byteSize: validated.byteSize };
}
