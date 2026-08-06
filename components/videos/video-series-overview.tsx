import { Container } from "@/components/ui/container";
import type { MediaFeature, VideoSeries } from "@/types/video";

type VideoSeriesOverviewProps = {
  readonly series: readonly VideoSeries[];
  readonly videos: readonly MediaFeature[];
};

function formatRuntime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function VideoSeriesOverview({
  series,
  videos,
}: VideoSeriesOverviewProps) {
  if (series.length === 0) {
    return null;
  }

  const seriesCountLabel =
    series.length === 1
      ? "One editorial lens."
      : `${series.length} editorial lenses.`;

  return (
    <section
      aria-labelledby="series-overview-heading"
      className="border-b border-white/10 bg-surface py-14 sm:py-18 lg:py-22"
    >
      <Container>
        <div className="mb-9 grid gap-5 border-t border-white/15 pt-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] md:items-end sm:mb-11">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
              Archive structure / Series index
            </p>
            <h2
              id="series-overview-heading"
              className="mt-4 text-balance font-display text-4xl font-black uppercase leading-[0.94] tracking-[-0.055em] text-ink sm:text-5xl"
            >
              {seriesCountLabel}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
            Each series gives the fictional archive a stable point of view,
            from technical observation to athlete-led field reporting.
          </p>
        </div>

        <div className="grid gap-px border border-white/15 bg-white/15 md:grid-cols-2 xl:grid-cols-5">
          {series.map((item, index) => {
            const seriesVideos = videos.filter(
              (video) => video.seriesSlug === item.slug,
            );
            const runtime = seriesVideos.reduce(
              (total, video) => total + video.durationSeconds,
              0,
            );

            return (
              <article key={item.slug} className="bg-canvas p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
                    Series / {String(index + 1).padStart(2, "0")}
                  </p>
                  <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
                    {seriesVideos.length} ep
                  </span>
                </div>
                <h3 className="mt-5 text-balance font-display text-2xl font-black uppercase leading-[1.02] tracking-[-0.04em] text-ink">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-6 text-muted">
                  {item.description}
                </p>
                <div className="mt-6 border-t border-white/12 pt-4 font-mono text-[0.65rem] font-bold uppercase leading-5 tracking-[0.12em] text-muted">
                  <p>{item.categoryEmphasis}</p>
                  <p className="mt-1 text-ink">
                    {formatRuntime(runtime)} total
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
