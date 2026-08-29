import type { Metadata } from "next";
import Link from "next/link";

import {
  PolicyPage,
  PolicySection,
} from "@/app/(site)/policy-page";
import { createPublicMetadata } from "@/lib/site/metadata";

const description =
  "About Cali Central, an independent global calisthenics media, community, competition, and public-record platform in development.";

export const metadata: Metadata = createPublicMetadata({
  path: "/about",
  title: "About",
  description,
  socialTitle: "About Cali Central",
});

export default function AboutPage() {
  return (
    <PolicyPage
      eyebrow="Cali Central / Platform overview"
      title="The sport in context"
      introduction="Cali Central is being built as an independent global home for calisthenics reporting, public athlete and competition records, community participation, media discovery, and transparent commercial links."
      statusLabel="Public platform overview"
      sidebarTitle="Independent, not official"
      sidebarText="Cali Central is not a governing body. A profile, article, source label, community post, product record, or external link has only the authority stated beside it."
    >
      <PolicySection title="What Cali Central publishes">
        <p>
          The platform connects editorial stories, athletes, teams,
          organizations, competitions, rankings, standings, and videos without
          collapsing them into one universal claim. Public records should show
          their source, date, status, and responsible authority where those
          distinctions matter.
        </p>
      </PolicySection>

      <PolicySection title="How people take part">
        <p>
          Members can participate in community features when enabled. Athletes,
          organizers, team representatives, creators, contributors, and product
          representatives can submit material through protected review routes.
          A submission is private by default and never publishes, verifies, or
          grants league admission automatically.
        </p>
      </PolicySection>

      <PolicySection title="Trust and transparency">
        <p>
          Cali Central distinguishes independent editorial judgment, submitted
          claims, source-confirmed records, prototype material, community speech,
          and commercial relationships. Start with the{" "}
          <Link href="/editorial-standards">Editorial Standards</Link>,{" "}
          <Link href="/verification">Verification guide</Link>, and{" "}
          <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>.
        </p>
      </PolicySection>

      <PolicySection title="Current stage">
        <p>
          The application remains under active development. Some records are
          fictional or illustrative and are labeled accordingly. Features that
          require persistence fail closed when their reviewed configuration is
          not present. Use the <Link href="/help">Help page</Link> for the real
          contact and intake routes currently available.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
