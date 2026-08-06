import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import {
  JOIN_INTENTS,
  joinIntentReturnPath,
} from "@/lib/account/capabilities";
import { createPublicMetadata } from "@/lib/site/metadata";

const description =
  "Join Cali Central with one account for member, athlete, organizer, or contributor onboarding.";

export const metadata: Metadata = createPublicMetadata({
  path: "/join",
  title: "Join Cali Central",
  description,
  socialTitle: "Join Cali Central",
});

function signInHref(capability: (typeof JOIN_INTENTS)[number]["capability"]) {
  return `/sign-in?callbackUrl=${encodeURIComponent(
    joinIntentReturnPath(capability),
  )}`;
}

export default function JoinPage() {
  return (
    <>
      <header className="technical-grid relative overflow-hidden border-b border-white/10 bg-canvas py-16 sm:py-20 lg:py-24">
        <Container className="relative">
          <p className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
            <span aria-hidden="true" className="h-1 w-8 bg-accent" />
            One account / Several ways to take part
          </p>
          <h1 className="mt-6 max-w-5xl text-balance font-display text-[clamp(3.4rem,10vw,8.5rem)] font-black uppercase leading-[0.82] tracking-[-0.07em] text-ink">
            Join Cali Central
          </h1>
          <p className="mt-8 max-w-3xl text-base leading-8 text-muted sm:text-lg">
            Follow the sport, represent your athlete work, share competition
            information, or contribute to independent coverage through one
            Cali Central identity.
          </p>
          <p className="mt-6 max-w-3xl border-l-2 border-accent pl-4 text-sm leading-6 text-muted">
            Choosing an option personalizes the next screen. It does not grant
            editorial access, publish a profile, verify a claim, or create a
            separate authentication system.
          </p>
        </Container>
      </header>

      <section
        aria-labelledby="join-path-heading"
        className="technical-grid-dark bg-paper py-14 text-on-light sm:py-20 lg:py-24"
      >
        <Container>
          <div className="grid gap-6 border-t border-on-light/20 pt-5 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent-dark">
                Account setup / Choose a path
              </p>
              <h2
                id="join-path-heading"
                className="mt-4 max-w-2xl font-display text-4xl font-black uppercase leading-[0.94] tracking-[-0.05em] sm:text-5xl"
              >
                How do you want to begin?
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted-dark md:justify-self-end">
              You can take part in more than one way over time. Athlete,
              organizer, and contributor submissions remain proposals until
              reviewed by the editorial team.
            </p>
          </div>

          <ul className="mt-10 grid gap-px border border-on-light/20 bg-on-light/20 md:grid-cols-2">
            {JOIN_INTENTS.map((intent, index) => (
              <li key={intent.capability} className="bg-paper p-6 sm:p-8">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent-dark">
                      Path / {String(index + 1).padStart(2, "0")} / {intent.title}
                    </p>
                    <h3 className="mt-4 max-w-md font-display text-2xl font-black uppercase leading-tight tracking-[-0.035em] sm:text-3xl">
                      {intent.label}
                    </h3>
                  </div>
                  <span
                    aria-hidden="true"
                    className="font-mono text-3xl font-black text-on-light/10"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-5 max-w-xl text-sm leading-7 text-muted-dark">
                  {intent.description}
                </p>
                <Link
                  href={signInHref(intent.capability)}
                  className="mt-7 inline-flex min-h-12 items-center gap-3 bg-accent-dark px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-dark"
                >
                  Continue as {intent.title}
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-4 border-t border-on-light/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-muted-dark">
              Already have an account? Sign in with the provider connected to
              your existing Cali Central identity.
            </p>
            <Link
              href="/sign-in"
              className="inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.13em] text-accent-dark underline decoration-accent-dark/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-dark"
            >
              Sign in
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
