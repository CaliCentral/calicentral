import type { Metadata } from "next";
import Link from "next/link";

import {
  PolicyPage,
  PolicySection,
} from "@/app/(site)/policy-page";
import { publicContactEmail } from "@/lib/site/config";
import { createPublicMetadata } from "@/lib/site/metadata";

const description =
  "Cali Central's owner-review process for copyright, attribution, permission, takedown, and linked-media concerns.";

const copyrightEmailHref = publicContactEmail
  ? `mailto:${publicContactEmail}?subject=${encodeURIComponent(
      "Copyright or takedown concern",
    )}`
  : undefined;

export const metadata: Metadata = createPublicMetadata({
  path: "/copyright",
  title: "Copyright and media rights",
  description,
  socialTitle: "Copyright and media rights | Cali Central",
});

export default function CopyrightPage() {
  return (
    <PolicyPage
      eyebrow="Platform trust / Rights concerns"
      title="Copyright and media rights"
      introduction="This owner-review process covers copyright, creator credit, permission, takedown, restoration, and linked-media concerns. It is not a claim that Cali Central has appointed a statutory copyright agent or completed a jurisdiction-specific notice process."
      sidebarTitle="Use the available route"
      sidebarText="A community report or configured public mailbox starts a private review. It does not guarantee removal, payment, or a particular legal outcome."
    >
      <PolicySection title="Community posts and linked media">
        <p>
          An active public member can use the Report control on the relevant
          post or media item and choose “Copyright or media rights.” The report
          reason and optional details enter the private Trust &amp; Safety queue.
          Do not post a rights complaint publicly as a comment.
        </p>
      </PolicySection>

      <PolicySection title="Information useful for review">
        <ul>
          <li>The exact Cali Central page or community target.</li>
          <li>A clear description of the work, credit, or permission at issue.</li>
          <li>A public source showing the original work when one is available.</li>
          <li>Your relationship to the work or authority to act for its owner.</li>
          <li>A safe way to request clarification without publishing private data.</li>
        </ul>
        <p>
          Do not send passwords, government identification, home addresses, or
          unrelated confidential material through a community report.
        </p>
      </PolicySection>

      <PolicySection title="Public contact status">
        {copyrightEmailHref && publicContactEmail ? (
          <p>
            Rights concerns can be sent to the configured public contact at{" "}
            <a href={copyrightEmailHref}>{publicContactEmail}</a>. This mail link
            opens the visitor&apos;s email application; the website does not claim
            that a notice was delivered or accepted.
          </p>
        ) : (
          <p>
            A public rights-contact mailbox is not configured. Members can use
            the relevant community Report control; no separate email or formal
            notice delivery is currently represented by this site.
          </p>
        )}
      </PolicySection>

      <PolicySection title="Takedown and restoration boundary">
        <p>
          Cali Central may inspect the referenced record, source, attribution,
          and available permission information; preserve an audit record; and
          restrict or restore community content when appropriate. A public
          editorial record changes only through the separate publishing process.
        </p>
        <p>
          See the <Link href="/community-guidelines">Community Guidelines</Link>,{" "}
          <Link href="/terms">Terms draft</Link>, or{" "}
          <Link href="/help">Help page</Link> for adjacent routes.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
