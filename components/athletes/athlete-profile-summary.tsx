import { Container } from "@/components/ui/container";
import {
  athleteCategoryLabel,
  athleteSpecialtyLabel,
} from "@/lib/athlete-taxonomy";
import { formatGlobalLocation } from "@/lib/geography";
import type { Athlete } from "@/types/athlete";

type AthleteProfileSummaryProps = {
  readonly athlete: Athlete;
};

export function AthleteProfileSummary({
  athlete,
}: AthleteProfileSummaryProps) {
  const details = [
    {
      label: "Primary competition category",
      value: athleteCategoryLabel(athlete.primaryCategory),
    },
    {
      label: "Specialties",
      value: athlete.specialties.map(athleteSpecialtyLabel).join(" / "),
    },
    { label: "Public location", value: formatGlobalLocation(athlete) },
    { label: "Training base", value: athlete.trainingBase },
    { label: "Years active", value: athlete.yearsActive },
    { label: "Signature approach", value: athlete.style },
  ].filter((detail) => Boolean(detail.value));
  const isPrototype = /fictional|prototype|sample/i.test(
    `${athlete.status} ${athlete.profileLabel}`,
  );

  return (
    <section
      aria-labelledby="athlete-summary-heading"
      className="technical-grid-dark bg-paper py-16 text-on-light sm:py-20 lg:py-24"
    >
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(15rem,0.48fr)_minmax(0,1.12fr)] lg:gap-16 xl:gap-24">
          <aside className="self-start lg:sticky lg:top-28">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent-dark">
              Profile summary / {athlete.profileNumber}
            </p>
            <dl className="mt-5 border-t border-on-light/20">
              {details.map((detail) => (
                <div
                  key={detail.label}
                  className="border-b border-on-light/15 py-4"
                >
                  <dt className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-dark">
                    {detail.label}
                  </dt>
                  <dd className="mt-2 text-sm font-semibold leading-5 text-on-light">
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>

          <div className="min-w-0">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent-dark">
              {athlete.profileLabel}
            </p>
            <h2
              id="athlete-summary-heading"
              className="mt-4 max-w-3xl text-balance font-display text-4xl font-black uppercase leading-[0.95] tracking-[-0.055em] sm:text-5xl lg:text-6xl"
            >
              Practice in profile
            </h2>

            {athlete.quote ? (
              <blockquote className="my-10 border-y border-on-light/20 py-8 sm:my-12 sm:py-10">
                <p className="text-balance font-display text-3xl font-black leading-[1.04] tracking-[-0.045em] text-accent-dark sm:text-4xl">
                  “{athlete.quote}”
                </p>
                <footer className="mt-5 font-mono text-xs font-bold uppercase tracking-[0.13em] text-muted-dark">
                  — {athlete.name}
                  {isPrototype ? ", fictional athlete voice" : ""}
                </footer>
              </blockquote>
            ) : null}

            {athlete.fullBio.length > 0 ? (
              <div className="article-copy max-w-[46rem] space-y-7">
                {athlete.fullBio.map((paragraph) => (
                  <p key={paragraph} className="text-on-light/86">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}

            {athlete.socialLinks.length > 0 ? (
              <section
                aria-labelledby="athlete-social-heading"
                className="mt-10 border-t border-on-light/20 pt-8"
              >
                <h3
                  id="athlete-social-heading"
                  className="font-display text-2xl font-black uppercase tracking-[-0.035em]"
                >
                  Public social links
                </h3>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {athlete.socialLinks.map((link) => (
                    <li key={link.platform}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border border-on-light/20 p-4 transition-colors hover:border-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-dark"
                      >
                        <span className="block text-sm font-bold uppercase">
                          {socialPlatformLabel(link.platform)}
                        </span>
                        <span className="mt-1 block break-all text-xs text-muted-dark">
                          {link.handle || "Open public profile"} · Opens in a new tab
                        </span>
                        <span className="mt-2 block font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted-dark">
                          {link.confirmationStatus === "confirmed"
                            ? "Account confirmed"
                            : "Account not confirmed"}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {isPrototype ? (
              <div className="mt-10 border border-accent-dark/30 bg-accent-dark/8 p-5 sm:p-6">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent-dark">
                  Prototype profile notice
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-dark">
                  This public record is fictional sample content. The athlete,
                  training base, statistics, achievements, timeline, and
                  quotations do not represent a real person or organization.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}

function socialPlatformLabel(platform: Athlete["socialLinks"][number]["platform"]): string {
  const labels = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    facebook: "Facebook",
    x: "X",
    threads: "Threads",
    website: "Personal website",
    "sponsor-merch": "Sponsor or merchandise",
  } as const;

  return labels[platform];
}
