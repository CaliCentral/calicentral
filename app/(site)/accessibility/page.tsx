import type { Metadata } from "next";

import {
  PolicyPage,
  PolicySection,
} from "@/app/(site)/policy-page";
import { publicContactEmail } from "@/lib/site/config";
import { createPublicMetadata } from "@/lib/site/metadata";

const description =
  "Cali Central's owner-review accessibility draft, including current design practices, known prototype limits, and a feedback route.";

export const metadata: Metadata = createPublicMetadata({
  path: "/accessibility",
  title: "Accessibility draft",
  description,
  socialTitle: "Accessibility draft | Cali Central",
});

export default function AccessibilityPage() {
  return (
    <PolicyPage
      eyebrow="Platform policy / Accessibility"
      title="Accessibility"
      introduction="Cali Central aims to make its reporting and platform features usable by as many people as possible. This owner-review draft describes the current approach without claiming formal conformance."
    >
      <PolicySection title="Current approach">
        <p>
          The site is being designed with keyboard access, visible focus
          states, semantic headings and landmarks, descriptive link text,
          text alternatives for meaningful images, and sufficient color
          contrast in mind.
        </p>
        <p>
          Layouts are intended to remain readable across viewport sizes and
          with text enlargement. Motion and media experiences should include
          appropriate controls and alternatives when those features are
          introduced.
        </p>
      </PolicySection>

      <PolicySection title="Prototype limitations">
        <p>
          The platform is still under active development. Some account,
          contribution, live-media, and administrative experiences are
          incomplete, and third-party tools may introduce additional
          barriers.
        </p>
        <p>
          No WCAG conformance level is claimed at this stage. Accessibility
          testing and remediation should continue before and after public
          launch.
        </p>
      </PolicySection>

      <PolicySection title="Feedback and assistance">
        <p>
          If something is difficult to use, include the page address, what
          you were trying to do, and the browser or assistive technology
          involved when you are comfortable sharing it.
        </p>
        <p>
          {publicContactEmail ? (
            <>
              Accessibility feedback can be sent to{" "}
              <a href={`mailto:${publicContactEmail}`}>
                {publicContactEmail}
              </a>
              .
            </>
          ) : (
            <>
              A public accessibility contact has not been configured. It
              will be added before this draft is approved for production.
            </>
          )}
        </p>
      </PolicySection>

      <PolicySection title="Ongoing work">
        <p>
          Accessibility is an ongoing product and editorial responsibility.
          Future reviews should include keyboard-only navigation, screen
          reader checks, zoom and reflow testing, contrast review, form error
          handling, captions or transcripts, and testing with disabled
          people.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
