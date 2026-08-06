import type { Metadata } from "next";

import {
  OperationsNotice,
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import { SubmissionForm } from "@/components/operations/submission-form";
import { requireContributor } from "@/lib/auth";
import { createSubmissionAction } from "@/lib/operations/actions";

export const metadata: Metadata = {
  title: "New submission",
};

export const dynamic = "force-dynamic";

export default async function NewSubmissionPage() {
  await requireContributor("/account/submissions/new");
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
          mode="create"
        />
      </OperationsPanel>
    </OperationsPage>
  );
}
