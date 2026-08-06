import type { Metadata } from "next";

import {
  OperationsNotice,
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import { SubmissionForm } from "@/components/operations/submission-form";
import { requireContributor } from "@/lib/auth";
import { createSubmissionAction } from "@/lib/operations/actions";
import {
  SUBMISSION_TYPES,
  type SubmissionType,
} from "@/lib/operations/types";
import { safeHttpUrlSchema } from "@/lib/operations/validation";

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
  if (submissionType === "athleteNomination") {
    returnParams.set("requestKind", requestKind);
    if (athleteSlug) {
      returnParams.set("athlete", athleteSlug);
    }
  }
  if (submissionType === "correctionRequest" && affectedUrl) {
    returnParams.set("affectedUrl", affectedUrl);
  }

  const returnPath = `/account/submissions/new${
    returnParams.size ? `?${returnParams.toString()}` : ""
  }`;
  await requireContributor(returnPath);
  const idempotencyKey = crypto.randomUUID();

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
          idempotencyKey={idempotencyKey}
          initialAthleteRequestKind={requestKind}
          initialAthleteSlug={athleteSlug}
          initialCorrectionUrl={affectedUrl}
          initialSubmissionType={submissionType}
          mode="create"
        />
      </OperationsPanel>
    </OperationsPage>
  );
}
