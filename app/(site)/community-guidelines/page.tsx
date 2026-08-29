import type { Metadata } from "next";
import Link from "next/link";

import {
  PolicyPage,
  PolicySection,
} from "@/app/(site)/policy-page";
import { createPublicMetadata } from "@/lib/site/metadata";

export const metadata: Metadata = createPublicMetadata({
  path: "/community-guidelines",
  title: "Community guidelines",
  description:
    "Working conduct, safety, privacy, media-rights, and sporting-data guidance for Cali Central members.",
});

const guidelines = [
  [
    "Respect the person",
    "No harassment, hateful or demeaning attacks, credible threats, or targeted intimidation. Disagreement about the sport does not justify targeting a person.",
  ],
  [
    "Do not create danger",
    "Do not encourage dangerous acts, exploit an emergency, or use the community to coordinate unlawful harm. Cali Central is not an emergency service.",
  ],
  [
    "Represent identity honestly",
    "Do not impersonate an athlete, team, organization, organizer, brand, or Cali Central representative. A public profile is not proof of legal identity or ownership.",
  ],
  [
    "Protect personal information",
    "Do not publish private contact details, addresses, identity documents, private evidence, or other sensitive information about another person.",
  ],
  [
    "Keep sporting claims traceable",
    "Do not invent results, rankings, team relationships, event authority, product claims, or verification status. Use public sources and label uncertainty.",
  ],
  [
    "Credit work and respect rights",
    "Share only media you may link or publish, identify the creator where known, and respond to legitimate copyright, attribution, or media-rights concerns.",
  ],
  [
    "No fraud, spam, or manipulation",
    "Do not use deceptive links, scams, automated engagement, false commercial claims, or repeated content intended to overwhelm the field.",
  ],
] as const;

export default function CommunityGuidelinesPage() {
  return (
    <PolicyPage
      eyebrow="Community / Conduct and safety"
      title="Keep the field useful"
      introduction="These expectations apply to public member profiles, posts, comments, reposts, linked media, and other community participation. They complement the Terms and do not turn an unreviewed claim into a public fact."
      statusLabel="Working community standard"
      sidebarTitle="Context matters"
      sidebarText="A report starts a private review. It is not proof of a violation, and it does not automatically remove content or change a public sporting record."
    >
      <PolicySection title="Community rules">
        <ol className="space-y-6">
          {guidelines.map(([title, text], index) => (
            <li key={title}>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent-dark">
                Rule {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-lg font-black uppercase tracking-[-0.02em] text-on-light">
                {title}
              </h3>
              <p className="mt-2">{text}</p>
            </li>
          ))}
        </ol>
      </PolicySection>

      <PolicySection title="Report the right issue">
        <p>
          An active public member can use the Report control on a member
          profile, post, comment, or linked media item. The selected reason and
          optional details enter the private Trust &amp; Safety queue and are not
          displayed on the public target.
        </p>
        <p>
          Use the <Link href="/corrections">corrections process</Link> for a
          published athlete, team, competition, ranking, story, or video fact.
          Use the <Link href="/copyright">copyright and media-rights process</Link>{" "}
          for a rights concern. The <Link href="/help">Help page</Link> lists
          the contact routes that are actually configured.
        </p>
      </PolicySection>

      <PolicySection title="Review and outcomes">
        <p>
          Authorized editors can review reports privately, hide or restore
          community posts and comments, and resolve or dismiss a report. Those
          privileged decisions create an internal audit event. Routine likes,
          saves, follows, and posts are not presented as moderation decisions.
        </p>
        <p>
          Notice, appeal, retention, and account-restriction procedures still
          require owner and legal review before production launch. Read the{" "}
          <Link href="/terms">Terms draft</Link> and{" "}
          <Link href="/privacy">Privacy draft</Link> for the current boundaries.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
