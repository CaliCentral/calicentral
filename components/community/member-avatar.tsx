import Image from "next/image";

const trustedAvatarHosts = new Set([
  "avatars.githubusercontent.com",
  "cdn.sanity.io",
  "lh3.googleusercontent.com",
]);

export function trustedCommunityImageUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && trustedAvatarHosts.has(url.hostname)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function MemberAvatar({
  displayName,
  avatarUrl,
  size = "md",
}: {
  readonly displayName: string;
  readonly avatarUrl?: string;
  readonly size?: "sm" | "md" | "lg";
}) {
  const src = trustedCommunityImageUrl(avatarUrl);
  const sizes = size === "lg" ? "h-24 w-24" : size === "sm" ? "h-9 w-9" : "h-12 w-12";
  const imageSize = size === "lg" ? 96 : size === "sm" ? 36 : 48;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-white/20 bg-surface-2 font-display font-black uppercase text-accent ${sizes}`}
      aria-hidden="true"
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={imageSize}
          height={imageSize}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        displayName.trim().slice(0, 2) || "CC"
      )}
    </span>
  );
}

export function MemberCover({
  coverImageUrl,
  displayName,
}: {
  readonly coverImageUrl?: string;
  readonly displayName: string;
}) {
  const src = trustedCommunityImageUrl(coverImageUrl);
  return (
    <div className="technical-grid relative h-28 overflow-hidden border-b border-white/12 bg-surface-2 sm:h-40">
      {src ? (
        <Image
          src={src}
          alt={`${displayName} profile cover`}
          fill
          sizes="(max-width: 768px) 100vw, 1152px"
          unoptimized
          className="object-cover opacity-80"
        />
      ) : null}
    </div>
  );
}
