import type { Metadata } from "next";
import Link from "next/link";

import {
  PolicyPage,
  PolicySection,
} from "@/app/(site)/policy-page";
import { createPublicMetadata } from "@/lib/site/metadata";

const description =
  "How Cali Central labels affiliate links, sponsorship, advertising, product discovery, and external purchase destinations.";

export const metadata: Metadata = createPublicMetadata({
  path: "/affiliate-disclosure",
  title: "Affiliate disclosure",
  description,
  socialTitle: "Affiliate disclosure | Cali Central",
});

export default function AffiliateDisclosurePage() {
  return (
    <PolicyPage
      eyebrow="Commercial transparency / External links"
      title="Affiliate disclosure"
      introduction="Cali Central separates independent editorial judgment from affiliate, sponsored, and advertising relationships. A product or event link is not treated as commercial unless the relationship is recorded and disclosed."
      statusLabel="Working commercial standard"
      sidebarTitle="Read the nearby label"
      sidebarText="A disclosure belongs beside the affected link or record. Payment never creates verification, a ranking, a review score, or governing-body authority."
    >
      <PolicySection title="Affiliate links">
        <p>
          When an active affiliate link is used, the page should identify the
          commercial relationship in plain language near the destination. Cali
          Central may receive value after a qualifying action, but the external
          seller controls checkout, eligibility, fulfillment, returns, and its
          own terms.
        </p>
        <p>
          Ordinary source, registration, ticket, livestream, manufacturer, and
          retailer links must not be silently rewritten as affiliate links.
        </p>
      </PolicySection>

      <PolicySection title="Products are discovery records">
        <p>
          A Cali Central product page is a curated external discovery record,
          not inventory, a marketplace checkout, a warranty, or a guarantee of
          price or availability. Visitors should confirm material details with
          the external seller before acting.
        </p>
        <p>
          Prototype products and organizations remain visibly fictional and do
          not create a real endorsement, retailer relationship, or purchase
          destination.
        </p>
      </PolicySection>

      <PolicySection title="Sponsored and advertising material">
        <p>
          Sponsored or advertising material requires its own visible disclosure.
          Commercial participation must not be presented as independent testing,
          editorial verification, athlete verification, or an official result.
        </p>
      </PolicySection>

      <PolicySection title="Editorial independence and questions">
        <p>
          Product selection, reporting, corrections, and sporting-data review
          should remain subject to the same sourcing and conflict standards
          regardless of a commercial relationship. Read the{" "}
          <Link href="/editorial-standards">Editorial Standards</Link> or use the{" "}
          <Link href="/help">Help page</Link> for the contact routes currently
          available.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
