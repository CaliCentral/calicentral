import type { Metadata } from "next";

import {
  OperationsNotice,
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import { SubmissionForm } from "@/components/operations/submission-form";
import { requireContributor } from "@/lib/auth";
import { createSubmissionAction } from "@/lib/operations/actions";
import { SUBMISSION_TYPES, type SubmissionType } from "@/lib/operations/types";
import { safeHttpUrlSchema } from "@/lib/operations/validation";
import { featureConfig } from "@/lib/features/config";
import {
  getAuthorizedMediaOrganizationIds,
  getAuthorizedProductOrganizationIds,
} from "@/lib/operations/submission-identities";

export const metadata: Metadata = {
  title: "New submission",
};

export const dynamic = "force-dynamic";

type NewSubmissionPageProps = {
  readonly searchParams: Promise<{
    affectedUrl?: string | string[];
    athlete?: string | string[];
    requestKind?: string | string[];
    type?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function initialSubmissionType(
  value: string | string[] | undefined,
): SubmissionType | undefined {
  const candidate = firstValue(value);

  return (SUBMISSION_TYPES as readonly string[]).includes(candidate ?? "")
    ? (candidate as SubmissionType)
    : undefined;
}

export default async function NewSubmissionPage({
  searchParams,
}: NewSubmissionPageProps) {
  const params = await searchParams;
  const submissionType = initialSubmissionType(params.type);
  const availableSubmissionType =
    submissionType &&
    ((submissionType === "teamApplication" &&
      !featureConfig.teamApplications) ||
      (submissionType === "organizationClaim" &&
        !featureConfig.organizationClaims) ||
      (submissionType === "videoSubmission" &&
        !featureConfig.videoSubmissions) ||
      (submissionType === "mediaPitch" && !featureConfig.mediaSubmissions) ||
      (submissionType === "productSubmission" &&
        !featureConfig.productSubmissions))
      ? undefined
      : submissionType;
  const requestKind =
    firstValue(params.requestKind) === "claim" ? "claim" : "create";
  const athleteCandidate = firstValue(params.athlete) ?? "";
  const athleteSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(athleteCandidate)
    ? athleteCandidate
    : undefined;
  const affectedUrlResult = safeHttpUrlSchema.safeParse(
    firstValue(params.affectedUrl) ?? "",
  );
  const affectedUrl = affectedUrlResult.success
    ? affectedUrlResult.data
    : undefined;
  const returnParams = new URLSearchParams();

  if (submissionType) {
    returnParams.set("type", submissionType);
  }
  if (availableSubmissionType === "athleteNomination") {
    returnParams.set("requestKind", requestKind);
    if (athleteSlug) {
      returnParams.set("athlete", athleteSlug);
    }
  }
  if (availableSubmissionType === "correctionRequest" && affectedUrl) {
    returnParams.set("affectedUrl", affectedUrl);
  }

  const returnPath = `/account/submissions/new${
    returnParams.size ? `?${returnParams.toString()}` : ""
  }`;
  const user = await requireContributor(returnPath);
  const [authorizedMediaOrganizationIds, authorizedProductOrganizationIds] =
    await Promise.all([
      featureConfig.videoSubmissions || featureConfig.mediaSubmissions
        ? getAuthorizedMediaOrganizationIds(user.id)
        : Promise.resolve([]),
      featureConfig.productSubmissions
        ? getAuthorizedProductOrganizationIds(user.id)
        : Promise.resolve([]),
    ]);
  const visibleSubmissionType =
    availableSubmissionType === "productSubmission" &&
    !authorizedProductOrganizationIds.length
      ? undefined
      : availableSubmissionType;
  const idempotencyKey = crypto.randomUUID();

  if (submissionType && !availableSubmissionType) {
    return (
      <OperationsPage
        eyebrow="Account / New submission"
        title="This submission type is currently unavailable"
        description="The requested intake is behind a server-controlled release flag. No different form has been substituted."
      >
        <OperationsNotice title="Intake closed" tone="warning">
          <p>
            Choose another available submission type from the general submission
            page, or return later when this workflow is open.
          </p>
        </OperationsNotice>
      </OperationsPage>
    );
  }

  if (
    submissionType === "productSubmission" &&
    !authorizedProductOrganizationIds.length
  ) {
    return (
      <OperationsPage
        eyebrow="Account / New submission"
        title="Verified organization access required"
        description="Product intake is available only to an active member with a reviewed organization capability."
      >
        <OperationsNotice title="Product intake unavailable" tone="warning">
          <p>
            No authorized product-submission organization is linked to this
            account.
          </p>
        </OperationsNotice>
      </OperationsPage>
    );
  }

  return (
    <OperationsPage
      eyebrow="Account / New submission"
      title="Start a structured submission"
      description="Save a private working draft or send complete information to the editorial desk. No file upload, automatic preview, or public publishing occurs."
    >
      <OperationsNotice title="Privacy and editorial notice" tone="warning">
        <p>
          Do not submit confidential information, private athlete contact
          details, home addresses, or credentials. Public claims must be
          verifiable before publication. A submission may be reviewed and
          edited, but does not guarantee publication.
        </p>
      </OperationsNotice>
      <OperationsPanel
        title="Submission form"
        description="Fields are validated again on the server. Drafts may be incomplete; review submissions must meet the full requirements."
        className="mt-6"
      >
        <SubmissionForm
          action={createSubmissionAction}
          authorizedMediaOrganizationIds={authorizedMediaOrganizationIds}
          authorizedProductOrganizationIds={authorizedProductOrganizationIds}
          idempotencyKey={idempotencyKey}
          initialAthleteRequestKind={requestKind}
          initialAthleteSlug={athleteSlug}
          initialCorrectionUrl={affectedUrl}
          initialSubmissionType={visibleSubmissionType}
          mediaSubmissionsEnabled={featureConfig.mediaSubmissions}
          mode="create"
          organizationClaimsEnabled={featureConfig.organizationClaims}
          productSubmissionsEnabled={featureConfig.productSubmissions}
          teamApplicationsEnabled={featureConfig.teamApplications}
          videoSubmissionsEnabled={featureConfig.videoSubmissions}
        />
      </OperationsPanel>
    </OperationsPage>
  );
}
