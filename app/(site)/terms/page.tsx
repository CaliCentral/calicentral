import type { Metadata } from "next";
import Link from "next/link";

import {
  PolicyPage,
  PolicySection,
} from "@/app/(site)/policy-page";
import { publicContactEmail } from "@/lib/site/config";
import { createPublicMetadata } from "@/lib/site/metadata";

const description =
  "An owner-review draft covering Cali Central accounts, community participation, submissions, media rights, product discovery, moderation, and availability.";

export const metadata: Metadata = createPublicMetadata({
  path: "/terms",
  title: "Terms draft",
  description,
  socialTitle: "Terms draft | Cali Central",
});

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Platform policy / Terms"
      title="Terms of use"
      introduction="These proposed terms are a planning draft for owner and legal review. They describe current account, community, submission, publishing, and external-link boundaries, but they are not final terms or a complete agreement."
    >
      <PolicySection title="Prototype status">
        <p>
          Cali Central is being developed as a calisthenics media and
          competition platform. Features, records, links, and availability
          may change, pause, or be removed during development.
        </p>
        <p>
          Unless a page clearly says otherwise, current athlete profiles,
          rankings, competition records, videos, quotes, statistics, and
          editorial scenarios are fictional or illustrative. They should not
          be treated as verified facts, official standings, registrations,
          schedules, tickets, or livestreams.
        </p>
      </PolicySection>

      <PolicySection title="Accounts and acceptable use">
        <p>
          People using account features are expected to provide accurate
          account information, protect access to their sign-in method, respect
          role and feature restrictions, and use the platform lawfully.
        </p>
        <p>
          Misuse includes attempting unauthorized access, disrupting
          service, evading access controls, scraping in ways that impair the
          platform, impersonating others, submitting malicious code, or
          publishing unlawful or abusive material.
        </p>
        <p>
          Public member profiles, posts, comments, reposts, linked media, and
          other community participation are also subject to the{" "}
          <Link href="/community-guidelines">Community Guidelines</Link>.
        </p>
      </PolicySection>

      <PolicySection title="Community content and personal tools">
        <p>
          A member remains responsible for content they publish or link. Likes,
          follows, saves, blocks, and private collections are product features;
          they are not endorsements, verification, ownership records, or
          guarantees that a public target will remain available.
        </p>
        <p>
          A member must not expose private information, misrepresent an athlete,
          team, organization, brand, result, or commercial relationship, or share
          media without the authority needed for that use.
        </p>
      </PolicySection>

      <PolicySection title="Submission and representative authority">
        <p>
          A contributor must have authority to submit the material and to
          grant the permissions needed for editorial review and any approved
          publication. A contributor should not provide confidential
          information, private personal data, or material that infringes
          another person&apos;s rights.
        </p>
        <p>
          Athlete requests, team applications, organization claims, proposed
          rosters, competition listings, video or media submissions, and product
          submissions are proposals. The submitter must describe their
          relationship honestly and must not claim consent, ownership,
          affiliation, league admission, or a commercial relationship that has
          not been established.
        </p>
        <p>
          Submission does not guarantee review, response, acceptance,
          publication, placement, payment, or continued availability.
        </p>
      </PolicySection>

      <PolicySection title="Editorial review and ownership">
        <p>
          Cali Central may fact-check, edit, format, headline, annotate,
          decline, unpublish, or request changes to submitted material.
          Editorial and moderation decisions may consider accuracy, safety,
          relevance, quality, rights, and available resources.
        </p>
        <p>
          Submitting material does not by itself transfer the contributor&apos;s
          ownership. Final contributor terms must define the limited
          permissions Cali Central needs to review, adapt, publish, promote,
          archive, and remove approved material.
        </p>
      </PolicySection>

      <PolicySection title="Availability and external services">
        <p>
          The platform may be unavailable or incomplete, and information may
          contain errors. External registration, ticket, livestream, OAuth,
          social, manufacturer, retailer, and affiliate destinations are
          operated by third parties under their own terms and policies. A link
          is not a guarantee, endorsement, ticket, purchase, or reservation.
        </p>
        <p>
          Product pages are discovery records, not Cali Central inventory or
          checkout. Prices and availability can change, and an external seller
          remains responsible for purchase terms, fulfillment, returns,
          warranties, and product claims.
        </p>
      </PolicySection>

      <PolicySection title="Commercial relationships">
        <p>
          An affiliate, sponsored, or advertising relationship must be disclosed
          where it affects a page or link. Payment does not create independent
          testing, editorial verification, a ranking, or governing-body
          authority. Read the{" "}
          <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>.
        </p>
      </PolicySection>

      <PolicySection title="Moderation and suspension">
        <p>
          Cali Central may restrict, suspend, or remove access or content
          when reasonably needed to address misuse, security risk, legal
          concerns, rights complaints, or editorial integrity. The final
          terms must describe any notice and appeal process offered at
          launch.
        </p>
        <p>
          A report begins a private review and is not proof of a violation.
          Community posts or comments may be hidden or restored, while changes
          to editorial and sporting records remain part of the separate
          publishing and corrections process.
        </p>
      </PolicySection>

      <PolicySection title="Copyright and corrections">
        <p>
          Use the <Link href="/copyright">copyright and media-rights process</Link>{" "}
          for attribution, permission, or rights concerns. Use the{" "}
          <Link href="/corrections">corrections process</Link> for disputed
          published facts or sporting data. Neither route grants an automatic
          removal or change.
        </p>
      </PolicySection>

      <PolicySection title="Questions">
        <p>
          {publicContactEmail ? (
            <>
              Questions about this draft can be sent to{" "}
              <a href={`mailto:${publicContactEmail}`}>
                {publicContactEmail}
              </a>
              .
            </>
          ) : (
            <>
              A public terms contact has not been configured. It will be
              added before this draft is approved for production. The{" "}
              <Link href="/help">Help page</Link> lists the workflows that are
              currently available.
            </>
          )}
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
