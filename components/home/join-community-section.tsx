import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { featureConfig } from "@/lib/features/config";

const futurePreferences = [
  "Weekly Cali Central",
  "Competition alerts",
  "Published results",
  "Athlete features",
  "Major stories",
] as const;

export function JoinCommunitySection() {
  return (
    <section
      aria-labelledby="join-community-heading"
      className="relative overflow-hidden border-t border-white/10 bg-canvas py-16 sm:py-20 lg:py-24"
    >
      <div aria-hidden="true" className="technical-grid absolute inset-0 opacity-50" />
      <Container className="relative">
        <div className="grid overflow-hidden border border-white/15 bg-surface lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]">
          <div className="p-6 sm:p-9 lg:p-12">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Community signal / One account
            </p>
            <h2
              id="join-community-heading"
              className="mt-5 max-w-3xl text-balance font-display text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] text-ink sm:text-5xl lg:text-6xl"
            >
              Follow the sport. Help build the record.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted">
              Join as a member, athlete, organizer, or contributor through one
              Cali Central identity. Public submissions remain moderated, and
              no account choice grants verification or editorial access.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 min-[420px]:items-start sm:flex-row">
              <ButtonLink href={featureConfig.community ? "/community" : "/join"}>
                {featureConfig.community ? "Open Community" : "Join Cali Central"}
              </ButtonLink>
              <ButtonLink href="/editorial-standards" variant="outline">
                Read our standards
              </ButtonLink>
            </div>
          </div>

          <aside className="border-t border-white/15 bg-surface-2 p-6 sm:p-9 lg:border-l lg:border-t-0 lg:p-10">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">
              Newsletter / Future preferences
            </p>
            <h3 className="mt-4 font-display text-2xl font-black uppercase tracking-[-0.035em] text-ink">
              Choose your signal later.
            </h3>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {futurePreferences.map((preference) => (
                <li
                  key={preference}
                  className="flex min-h-10 items-center gap-3 border-t border-white/10 py-2 text-sm font-semibold text-ink/85"
                >
                  <span aria-hidden="true" className="size-1.5 bg-accent" />
                  {preference}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-l-2 border-amber-300 pl-4 text-xs leading-6 text-amber-100/80">
              Preference controls and email delivery are not active in this
              prototype. Joining does not subscribe you or send marketing
              email.
            </p>
          </aside>
        </div>
      </Container>
    </section>
  );
}
