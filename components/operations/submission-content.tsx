import {
  safeExternalHostname,
  submissionTypeLabel,
} from "@/lib/presentation/operations";
import type {
  SubmissionBase,
  SupportingLink,
  TeamApplicationRosterEntry,
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
            <ContentField
              key={field.label}
              label={field.label}
              wide={field.wide}
              preserve
            >
              {field.value}
            </ContentField>
          ))}
        </dl>
      </section>
      {submission.submissionType === "teamApplication" ? (
        <PrivateTeamRoster
          entries={submission.teamApplicationDetails.proposedRoster}
        />
      ) : null}
      <LinkList
        title={
          typeSpecificLinks ? "General supporting links" : "Supporting links"
        }
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

function PrivateTeamRoster({
  entries,
}: {
  readonly entries: readonly TeamApplicationRosterEntry[];
}) {
  return (
    <section className="border-t border-white/10 pt-7">
      <h2 className="text-lg font-black uppercase tracking-[-0.02em] text-ink">
        Private proposed roster
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-amber-100/80">
        Protected intake data for the applicant and editorial review. These
        details never enter public team queries, and an entry is not a confirmed
        team membership.
      </p>
      {entries.length ? (
        <ol className="mt-5 space-y-4">
          {entries.map((entry, index) => (
            <li key={entry.key} className="border border-white/15 p-5">
              <h3 className="font-bold uppercase text-ink">
                {entry.name || `Roster entry ${index + 1}`}
              </h3>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <ContentField label="Role">
                  {entry.role || "Not added"}
                </ContentField>
                <ContentField label="Specialty">
                  {entry.specialty || "Not added"}
                </ContentField>
                <ContentField label="Roster status">
                  {entry.rosterStatus || "Not added"}
                </ContentField>
                <ContentField label="Consent status">
                  {entry.consentStatus || "Not added"}
                </ContentField>
                <ContentField label="Existing profile slug">
                  {entry.existingProfileSlug || "Not added"}
                </ContentField>
                <ContentField label="Relationship">
                  {entry.relationshipToTeam || "Not added"}
                </ContentField>
                <ContentField label="Private email">
                  {entry.privateEmail || "Not provided"}
                </ContentField>
                <ContentField label="Private phone">
                  {entry.privatePhone || "Not provided"}
                </ContentField>
              </dl>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-muted">
          No proposed roster entries were supplied.
        </p>
      )}
    </section>
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
    case "teamApplication":
      return {
        title: "Team public links",
        links: submission.teamApplicationDetails.socialLinks,
      };
    case "organizationClaim":
      return {
        title: "Organization claim evidence",
        links: submission.organizationClaimDetails.evidenceLinks,
      };
    case "videoSubmission":
    case "productSubmission":
      return null;
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
        <p className="mt-3 text-sm text-muted">
          No public links were supplied.
        </p>
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
        {
          label: "Proposed headline",
          value: detail.proposedHeadline || "Not added",
        },
        { label: "Section", value: detail.section || "Not added" },
        {
          label: "Pitch summary",
          value: detail.pitchSummary || "Not added",
          wide: true,
        },
        {
          label: "Reporting approach",
          value: detail.reportingApproach || "Not added",
          wide: true,
        },
        {
          label: "Relevant people",
          value: detail.relevantPeople.join(", ") || "None listed",
        },
        {
          label: "Relevant locations",
          value: detail.relevantLocations.join(", ") || "None listed",
        },
        {
          label: "Estimated length",
          value: detail.estimatedLength || "Not added",
        },
        {
          label: "Conflict disclosure",
          value: detail.conflictDisclosure || "None provided",
          wide: true,
        },
      ];
    }
    case "athleteNomination": {
      const detail = submission.athleteNominationDetails;
      return [
        { label: "Athlete", value: detail.athleteName || "Not added" },
        { label: "City / training base", value: detail.city || "Not added" },
        { label: "Discipline", value: detail.discipline || "Not added" },
        {
          label: "Nomination reason",
          value: detail.nominationReason || "Not added",
          wide: true,
        },
        {
          label: "Relationship",
          value: detail.relationshipToAthlete || "Not added",
        },
        {
          label: "Permission status",
          value: detail.permissionStatus || "Unknown",
        },
      ];
    }
    case "competitionListing": {
      const detail = submission.competitionListingDetails;
      return [
        { label: "Event", value: detail.eventName || "Not added" },
        { label: "City", value: detail.city || "Not added" },
        { label: "Proposed date", value: detail.proposedDate || "Not added" },
        { label: "Format", value: detail.format || "Not added" },
        {
          label: "Divisions",
          value: detail.divisions.join(", ") || "None listed",
        },
        {
          label: "Organizer relationship",
          value: detail.organizerRelationship || "Not added",
        },
        {
          label: "Schedule status",
          value: detail.scheduleStatus || "Not added",
        },
      ];
    }
    case "teamApplication": {
      const detail = submission.teamApplicationDetails;
      return [
        {
          label: "Proposed team",
          value: detail.proposedTeamName || "Not added",
        },
        {
          label: "Short name / code",
          value:
            [detail.shortName, detail.code].filter(Boolean).join(" / ") ||
            "Not added",
        },
        { label: "Team type", value: detail.teamType || "Not added" },
        {
          label: "Represented identity",
          value: detail.representedIdentity || "Not added",
        },
        {
          label: "Location",
          value:
            [detail.city, detail.administrativeArea, detail.country]
              .filter(Boolean)
              .join(", ") || "Not added",
        },
        { label: "Training base", value: detail.trainingBase || "Not added" },
        {
          label: "Proposed public description",
          value: detail.description || "Not added",
          wide: true,
        },
        {
          label: "Disciplines",
          value: detail.disciplines.join(", ") || "None listed",
        },
        {
          label: "Competition intentions",
          value: detail.competitionIntentions || "Not added",
          wide: true,
        },
        {
          label: "Brand colors",
          value:
            [detail.primaryColor, detail.secondaryColor, detail.accentColor]
              .filter(Boolean)
              .join(" / ") || "Not added",
        },
        {
          label: "Crest/logo reference",
          value: detail.crestReferenceUrl || "Not added",
          wide: true,
        },
        {
          label: "Wordmark reference",
          value: detail.wordmarkReferenceUrl || "Not added",
          wide: true,
        },
        {
          label: "Branding authority",
          value: detail.brandingPermissionAcknowledged
            ? "Acknowledged"
            : "Not acknowledged",
        },
        {
          label: "Private proposed roster",
          value: `${detail.proposedRoster.length} ${detail.proposedRoster.length === 1 ? "entry" : "entries"}; consent is reviewed separately.`,
        },
      ];
    }
    case "organizationClaim": {
      const detail = submission.organizationClaimDetails;
      return [
        {
          label: "Request",
          value:
            detail.requestKind === "claim"
              ? "Claim existing organization"
              : "Propose new organization",
        },
        {
          label: "Existing organization ID",
          value: detail.existingOrganizationId || "Not applicable",
        },
        {
          label: "Organization",
          value: detail.organizationName || "Not added",
        },
        { label: "Type", value: detail.organizationType || "Not added" },
        { label: "Country", value: detail.country || "Not added" },
        { label: "Website", value: detail.website || "Not added", wide: true },
        {
          label: "Relationship / authority",
          value: detail.relationshipToOrganization || "Not added",
          wide: true,
        },
        {
          label: "Requested capabilities",
          value: detail.requestedCapabilities.join(", ") || "None listed",
          wide: true,
        },
      ];
    }
    case "videoSubmission": {
      const detail = submission.videoSubmissionDetails;
      return [
        {
          label: "Submitting identity",
          value:
            detail.submittingIdentityType === "organization"
              ? `Approved organization · ${detail.submittingIdentityId}`
              : "Authenticated member account",
        },
        { label: "Video title", value: detail.videoTitle || "Not added" },
        {
          label: "Category / discipline",
          value:
            [detail.category, detail.discipline].filter(Boolean).join(" / ") ||
            "Not added",
        },
        {
          label: "Description",
          value: detail.description || "Not added",
          wide: true,
        },
        { label: "Source host", value: detail.sourceHost || "Not added" },
        {
          label: "Original public URL",
          value: detail.originalPublicUrl || "Not added",
          wide: true,
        },
        { label: "Creator", value: detail.creatorName || "Not added" },
        { label: "Source account", value: detail.sourceAccount || "Not added" },
        {
          label: "Submitter relationship",
          value: detail.submitterRelationship || "Not added",
          wide: true,
        },
        {
          label: "Rights declaration",
          value: detail.rightsDeclaration || "Not added",
        },
        {
          label: "Ownership / source declaration",
          value: detail.ownershipSourceDeclaration || "Not added",
          wide: true,
        },
        {
          label: "Featured athletes",
          value: detail.featuredAthletes.join(", ") || "None listed",
        },
        {
          label: "Featured teams",
          value: detail.featuredTeams.join(", ") || "None listed",
        },
        {
          label: "Organization ID",
          value: detail.organizationId || "None listed",
        },
        { label: "Competition", value: detail.competition || "None listed" },
        {
          label: "Event date / location",
          value:
            [detail.eventDate, detail.location].filter(Boolean).join(" / ") ||
            "Not added",
        },
        {
          label: "Thumbnail reference",
          value: detail.thumbnailReferenceUrl || "Not added",
          wide: true,
        },
        {
          label: "Content warnings",
          value: detail.contentWarnings.join(", ") || "None listed",
        },
        {
          label: "Editorial note",
          value: detail.editorialNote || "None provided",
          wide: true,
        },
      ];
    }
    case "mediaPitch": {
      const detail = submission.mediaPitchDetails;
      return [
        { label: "Media kind", value: detail.mediaKind || "Not added" },
        {
          label: "Submitting identity",
          value:
            detail.submittingIdentityType === "organization"
              ? `Approved organization · ${detail.submittingIdentityId}`
              : "Authenticated member account",
        },
        { label: "Proposed title", value: detail.proposedTitle || "Not added" },
        { label: "Series", value: detail.series || "Not added" },
        { label: "Format", value: detail.format || "Not added" },
        { label: "Subject", value: detail.subject || "Not added" },
        { label: "Location", value: detail.location || "Not added" },
        {
          label: "Visual approach",
          value: detail.visualApproach || "Not added",
          wide: true,
        },
        {
          label: "Estimated duration",
          value: detail.estimatedDuration || "Not added",
        },
        {
          label: "Source platform",
          value: detail.sourcePlatform || "Not added",
        },
        { label: "Source account", value: detail.sourceAccount || "Not added" },
        {
          label: "Original post URL",
          value: detail.originalPostUrl || "Not added",
          wide: true,
        },
        { label: "Creator credit", value: detail.creatorName || "Not added" },
        { label: "Caption", value: detail.caption || "Not added", wide: true },
        {
          label: "Image description",
          value: detail.altText || "Not added",
          wide: true,
        },
        {
          label: "Media relationship",
          value: detail.mediaPermissionStatus || "Unknown",
        },
      ];
    }
    case "productSubmission": {
      const detail = submission.productSubmissionDetails;
      return [
        {
          label: "Represented organization ID",
          value: detail.organizationId || "Not added",
        },
        { label: "Product", value: detail.productName || "Not added" },
        { label: "Category", value: detail.category || "Not added" },
        {
          label: "Product summary",
          value: detail.productSummary || "Not added",
          wide: true,
        },
        {
          label: "Standard product URL",
          value: detail.standardProductUrl || "Not added",
          wide: true,
        },
        {
          label: "Affiliate status",
          value: detail.affiliateRelationship || "None",
        },
        {
          label: "Affiliate URL",
          value: detail.affiliateUrl || "Not supplied",
          wide: true,
        },
        {
          label: "Submitter relationship",
          value: detail.submitterRelationship || "Not added",
          wide: true,
        },
        {
          label: "Commercial disclosure",
          value: detail.commercialDisclosure || "Not added",
          wide: true,
        },
      ];
    }
    case "correctionRequest": {
      const detail = submission.correctionRequestDetails;
      return [
        {
          label: "Affected URL",
          value: detail.affectedUrl || "Not added",
          wide: true,
        },
        {
          label: "Issue summary",
          value: detail.issueSummary || "Not added",
          wide: true,
        },
        {
          label: "Requested correction",
          value: detail.requestedCorrection || "Not added",
          wide: true,
        },
        {
          label: "Relationship to subject",
          value: detail.relationshipToSubject || "Not added",
        },
      ];
    }
  }
}
