import type { Metadata } from "next";
import Link from "next/link";

import {
  PolicyPage,
  PolicySection,
} from "@/app/(site)/policy-page";
import { createPublicMetadata } from "@/lib/site/metadata";

const description =
  "How to request a factual correction to a Cali Central athlete, competition, result, story, or media record.";
const correctionReturnPath =
  "/account/submissions/new?type=correctionRequest";
const correctionSignInHref = `/sign-in?callbackUrl=${encodeURIComponent(
  correctionReturnPath,
)}`;

export const metadata: Metadata = createPublicMetadata({
  path: "/corrections",
  title: "Corrections",
  description,
  socialTitle: "Corrections at Cali Central",
});

export default function CorrectionsPage() {
  return (
    <PolicyPage
      eyebrow="Publication trust / Corrections"
      title="Request a correction"
      introduction="Cali Central welcomes sourced corrections to athlete profiles, competition information, results, stories, and media records. Requests enter moderation and never overwrite published content automatically."
      statusLabel="Public corrections process"
      sidebarTitle="Truth over activity"
      sidebarText="A slower, sourced correction is more useful than an immediate unsourced change. Private moderation notes remain private."
    >
      <PolicySection title="What to include">
        <ul>
          <li>The complete Cali Central page address.</li>
          <li>A concise explanation of what appears to be incorrect.</li>
          <li>The exact correction being requested.</li>
          <li>Public source links or organizer-published evidence.</li>
          <li>Your relationship to the athlete, event, or source when relevant.</li>
        </ul>
        <p>
          Do not submit government identification, private addresses, private
          phone numbers, credentials, or confidential athlete information.
        </p>
      </PolicySection>

      <PolicySection title="Moderated review">
        <ol className="ml-5 list-decimal space-y-3">
          <li>A signed-in account creates a private correction request.</li>
          <li>An editor reviews the affected record and supplied sources.</li>
          <li>The editor may request clarification, approve development, or reject the request.</li>
          <li>Any public change is made through the editorial publishing system.</li>
        </ol>
        <p>
          Approval in the intake queue means accepted for editorial
          development. It does not itself change, publish, or verify a public
          record.
        </p>
      </PolicySection>

      <PolicySection title="Start a request">
        <p>
          The existing account and submission system keeps requests private,
          preserves review status, and separates contributor-visible feedback
          from internal notes.
        </p>
        <Link
          href={correctionSignInHref}
          className="inline-flex min-h-12 items-center gap-3 bg-accent-dark px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white no-underline transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-dark"
        >
          Sign in to request a correction
          <span aria-hidden="true">→</span>
        </Link>
      </PolicySection>

      <PolicySection title="Disputes and updates">
        <p>
          Competing claims may require additional sourcing and may remain
          unresolved. Cali Central may add a public update or correction note
          when context is material, while retaining appropriate audit history.
        </p>
        <p>
          See <Link href="/verification">what verification means</Link> and the{" "}
          <Link href="/editorial-standards">editorial standards</Link> for the
          distinction between reporting, submitted material, and editorial
          selection.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
