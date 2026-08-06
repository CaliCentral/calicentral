import type { Metadata } from "next";

import {
  PolicyPage,
  PolicySection,
} from "@/app/(site)/policy-page";
import { publicContactEmail } from "@/lib/site/config";
import { createPublicMetadata } from "@/lib/site/metadata";

const description =
  "An owner-review draft covering proposed Cali Central platform use, submissions, fictional prototype content, moderation, and availability.";

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
      introduction="These proposed terms are a planning draft for owner and legal review. They are not final terms and do not yet form a complete agreement for account or contribution features."
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
          People using future account features will be expected to provide
          accurate account information, protect access to their sign-in
          method, and use the platform lawfully.
        </p>
        <p>
          Misuse would include attempting unauthorized access, disrupting
          service, evading access controls, scraping in ways that impair the
          platform, impersonating others, submitting malicious code, or
          publishing unlawful or abusive material.
        </p>
      </PolicySection>

      <PolicySection title="Contributor authority">
        <p>
          A contributor must have authority to submit the material and to
          grant the permissions needed for editorial review and any approved
          publication. A contributor should not provide confidential
          information, private personal data, or material that infringes
          another person&apos;s rights.
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
          or social links may be operated by third parties under their own
          terms and policies. A link is not a guarantee or endorsement.
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
              added before this draft is approved for production.
            </>
          )}
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
