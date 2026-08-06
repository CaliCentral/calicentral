import type { Metadata } from "next";
import Link from "next/link";

import {
  PolicyPage,
  PolicySection,
} from "@/app/(site)/policy-page";
import { createPublicMetadata } from "@/lib/site/metadata";

const description =
  "Cali Central's working standards for reporting, editorial selections, sourced results, submitted material, corrections, and commercial disclosures.";

export const metadata: Metadata = createPublicMetadata({
  path: "/editorial-standards",
  title: "Editorial standards",
  description,
  socialTitle: "Editorial standards | Cali Central",
});

export default function EditorialStandardsPage() {
  return (
    <PolicyPage
      eyebrow="Publication trust / Editorial standards"
      title="How the record is built"
      introduction="Cali Central separates independent reporting, editorial selection, sourced results, submitted material, and commercial relationships so readers can understand what they are seeing."
      statusLabel="Working publication standard"
      sidebarTitle="A visible distinction"
      sidebarText="Labels, sources, prototype notices, and disclosures should make the status of important information understandable without relying on color alone."
    >
      <PolicySection title="Reporting">
        <p>
          Reporting should identify and test central factual claims, seek
          relevant context, distinguish observation from inference, and name
          public sources when doing so is responsible. Uncertainty should be
          stated rather than filled with invented detail.
        </p>
      </PolicySection>

      <PolicySection title="Editorial selection is not a ranking">
        <p>
          Features such as “Athletes to Watch” reflect editorial judgment.
          They are not standings, official rankings, governing-body decisions,
          or universal claims about the best athletes in the world.
        </p>
      </PolicySection>

      <PolicySection title="Results and provenance">
        <p>
          A verified-result label belongs to an individual result with
          credible supporting provenance. Important result records should show
          a useful public source without exposing private evidence or moderator
          notes.
        </p>
        <p>
          Cali Central does not convert sample data, submitted performances, or
          unreviewed social posts into official standings or world records.
          Read more about <Link href="/verification">verification labels</Link>.
        </p>
      </PolicySection>

      <PolicySection title="Submitted and third-party material">
        <p>
          A submission is a proposal, not a public fact. Editorial review may
          verify, edit, decline, or request changes before any separate public
          document is created and published.
        </p>
        <p>
          External video, social posts, registration pages, ticket pages, and
          organizer sites should retain visible attribution. Linking does not
          imply that Cali Central owns or endorses third-party material.
        </p>
      </PolicySection>

      <PolicySection title="Sponsored and affiliate content">
        <p>
          A commercial relationship must be disclosed clearly where it affects
          a page or link. Ordinary external links must not be silently rewritten
          as affiliate links, and payment must not be presented as independent
          verification.
        </p>
      </PolicySection>

      <PolicySection title="Corrections, privacy, and minors">
        <p>
          Credible corrections should be reviewed against the public record and
          its sources. Cali Central avoids unnecessary sensitive information,
          does not request government identification through public intake, and
          takes a conservative approach to information about minors.
        </p>
        <p>
          Use the <Link href="/corrections">corrections process</Link> to report
          an error. Legal and privacy terms remain separately documented in the{" "}
          <Link href="/privacy">privacy notice draft</Link> and{" "}
          <Link href="/terms">terms draft</Link>.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
