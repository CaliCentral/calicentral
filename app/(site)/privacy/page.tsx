import type { Metadata } from "next";
import Link from "next/link";

import {
  PolicyPage,
  PolicySection,
} from "@/app/(site)/policy-page";
import { publicContactEmail } from "@/lib/site/config";
import { createPublicMetadata } from "@/lib/site/metadata";

const description =
  "An owner-review draft describing the intended privacy approach for Cali Central accounts, contributions, publishing, and platform operations.";

export const metadata: Metadata = createPublicMetadata({
  path: "/privacy",
  title: "Privacy draft",
  description,
  socialTitle: "Privacy draft | Cali Central",
});

function ContactDetails() {
  if (publicContactEmail) {
    return (
      <a href={`mailto:${publicContactEmail}`}>{publicContactEmail}</a>
    );
  }

  return (
    <span>
      A public privacy contact has not been configured. It will be added
      before this draft is approved for production.
    </span>
  );
}

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Platform policy / Privacy"
      title="Privacy notice"
      introduction="This is a conservative planning draft for owner review. It describes how the proposed Cali Central platform is expected to handle information, but it is not a final or effective privacy notice."
    >
      <PolicySection title="Scope and current status">
        <p>
          Cali Central is currently a prototype media and competition
          platform. Public stories, athlete profiles, event records,
          rankings, and videos may be fictional or illustrative. Account,
          contribution, and moderation features may change before launch.
        </p>
        <p>
          The final notice must be reviewed against the services actually
          enabled in production and the places where the platform is offered.
        </p>
      </PolicySection>

      <PolicySection title="Information the platform may handle">
        <ul>
          <li>
            OAuth identity details supplied by a selected sign-in provider,
            such as name, email address, profile image, and provider account
            identifier.
          </li>
          <li>
            Contributor profile fields, account preferences, and material
            submitted for editorial review.
          </li>
          <li>
            When community features are enabled, explicitly public member
            profile fields, posts, comments, and linked media, plus relationship,
            engagement, report, block, save, and collection records needed to
            operate those features.
          </li>
          <li>
            Team applications, proposed roster and consent information,
            organization claims, media-rights details, product submissions, and
            information about a submitter&apos;s representative or commercial
            relationship.
          </li>
          <li>
            Submission history, editorial decisions, review notes, role and
            access records, and suspension status.
          </li>
          <li>
            Security and operational logs such as timestamps, request
            details, device or browser information, IP-derived signals, and
            error records.
          </li>
        </ul>
        <p>
          People should not submit confidential, sensitive, or third-party
          information unless Cali Central has specifically requested it and
          the contributor has authority to provide it.
        </p>
      </PolicySection>

      <PolicySection title="Community visibility">
        <p>
          A public member profile is separate from the private contributor
          record and requires an explicit publication choice. Authentication
          email, private contributor biography, submissions, access status,
          claim evidence, report details, blocks, saves, and collections are not
          part of the public member projection. A public count or relationship
          state does not make the underlying private account record public.
        </p>
        <p>
          Public posts and comments may be visible to anyone while the feature
          is enabled. Likes, follows, reports, blocks, saves, and collections
          may be processed to provide and protect the community experience.
          Exact retention and account-request handling still require owner and
          legal review before launch.
        </p>
      </PolicySection>

      <PolicySection title="Teams, organizations, media, and products">
        <p>
          Applications and claims remain private intake records. A separate
          public team, organization, roster, media, or product record is created
          only through an editorial publishing decision. Proposed roster email,
          phone, consent, invitation, claim-evidence, and review fields are not
          public profile data.
        </p>
        <p>
          A published product or organization record may identify public brand,
          retailer, source, and commercial-disclosure information. It does not
          expose private representative evidence or submission notes. Cali
          Central does not provide product checkout; following an external link
          sends the visitor to a third party under that party&apos;s privacy terms.
        </p>
        <p>
          The current application does not claim to collect payment-card or
          checkout data. If Cali Central later introduces first-party affiliate
          click attribution, purchase analytics, or advertising measurement,
          the production notice must describe that processing before it is
          enabled.
        </p>
      </PolicySection>

      <PolicySection title="Why information may be used">
        <p>
          The intended uses are to authenticate accounts, maintain
          contributor profiles, receive and review submissions, communicate
          about editorial decisions, operate community and personal-library
          features, review claimed relationships and media rights, maintain
          accurate commercial disclosures, protect the platform, investigate
          misuse, and diagnose service problems.
        </p>
        <p>
          A submission is not automatically public. If material is approved
          and published, selected content and contributor attribution may
          become publicly visible.
        </p>
      </PolicySection>

      <PolicySection title="Services and access">
        <p>
          The planned platform uses OAuth providers for sign-in, Sanity for
          public content and operational account and submission records, and
          Cloudflare services for web hosting, static delivery, compute,
          community persistence, and security controls. Those providers may
          process information under their own terms and policies.
        </p>
        <p>
          Access should be limited according to role. Authorized editors,
          moderators, administrators, and service providers may access
          information when needed for publishing, support, safety, or
          platform operations.
        </p>
      </PolicySection>

      <PolicySection title="Retention and account restrictions">
        <p>
          The intended approach is to retain account, submission, decision,
          and security records only as long as needed for the purposes above,
          dispute handling, abuse prevention, backups, and applicable legal
          obligations. Exact periods still need owner and legal approval.
        </p>
        <p>
          Access may be limited or suspended to protect users, editorial
          integrity, or platform security. Some records may need to remain
          after suspension or an account request so those protections can be
          maintained.
        </p>
      </PolicySection>

      <PolicySection title="Choices and contact">
        <p>
          The production notice must explain available access, correction,
          deletion, objection, and appeal options based on applicable law and
          the final account design.
        </p>
        <p>
          Privacy questions or requests can be directed to{" "}
          <ContactDetails />.
        </p>
        <p>
          The <Link href="/help">Help page</Link> lists the correction, safety,
          rights, and accessibility routes that are currently implemented.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
