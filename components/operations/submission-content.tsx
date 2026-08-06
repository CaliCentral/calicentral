import {
  safeExternalHostname,
  submissionTypeLabel,
} from "@/lib/presentation/operations";
import type {
  SubmissionBase,
  SupportingLink,
} from "@/lib/operations/types";

type SubmissionContentProps = {
  readonly submission: SubmissionBase;
};

export function SubmissionContent({ submission }: SubmissionContentProps) {
  const typeFields = getTypeFields(submission);
  const typeSpecificLinks = getTypeSpecificLinks(submission);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-black uppercase tracking-[-0.02em] text-ink">
          Common information
        </h2>
        <dl className="mt-4 grid gap-5 sm:grid-cols-2">
          <ContentField label="Submission type">
            {submissionTypeLabel(submission.submissionType)}
          </ContentField>
          <ContentField label="Working title">{submission.title}</ContentField>
          <ContentField label="Summary" wide>
            {submission.summary || "Not added"}
          </ContentField>
          <ContentField label="Full details" wide preserve>
            {submission.details || "Not added"}
          </ContentField>
          <ContentField label="Contributor note" wide preserve>
            {submission.contributorNote || "No additional note"}
          </ContentField>
        </dl>
      </section>
      <section className="border-t border-white/10 pt-7">
        <h2 className="text-lg font-black uppercase tracking-[-0.02em] text-ink">
          Type-specific information
        </h2>
        <dl className="mt-4 grid gap-5 sm:grid-cols-2">
          {typeFields.map((field) => (
            <ContentField key={field.label} label={field.label} wide={field.wide} preserve>
              {field.value}
            </ContentField>
          ))}
        </dl>
      </section>
      <LinkList
        title={typeSpecificLinks ? "General supporting links" : "Supporting links"}
        links={submission.supportingLinks}
      />
      {typeSpecificLinks ? (
        <LinkList
          title={typeSpecificLinks.title}
          links={typeSpecificLinks.links}
        />
      ) : null}
    </div>
  );
}

function getTypeSpecificLinks(
  submission: SubmissionBase,
): { title: string; links: readonly SupportingLink[] } | null {
  switch (submission.submissionType) {
    case "athleteNomination":
      return {
        title: "Athlete reference links",
        links: submission.athleteNominationDetails.publicReferenceLinks,
      };
    case "competitionListing":
      return {
        title: "Competition reference links",
        links: submission.competitionListingDetails.publicReferenceLinks,
      };
    case "mediaPitch":
      return {
        title: "Media reference links",
        links: submission.mediaPitchDetails.publicReferenceLinks,
      };
    case "correctionRequest":
      return {
        title: "Correction source links",
        links: submission.correctionRequestDetails.sourceLinks,
      };
    case "storyPitch":
      return null;
  }
}

function ContentField({
  label,
  children,
  wide = false,
  preserve = false,
}: {
  readonly label: string;
  readonly children: string | number;
  readonly wide?: boolean;
  readonly preserve?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
        {label}
      </dt>
      <dd
        className={`mt-2 break-words text-sm leading-6 text-ink ${
          preserve ? "whitespace-pre-wrap" : ""
        }`}
      >
        {children}
      </dd>
    </div>
  );
}

function LinkList({
  title,
  links,
}: {
  readonly title: string;
  readonly links: readonly SupportingLink[];
}) {
  return (
    <section className="border-t border-white/10 pt-7">
      <h2 className="text-lg font-black uppercase tracking-[-0.02em] text-ink">
        {title}
      </h2>
      {links.length ? (
        <ul className="mt-4 space-y-3">
          {links.map((link) => (
            <li key={link.key}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-white/15 p-4 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span className="block break-words text-sm font-bold text-ink">
                  {link.label || safeExternalHostname(link.url)}
                </span>
                <span className="mt-1 block break-all font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted">
                  {link.domain || safeExternalHostname(link.url)} · Opens in a
                  new tab
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">No public links were supplied.</p>
      )}
    </section>
  );
}

function getTypeFields(
  submission: SubmissionBase,
): { label: string; value: string; wide?: boolean }[] {
  switch (submission.submissionType) {
    case "storyPitch": {
      const detail = submission.storyPitchDetails;
      return [
        { label: "Proposed headline", value: detail.proposedHeadline || "Not added" },
        { label: "Section", value: detail.section || "Not added" },
        { label: "Pitch summary", value: detail.pitchSummary || "Not added", wide: true },
        { label: "Reporting approach", value: detail.reportingApproach || "Not added", wide: true },
        { label: "Relevant people", value: detail.relevantPeople.join(", ") || "None listed" },
        { label: "Relevant locations", value: detail.relevantLocations.join(", ") || "None listed" },
        { label: "Estimated length", value: detail.estimatedLength || "Not added" },
        { label: "Conflict disclosure", value: detail.conflictDisclosure || "None provided", wide: true },
      ];
    }
    case "athleteNomination": {
      const detail = submission.athleteNominationDetails;
      return [
        { label: "Athlete", value: detail.athleteName || "Not added" },
        { label: "City / training base", value: detail.city || "Not added" },
        { label: "Discipline", value: detail.discipline || "Not added" },
        { label: "Nomination reason", value: detail.nominationReason || "Not added", wide: true },
        { label: "Relationship", value: detail.relationshipToAthlete || "Not added" },
        { label: "Permission status", value: detail.permissionStatus || "Unknown" },
      ];
    }
    case "competitionListing": {
      const detail = submission.competitionListingDetails;
      return [
        { label: "Event", value: detail.eventName || "Not added" },
        { label: "City", value: detail.city || "Not added" },
        { label: "Proposed date", value: detail.proposedDate || "Not added" },
        { label: "Format", value: detail.format || "Not added" },
        { label: "Divisions", value: detail.divisions.join(", ") || "None listed" },
        { label: "Organizer relationship", value: detail.organizerRelationship || "Not added" },
        { label: "Schedule status", value: detail.scheduleStatus || "Not added" },
      ];
    }
    case "mediaPitch": {
      const detail = submission.mediaPitchDetails;
      return [
        { label: "Proposed title", value: detail.proposedTitle || "Not added" },
        { label: "Series", value: detail.series || "Not added" },
        { label: "Format", value: detail.format || "Not added" },
        { label: "Subject", value: detail.subject || "Not added" },
        { label: "Location", value: detail.location || "Not added" },
        { label: "Visual approach", value: detail.visualApproach || "Not added", wide: true },
        { label: "Estimated duration", value: detail.estimatedDuration || "Not added" },
      ];
    }
    case "correctionRequest": {
      const detail = submission.correctionRequestDetails;
      return [
        { label: "Affected URL", value: detail.affectedUrl || "Not added", wide: true },
        { label: "Issue summary", value: detail.issueSummary || "Not added", wide: true },
        { label: "Requested correction", value: detail.requestedCorrection || "Not added", wide: true },
        { label: "Relationship to subject", value: detail.relationshipToSubject || "Not added" },
      ];
    }
  }
}
