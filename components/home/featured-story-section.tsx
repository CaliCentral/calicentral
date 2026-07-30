import { CategoryLabel } from "@/components/ui/category-label";
import { Container } from "@/components/ui/container";
import { featuredStory, supportingStories } from "@/data/homepage";
import type { EditorialTone } from "@/types/content";

const toneStyles: Record<EditorialTone, string> = {
  sunset: "bg-rust text-white",
  ocean: "bg-pacific text-white",
  clay: "bg-clay text-ink",
  night: "bg-ink text-white",
};

export function FeaturedStorySection() {
  return (
    <section
      id="featured"
      aria-labelledby="featured-heading"
      className="bg-paper py-16 sm:py-20 lg:py-28"
    >
      <Container>
        <div className="mb-9 flex items-end justify-between gap-5 border-t border-ink/15 pt-5 sm:mb-12 sm:pt-6">
          <div>
            <CategoryLabel>Featured coverage</CategoryLabel>
            <h2
              id="featured-heading"
              className="mt-4 max-w-4xl text-balance text-3xl font-semibold leading-[1.03] tracking-[-0.045em] text-ink sm:text-4xl lg:text-5xl"
            >
              Stories from inside the movement
            </h2>
          </div>
          <p className="hidden max-w-sm text-sm leading-6 text-muted md:block">
            Original reporting and considered perspectives on the people,
            places, and ideas moving calisthenics forward.
          </p>
        </div>

        <article className="grid overflow-hidden border border-ink/15 bg-canvas lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
          <StoryArtwork
            tone={featuredStory.tone}
            location={featuredStory.location}
            index="01"
          />
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12">
            <div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold uppercase tracking-[0.13em] text-muted">
                <span className="text-rust">{featuredStory.category}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={featuredStory.publishedAt}>
                  {featuredStory.publishedLabel}
                </time>
                <span aria-hidden="true">·</span>
                <span>{featuredStory.readingTime}</span>
              </div>
              <h3 className="mt-5 text-balance text-3xl font-semibold leading-[1.02] tracking-[-0.045em] text-ink sm:text-4xl xl:text-5xl">
                {featuredStory.title}
              </h3>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted sm:text-base">
                {featuredStory.summary}
              </p>
            </div>
            <div className="mt-10 flex items-center justify-between border-t border-ink/10 pt-5">
              <span className="text-sm font-bold text-ink">
                Read story preview
              </span>
              <span
                aria-hidden="true"
                className="grid size-10 place-items-center rounded-full border border-ink/20 text-rust"
              >
                ↗
              </span>
            </div>
          </div>
        </article>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {supportingStories.map((story, index) => (
            <article
              key={story.id}
              className="grid overflow-hidden border border-ink/15 bg-canvas sm:grid-cols-[10rem_1fr]"
            >
              <StoryArtwork
                tone={story.tone}
                location={story.location}
                index={`0${index + 2}`}
                compact
              />
              <div className="flex flex-col justify-between p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-rust">
                    {story.category}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold leading-tight tracking-[-0.025em] text-ink">
                    {story.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {story.summary}
                  </p>
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  <time dateTime={story.publishedAt}>
                    {story.publishedLabel}
                  </time>{" "}
                  · {story.readingTime}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 text-xs leading-5 text-muted">
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
  readonly compact?: boolean;
};

function StoryArtwork({
  tone,
  location,
  index,
  compact = false,
}: StoryArtworkProps) {
  return (
    <div
      className={`relative overflow-hidden ${toneStyles[tone]} ${
        compact ? "min-h-48 sm:min-h-full" : "min-h-80 sm:min-h-[30rem]"
      }`}
      aria-label={`Abstract editorial artwork inspired by ${location}`}
      role="img"
    >
      <div
        aria-hidden="true"
        className="absolute -bottom-16 -right-10 size-52 rounded-full border-[2.25rem] border-current opacity-20 sm:size-72"
      />
      <div
        aria-hidden="true"
        className="absolute -left-12 top-[18%] h-24 w-[120%] -rotate-12 border-y border-current opacity-30"
      />
      <span className="absolute left-5 top-5 text-xs font-bold uppercase tracking-[0.16em] opacity-90">
        Cali Central / {index}
      </span>
      <span className="absolute bottom-5 left-5 max-w-[75%] text-xs font-bold uppercase tracking-[0.15em]">
        {location}
      </span>
    </div>
  );
}
