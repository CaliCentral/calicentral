import type { Metadata } from "next";
import Link from "next/link";

import {
  PolicyPage,
  PolicySection,
} from "@/app/(site)/policy-page";
import { publicContactEmail } from "@/lib/site/config";
import { createPublicMetadata } from "@/lib/site/metadata";

const description =
  "Find the real Cali Central routes for corrections, community safety reports, rights concerns, accessibility feedback, and editorial submissions.";

export const metadata: Metadata = createPublicMetadata({
  path: "/help",
  title: "Help and contact",
  description,
  socialTitle: "Help and contact | Cali Central",
});

export default function HelpPage() {
  return (
    <PolicyPage
      eyebrow="Platform support / Start here"
      title="Help and contact"
      introduction="Choose the route that matches the issue. Each link below uses an existing account, moderation, or contact path; Cali Central does not show a success message unless a request has actually entered a workflow."
      statusLabel="Public help directory"
      sidebarTitle="No simulated delivery"
      sidebarText="There is no live chat or emergency service. If a public email is not configured, this page says so instead of pretending a message was sent."
    >
      <PolicySection title="Published facts and sporting records">
        <p>
          Use the <Link href="/corrections">corrections process</Link> for an
          athlete, team, competition, ranking, result, story, or video detail.
          Signed-in requests enter the private editorial submission workflow and
          do not overwrite a public record automatically.
        </p>
      </PolicySection>

      <PolicySection title="Community safety">
        <p>
          Review the <Link href="/community-guidelines">Community Guidelines</Link>.
          An active public member can open the relevant member profile, post,
          comment, or linked media item and use its Report control. Reports and
          optional details are private.
        </p>
        <p>
          Cali Central is not an emergency service. Contact the appropriate
          local emergency service if someone faces an immediate threat.
        </p>
      </PolicySection>

      <PolicySection title="Copyright and media rights">
        <p>
          Use the <Link href="/copyright">copyright and media-rights page</Link>{" "}
          before sending a concern. It explains the available community report
          path, the information useful for review, and whether a public email
          destination is currently configured.
        </p>
      </PolicySection>

      <PolicySection title="Editorial and platform submissions">
        <p>
          The protected <Link href="/account/submissions/new">new submission</Link>{" "}
          route accepts the submission types currently enabled for the signed-in
          account, including editorial, athlete, competition, team, organization,
          video, media, product, and correction proposals. Availability depends
          on the active feature and editorial-access settings.
        </p>
      </PolicySection>

      <PolicySection title="Accessibility, privacy, and general contact">
        <p>
          Read the <Link href="/accessibility">Accessibility draft</Link> or the{" "}
          <Link href="/privacy">Privacy draft</Link> before sharing unnecessary
          personal information.
        </p>
        {publicContactEmail ? (
          <p>
            The configured public contact is{" "}
            <a href={`mailto:${publicContactEmail}`}>{publicContactEmail}</a>.
            Email delivery and response timing are controlled by that mailbox,
            not by this website.
          </p>
        ) : (
          <p>
            A public contact mailbox is not configured. Use the applicable
            workflow above; general email delivery is unavailable until an
            owner-approved address is added.
          </p>
        )}
      </PolicySection>
    </PolicyPage>
  );
}
