import type { Metadata } from "next";
import Link from "next/link";

import {
  PolicyPage,
  PolicySection,
} from "@/app/(site)/policy-page";
import { createPublicMetadata } from "@/lib/site/metadata";

const description =
  "How Cali Central scopes athlete, profile, result, social-account, and organizer verification without turning one badge into a blanket claim.";

export const metadata: Metadata = createPublicMetadata({
  path: "/verification",
  title: "Verification",
  description,
  socialTitle: "Verification at Cali Central",
});

export default function VerificationPage() {
  return (
    <PolicyPage
      eyebrow="Publication trust / Verification"
      title="What verification means"
      introduction="Verification at Cali Central is scoped to a specific identity connection, profile review, result, social account, or organizer record. One label never confirms everything about a person or event."
      statusLabel="Public trust guide"
      sidebarTitle="Read the label"
      sidebarText="A verification label applies only to the record beside it. Prototype, sample, submitted, and unverified material uses different language."
    >
      <PolicySection title="Five separate concepts">
        <dl className="space-y-6">
          <div>
            <dt className="font-bold text-on-light">Profile control confirmed</dt>
            <dd>
              Cali Central has reviewed evidence that the account controls or
              represents the claimed public profile. This is not government-ID
              or legal-identity verification.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-on-light">Profile approved</dt>
            <dd>
              An editor has approved the public profile for publication. It
              does not verify every biographical statement or performance.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-on-light">Result verified</dt>
            <dd>
              The individual result has sufficient published provenance, such
              as official event results or reviewed organizer material. The
              label belongs to that result, not the athlete&apos;s entire history.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-on-light">Social account confirmed</dt>
            <dd>
              A specific external profile has been connected to or confirmed
              for the athlete. Other accounts are not implied to be authentic.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-on-light">Organizer reviewed</dt>
            <dd>
              Cali Central has reviewed an organizer account or relationship.
              This does not endorse an event, ticket offer, or every statement
              the organizer publishes.
            </dd>
          </div>
        </dl>
      </PolicySection>

      <PolicySection title="Prototype and submitted material">
        <p>
          Fictional fallback profiles, sample standings, illustrative results,
          and prototype event records are not verified. Their prototype or
          sample notices take precedence over any adjacent presentation.
        </p>
        <p>
          User submissions are proposals. Submission, review, or approval for
          editorial development does not automatically publish or verify a
          claim.
        </p>
      </PolicySection>

      <PolicySection title="What Cali Central does not claim">
        <ul>
          <li>Legal identity verification or background screening.</li>
          <li>Governing-body authority for the sport.</li>
          <li>A blanket endorsement of an athlete, organizer, or event.</li>
          <li>World-record status without an appropriate authoritative source.</li>
          <li>Permanent accuracy when credible new evidence becomes available.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Corrections and disputes">
        <p>
          Athletes, organizers, sources, and readers can challenge a published
          detail or provide stronger evidence. The original public record is
          not overwritten directly by a public form.
        </p>
        <p>
          Read the <Link href="/corrections">corrections process</Link> or use
          the moderated account workflow to request a review.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
