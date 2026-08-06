import Image from "next/image";

import type { EditorialImage } from "@/types/content";

type ContentImageProps = {
  readonly image: EditorialImage;
  readonly sizes: string;
  readonly priority?: boolean;
  readonly className?: string;
  readonly showDetails?: boolean;
};

export function ContentImage({
  image,
  sizes,
  priority = false,
  className = "",
  showDetails = false,
}: ContentImageProps) {
  const details = [image.caption, image.credit].filter(Boolean).join(" · ");

  return (
    <div className={`absolute inset-0 ${className}`}>
      <Image
        src={image.src}
        alt={image.decorative ? "" : image.alt}
        fill
        sizes={sizes}
        priority={priority}
        placeholder={image.blurDataURL ? "blur" : "empty"}
        blurDataURL={image.blurDataURL}
        className="object-cover"
      />
      {showDetails && details ? (
        <p className="absolute inset-x-0 bottom-0 bg-canvas/85 px-4 py-3 text-xs leading-5 text-ink backdrop-blur-sm">
          {details}
        </p>
      ) : null}
    </div>
  );
}
