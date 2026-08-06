import Link from "next/link";

import { ContentImage } from "@/components/content/content-image";
import { CategoryLabel } from "@/components/ui/category-label";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import { Container } from "@/components/ui/container";
import type {
  EditorialImage,
  EditorialTone,
  StoryPreview,
} from "@/types/content";

const toneStyles: Record<EditorialTone, string> = {
  signal: "bg-accent text-canvas",
  field: "bg-surface-2 text-ink",
  frame: "bg-canvas text-ink",
  paper: "bg-paper text-on-light",
};

type FeaturedStorySectionProps = {
  readonly featuredStory: StoryPreview | null;
  readonly supportingStories: readonly StoryPreview[];
};

export function FeaturedStorySection({
  featuredStory,
  supportingStories,
}: FeaturedStorySectionProps) {
  return (
    <section
      id="featured"
      aria-labelledby="featured-heading"
      className="technical-grid-dark bg-paper py-16 text-on-light sm:py-20 lg:py-24"
    >
      <Container>
        <div className="mb-9 grid gap-5 border-t border-on-light/20 pt-5 sm:mb-12 sm:pt-6 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)] md:items-end">
          <div>
            <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.17em] text-muted-dark">
              Section 01 / Editorial field
            </p>
            <div className="[&>span]:text-accent-dark [&>span>span]:bg-accent-dark">
              <CategoryLabel>Featured coverage</CategoryLabel>
            </div>
            <h2
              id="featured-heading"
              className="mt-4 max-w-4xl text-balance font-display text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] text-on-light sm:text-5xl lg:text-6xl"
            >
              Stories from inside the movement
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-dark sm:text-base sm:leading-7">
            Original reporting and considered perspectives on the people,
            places, and ideas moving calisthenics forward.
          </p>
        </div>

        {featuredStory ? (
          <article>
          <Link
            href={featuredStory.href}
            className="group grid overflow-hidden border border-on-light/25 bg-canvas text-ink transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)]"
          >
            <StoryArtwork
              tone={featuredStory.tone}
              location={featuredStory.location}
              index="01"
              image={featuredStory.image}
            />
            <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12">
              <div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted">
                  <span className="text-accent-strong">
                    {featuredStory.category}
                  </span>
                  <span aria-hidden="true" className="text-white/25">
                    /
                  </span>
                  <time dateTime={featuredStory.publishedAt}>
                    {featuredStory.publishedLabel}
                  </time>
                  <span aria-hidden="true" className="text-white/25">
                    /
                  </span>
                  <span>{featuredStory.readingTime}</span>
                </div>
                <h3 className="mt-6 text-balance font-display text-3xl font-black uppercase leading-[0.96] tracking-[-0.045em] text-ink transition-colors group-hover:text-accent sm:text-4xl xl:text-5xl">
                  {featuredStory.title}
                </h3>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-muted sm:text-base">
                  {featuredStory.summary}
                </p>
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-white/15 pt-5">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink">
                  Read full story
                </span>
                <span
                  aria-hidden="true"
                  className="grid size-10 place-items-center border border-white/25 text-lg text-accent transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-canvas"
                >
                  ↗
                </span>
              </div>
            </div>
          </Link>
          </article>
        ) : (
          <ContentEmptyState
            title="No featured story is published"
            description="The editorial desk is preparing its next lead story. Published reporting will appear here."
            className="bg-canvas"
          />
        )}

        {supportingStories.length > 0 ? (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {supportingStories.map((story, index) => (
            <article key={story.id}>
              <Link
                href={story.href}
                className="group grid h-full overflow-hidden border border-on-light/25 bg-surface text-ink transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:grid-cols-[10.5rem_1fr]"
              >
                <StoryArtwork
                  tone={story.tone}
                  location={story.location}
                  index={`0${index + 2}`}
                  image={story.image}
                  compact
                />
                <div className="flex min-w-0 flex-col justify-between p-6">
                  <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent-strong">
                      {story.category}
                    </p>
                    <h3 className="mt-3 text-balance text-xl font-black uppercase leading-[1.05] tracking-[-0.025em] text-ink transition-colors group-hover:text-accent sm:text-2xl">
                      {story.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {story.summary}
                    </p>
                  </div>
                  <p className="mt-6 border-t border-white/10 pt-4 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted">
                    <time dateTime={story.publishedAt}>
                      {story.publishedLabel}
                    </time>{" "}
                    / {story.readingTime}
                  </p>
                </div>
              </Link>
            </article>
            ))}
          </div>
        ) : null}

        <p className="mt-6 max-w-3xl text-xs leading-5 text-muted-dark">
          Editorial names and reporting shown here are fictional prototype
          content.
        </p>
      </Container>
    </section>
  );
}

type StoryArtworkProps = {
  readonly tone: EditorialTone;
  readonly location: string;
  readonly index: string;
  readonly image?: EditorialImage;
  readonly compact?: boolean;
};

function StoryArtwork({
  tone,
  location,
  index,
  image,
  compact = false,
}: StoryArtworkProps) {
  return (
    <div
      className={`relative overflow-hidden ${toneStyles[tone]} ${
        compact ? "min-h-48 sm:min-h-full" : "min-h-72 sm:min-h-[28rem]"
      }`}
      aria-label={
        image ? undefined : `Abstract editorial artwork inspired by ${location}`
      }
      role={image ? undefined : "img"}
    >
      {image ? (
        <>
          <ContentImage
            image={image}
            sizes={
              compact
                ? "(min-width: 768px) 11rem, 100vw"
                : "(min-width: 1024px) 56vw, 100vw"
            }
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-canvas/55 via-transparent to-canvas/80"
          />
        </>
      ) : (
        <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] [background-size:3rem_3rem]" />
        <div className="absolute -right-[12%] top-[16%] size-52 border-[2.5rem] border-current opacity-15 sm:size-72" />
        <div className="absolute -left-[18%] top-[48%] h-16 w-[135%] -rotate-6 border-y border-current opacity-30" />
        <div className="absolute bottom-[19%] right-[10%] h-px w-[62%] bg-current opacity-45" />
        <div className="absolute bottom-[13%] right-[10%] h-px w-[38%] bg-current opacity-25" />
        </div>
      )}
      <span
        aria-hidden="true"
        className="absolute left-5 top-5 font-mono text-xs font-bold uppercase tracking-[0.17em] sm:left-6 sm:top-6"
      >
        CC / Story frame
      </span>
      <span
        aria-hidden="true"
        className="absolute right-4 top-4 font-mono text-6xl font-black leading-none tracking-[-0.1em] opacity-15 sm:right-6 sm:top-6 sm:text-8xl"
      >
        {index}
      </span>
      <span
        aria-hidden="true"
        className="absolute bottom-5 left-5 max-w-[75%] font-mono text-xs font-bold uppercase tracking-[0.15em] sm:bottom-6 sm:left-6"
      >
        {location}
      </span>
      {image && (image.caption || image.credit) ? (
        <p className="absolute bottom-3 right-3 max-w-[60%] bg-canvas/80 px-3 py-2 text-right text-[0.65rem] leading-4 text-white/80">
          {[image.caption, image.credit].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
