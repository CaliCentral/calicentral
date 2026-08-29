import Image from "next/image";

import { describeCommunityExternalMedia } from "@/lib/community/media";
import type { CommunityMediaKind } from "@/lib/community/types";

export function CommunityMediaPreview({
  url,
  credit,
  kind,
  altText,
}: {
  readonly url: string;
  readonly credit?: string;
  readonly kind?: CommunityMediaKind;
  readonly altText?: string;
}) {
  if (url.startsWith("/api/community/media/")) {
    return <figure className="mt-5 overflow-hidden border border-white/15 bg-canvas/60">
      {kind === "image" ? <div className="relative aspect-[4/3] bg-black"><Image src={url} alt={altText || "Member-uploaded community photo"} fill sizes="(max-width: 768px) 100vw, 768px" unoptimized className="object-cover" /></div> : kind === "video" ? <video src={url} controls preload="metadata" className="aspect-video w-full bg-black" aria-label={altText || "Member-uploaded community video"} /> : null}
      <figcaption className="p-4 text-xs leading-5 text-muted">Approved member upload{credit ? ` · Credit: ${credit}` : " · Member-owned declaration"}</figcaption>
    </figure>;
  }
  const media = describeCommunityExternalMedia(url);
  if (!media) {
    return (
      <div className="mt-5 border border-dashed border-white/20 bg-canvas/45 p-5 text-sm text-muted">
        This external media reference is unavailable.
      </div>
    );
  }

  return (
    <a
      href={media.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-5 block overflow-hidden border border-white/15 bg-canvas/60 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      {kind === "image" && new URL(media.url).protocol === "https:" ? (
        <div className="relative aspect-[4/3] border-b border-white/12 bg-black">
          <Image
            src={media.url}
            alt={altText || "Externally hosted community photo"}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            unoptimized
            referrerPolicy="no-referrer"
            className="object-cover"
          />
        </div>
      ) : media.kind === "youtube" ? (
        <div className="relative aspect-video border-b border-white/12 bg-black">
          <Image
            src={media.thumbnailUrl}
            alt="YouTube video thumbnail"
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            unoptimized
            className="object-cover opacity-85 transition-opacity hover:opacity-100"
          />
          <span className="absolute left-4 top-4 border border-white/30 bg-black/75 px-3 py-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white">
            Play on YouTube ↗
          </span>
        </div>
      ) : null}
      <div className="p-5">
        <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-accent">
          {kind === "image"
            ? "External photo"
            : kind === "video"
              ? "External video"
              : "External media"}{" "}
          / {media.host}
        </p>
        {media.kind === "link" ? (
          <p className="mt-2 break-all text-sm text-ink">
            Open original media ↗
          </p>
        ) : null}
        <p className="mt-2 text-xs leading-5 text-muted">
          {credit
            ? `Credit: ${credit}`
            : "Member-supplied link · ownership not independently verified"}
        </p>
      </div>
    </a>
  );
}
