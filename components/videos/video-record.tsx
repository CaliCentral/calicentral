import { Container } from "@/components/ui/container";
import type { MediaFeature } from "@/types/video";

type VideoRecordProps = {
  readonly video: MediaFeature;
};

export function VideoRecord({ video }: VideoRecordProps) {
  return (
    <>
      <section
        aria-labelledby="video-overview-heading"
        className="technical-grid-dark bg-paper py-14 text-on-light sm:py-18 lg:py-24"
      >
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent-dark">
              Editorial frame / Record overview
            </p>
            <h2
              id="video-overview-heading"
              className="mt-4 max-w-3xl text-balance font-display text-4xl font-black uppercase leading-[0.94] tracking-[-0.055em] text-on-light sm:text-5xl"
            >
              The story behind the static frame.
            </h2>
            <div className="mt-8 max-w-3xl space-y-5 text-base leading-8 text-muted-dark">
              {video.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <dl className="self-start border-y border-on-light/20">
            {[
              ["Series", video.seriesTitle],
              ["Format", video.format],
              ["Category", video.category],
              ["Runtime", video.duration],
              ["Location", video.location],
              ["Published", video.publishedDateDisplay],
              ["Frame", video.frameCode],
            ].map(([label, value]) => (
              <div
                key={label}
                className="border-t border-on-light/15 py-4 first:border-t-0"
              >
                <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-dark">
                  {label}
                </dt>
                <dd className="mt-1.5 text-sm font-bold uppercase leading-5 text-on-light">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {video.chapters.length > 0 ? (
        <section
          aria-labelledby="video-chapters-heading"
          className="border-t border-white/10 bg-canvas py-14 sm:py-18 lg:py-22"
        >
          <Container>
            <SectionIntro
              eyebrow="Sequence map / Chapters"
              headingId="video-chapters-heading"
              title="A runtime you can read."
              description="Chapter times describe the fictional editorial structure. They are reference markers only and do not control playback."
            />
            <ol className="border-y border-white/15">
              {video.chapters.map((chapter, index) => (
                <li
                  key={`${chapter.timestamp}-${chapter.title}`}
                  className="grid gap-4 border-t border-white/12 py-5 first:border-t-0 sm:grid-cols-[6rem_minmax(0,0.75fr)_minmax(0,1.25fr)] sm:items-start sm:gap-7"
                >
                  <div>
                    <p className="font-mono text-lg font-black tabular-nums text-accent">
                      {chapter.timestamp}
                    </p>
                    <p className="mt-1 font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
                      Chapter {String(index + 1).padStart(2, "0")}
                    </p>
                  </div>
                  <h3 className="text-lg font-black uppercase leading-6 text-ink">
                    {chapter.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted">
                    {chapter.description}
                  </p>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      ) : null}

      {video.transcript && video.transcript.length > 0 ? (
        <section
          aria-labelledby="video-transcript-heading"
          className="border-t border-white/10 bg-surface py-14 sm:py-18 lg:py-22"
        >
          <Container>
            <SectionIntro
              eyebrow="Text record / Sample transcript"
              headingId="video-transcript-heading"
              title="Voices from the edit."
              description="This short fictional transcript excerpt demonstrates an accessible text companion; it does not transcribe real media."
            />
            <div className="mx-auto max-w-4xl border-y border-white/15">
              {video.transcript.map((block, index) => (
                <article
                  key={`${block.speaker}-${index}`}
                  className="grid gap-3 border-t border-white/12 py-5 first:border-t-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-7"
                >
                  <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-accent">
                      {block.speaker}
                    </p>
                    {block.timestamp ? (
                      <p className="mt-1 font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-muted">
                        {block.timestamp}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-base leading-7 text-ink/85">{block.text}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {video.editorialNotes && video.editorialNotes.length > 0 ? (
        <section
          aria-labelledby="video-notes-heading"
          className="border-t border-white/10 bg-surface py-14 sm:py-18 lg:py-22"
        >
          <Container>
            <SectionIntro
              eyebrow="Desk notes / Editorial context"
              headingId="video-notes-heading"
              title="What the edit is looking for."
              description="Production notes are fictional and explain the archive record without implying playable media exists."
            />
            <div className="grid gap-px border border-white/15 bg-white/15 md:grid-cols-2">
              {video.editorialNotes.map((note, index) => (
                <article key={note.heading} className="bg-canvas p-5 sm:p-6">
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
                    Note / {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-4 text-xl font-black uppercase text-ink">
                    {note.heading}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {note.text}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {video.credits.length > 0 ? (
        <section
          aria-labelledby="video-credits-heading"
          className="border-t border-white/10 bg-surface-2 py-14 sm:py-18 lg:py-22"
        >
          <Container>
            <SectionIntro
              eyebrow="Production file / Credits"
              headingId="video-credits-heading"
              title="The fictional desk behind the frame."
              description="Every credited person or desk label is invented for this public prototype."
            />
            <dl className="grid gap-px border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-3">
              {video.credits.map((credit) => (
                <div
                  key={`${credit.role}-${credit.name}`}
                  className="bg-canvas p-5"
                >
                  <dt className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
                    {credit.role}
                  </dt>
                  <dd className="mt-2 text-lg font-black uppercase text-ink">
                    {credit.name}
                  </dd>
                  <p className="mt-3 font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-accent">
                    {credit.status}
                  </p>
                </div>
              ))}
            </dl>
          </Container>
        </section>
      ) : null}
    </>
  );
}

type SectionIntroProps = {
  readonly eyebrow: string;
  readonly headingId: string;
  readonly title: string;
  readonly description: string;
};

function SectionIntro({
  eyebrow,
  headingId,
  title,
  description,
}: SectionIntroProps) {
  return (
    <div className="mb-9 grid gap-5 border-t border-white/15 pt-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] md:items-end sm:mb-11">
      <div>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">
          {eyebrow}
        </p>
        <h2
          id={headingId}
          className="mt-4 max-w-3xl text-balance font-display text-4xl font-black uppercase leading-[0.94] tracking-[-0.055em] text-ink sm:text-5xl"
        >
          {title}
        </h2>
      </div>
      <p className="max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
        {description}
      </p>
    </div>
  );
}

