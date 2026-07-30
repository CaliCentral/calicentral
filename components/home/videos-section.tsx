import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/home/section-heading";
import { videos } from "@/data/homepage";
import type { EditorialTone } from "@/types/content";

const thumbnailStyles: Record<EditorialTone, string> = {
  sunset: "bg-rust",
  ocean: "bg-pacific",
  clay: "bg-clay",
  night: "bg-ink",
};

export function VideosSection() {
  return (
    <section
      id="videos"
      aria-labelledby="videos-heading"
      className="bg-canvas py-16 sm:py-20 lg:py-28"
    >
      <Container>
        <SectionHeading
          headingId="videos-heading"
          eyebrow="Watch"
          title="Movement, slowed down"
          description="Short-form visual stories focused on technique, preparation, and the communities built around every session."
        />

        <div className="grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <article key={video.id} className="group">
              <div
                role="img"
                aria-label={`Abstract thumbnail for ${video.title}`}
                className={`relative aspect-[4/3] overflow-hidden ${thumbnailStyles[video.tone]}`}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-x-[15%] top-[18%] h-[64%] border-x border-white/40"
                />
                <div
                  aria-hidden="true"
                  className="absolute left-[-12%] top-[45%] h-px w-[125%] -rotate-12 bg-white/35"
                />
                <div
                  aria-hidden="true"
                  className="absolute right-[10%] top-[12%] size-28 rounded-full border-[1.6rem] border-white/15"
                />
                <span className="absolute left-5 top-5 bg-ink px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white">
                  {video.episode}
                </span>
                <span className="absolute bottom-5 left-5 grid size-12 place-items-center rounded-full bg-canvas text-ink shadow-lg">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="ml-0.5 size-4"
                  >
                    <path d="M6.5 4.7 15 10l-8.5 5.3z" fill="currentColor" />
                  </svg>
                </span>
                <span className="absolute bottom-5 right-5 bg-ink/90 px-2.5 py-1.5 font-mono text-xs font-bold text-white">
                  {video.duration}
                </span>
              </div>

              <div className="border-b border-ink/15 pb-6 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-rust">
                  {video.series}
                </p>
                <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.035em] text-ink">
                  {video.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {video.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-xs leading-5 text-muted">
          Video previews are fictional and non-interactive in this public
          prototype.
        </p>
      </Container>
    </section>
  );
}
