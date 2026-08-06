"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState } from "react";

import {
  FieldShell,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/operations/field";
import {
  athleteCompetitionCategories,
  athleteSpecialties,
} from "@/lib/athlete-taxonomy";
import {
  administrativeAreaLabel,
  countries,
  unitedStatesAdministrativeAreas,
} from "@/lib/geography";
import {
  initialActionState,
  type ActionResult,
} from "@/lib/operations/action-result";
import type {
  AthleteNominationDetails,
  CompetitionListingDetails,
  CorrectionRequestDetails,
  MediaPitchDetails,
  StoryPitchDetails,
  SubmissionDetails,
  SubmissionType,
  SupportingLink,
} from "@/lib/operations/types";

type OperationsAction = (
  state: ActionResult,
  formData: FormData,
) => Promise<ActionResult>;

type SubmissionFormProps = {
  readonly action: OperationsAction;
} & (
  | {
      readonly idempotencyKey: string;
      readonly initialAthleteRequestKind?: "create" | "claim";
      readonly initialAthleteSlug?: string;
      readonly initialCorrectionUrl?: string;
      readonly initialSubmissionType?: SubmissionType;
      readonly initialSubmission?: undefined;
      readonly mode: "create";
      readonly operationKey?: undefined;
    }
  | {
      readonly idempotencyKey?: undefined;
      readonly initialAthleteRequestKind?: undefined;
      readonly initialAthleteSlug?: undefined;
      readonly initialCorrectionUrl?: undefined;
      readonly initialSubmissionType?: undefined;
      readonly initialSubmission: SubmissionFormInitial;
      readonly mode: "edit";
      readonly operationKey: string;
    }
);

export type SubmissionFormInitial = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly details: string;
  readonly contributorNote: string;
  readonly supportingLinks: readonly SupportingLink[];
} & SubmissionDetails;

const submissionTypes: readonly {
  value: SubmissionType;
  label: string;
  description: string;
}[] = [
  {
    value: "storyPitch",
    label: "Story pitch",
    description: "A reported article, interview, analysis, or culture story.",
  },
  {
    value: "athleteNomination",
    label: "Athlete profile request",
    description: "Create or claim a profile through the moderated review queue.",
  },
  {
    value: "competitionListing",
    label: "Competition listing",
    description: "A proposed public event listing with organizer context.",
  },
  {
    value: "mediaPitch",
    label: "Media pitch",
    description: "A video, photo, or other visual editorial concept.",
  },
  {
    value: "correctionRequest",
    label: "Correction request",
    description: "A sourced correction to an existing public Cali Central page.",
  },
];

function listValue(values: readonly string[] | undefined) {
  return values?.join("\n") ?? "";
}

function linkValue(values: readonly SupportingLink[] | undefined) {
  return values?.map((link) => link.url).join("\n") ?? "";
}

export function SubmissionForm({
  action,
  idempotencyKey,
  initialAthleteRequestKind,
  initialAthleteSlug,
  initialCorrectionUrl,
  initialSubmissionType,
  initialSubmission,
  mode,
  operationKey,
}: SubmissionFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [submissionType, setSubmissionType] = useState<SubmissionType>(
    initialSubmission?.submissionType ?? initialSubmissionType ?? "storyPitch",
  );

  useEffect(() => {
    if (state.success && state.redirectTo) {
      startTransition(() => router.push(state.redirectTo!));
    } else if (state.success) {
      startTransition(() => router.refresh());
    }
  }, [router, state.redirectTo, state.success]);

  const errorFor = (name: string) => {
    const direct = state.fieldErrors?.[name]?.[0];
    if (direct) {
      return direct;
    }

    return Object.entries(state.fieldErrors ?? {}).find(([field]) =>
      field.endsWith(`.${name}`),
    )?.[1][0];
  };
  const describedBy = (name: string) =>
    errorFor(name) ? `${name}-error` : undefined;

  return (
    <form action={formAction} className="space-y-8">
      {mode === "create" ? (
        <input
          type="hidden"
          name="idempotencyKey"
          value={idempotencyKey}
        />
      ) : null}
      {mode === "edit" ? (
        <input type="hidden" name="operationKey" value={operationKey} />
      ) : null}
      {initialSubmission ? (
        <input type="hidden" name="submissionId" value={initialSubmission.id} />
      ) : null}

      {!state.success && (state.formError || state.message) ? (
        <div
          role="alert"
          className="border border-rose-300/40 bg-rose-300/10 p-4 text-sm leading-6 text-rose-100"
        >
          <p className="font-bold">The submission was not saved.</p>
          <p className="mt-1">{state.formError || state.message}</p>
        </div>
      ) : null}

      {!state.success &&
      state.fieldErrors &&
      Object.keys(state.fieldErrors).length ? (
        <div
          role="alert"
          className="border border-rose-300/40 bg-rose-300/10 p-4 text-sm leading-6 text-rose-100"
        >
          <p className="font-bold">Review these fields:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {Object.entries(state.fieldErrors).flatMap(([field, errors]) =>
              errors.map((error) => (
                <li key={`${field}-${error}`}>{error}</li>
              )),
            )}
          </ul>
        </div>
      ) : null}

      {state.success && state.message ? (
        <p
          role="status"
          className="border border-sky-300/40 bg-sky-300/10 p-4 text-sm leading-6 text-sky-100"
        >
          {state.message}
        </p>
      ) : null}

      <fieldset className="border border-white/15 bg-surface p-5 sm:p-7">
        <legend className="px-2 text-lg font-black uppercase tracking-[-0.02em] text-ink">
          1 / Submission type
        </legend>
        {mode === "create" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {submissionTypes.map((type) => (
              <label
                key={type.value}
                className="flex min-h-28 cursor-pointer gap-3 border border-white/15 p-4 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/[0.07]"
              >
                <input
                  type="radio"
                  name="submissionType"
                  value={type.value}
                  checked={submissionType === type.value}
                  onChange={() => setSubmissionType(type.value)}
                  className="mt-1 size-4 accent-[var(--accent)]"
                />
                <span>
                  <span className="block text-sm font-black uppercase tracking-[0.04em] text-ink">
                    {type.label}
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-muted">
                    {type.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <>
            <input type="hidden" name="submissionType" value={submissionType} />
            <p className="text-sm leading-6 text-muted">
              {submissionTypes.find((type) => type.value === submissionType)
                ?.label ?? "Submission"}
              . The type is fixed after the draft is created.
            </p>
          </>
        )}
      </fieldset>

      <fieldset className="border border-white/15 bg-surface p-5 sm:p-7">
        <legend className="px-2 text-lg font-black uppercase tracking-[-0.02em] text-ink">
          2 / Common information
        </legend>
        <div className="grid gap-6">
          <FieldShell
            id="title"
            label="Working title"
            description="5–140 characters are required before editorial review."
            required
            error={errorFor("title")}
          >
            <TextInput
              id="title"
              name="title"
              defaultValue={initialSubmission?.title}
              maxLength={140}
              required
              aria-invalid={Boolean(errorFor("title"))}
              aria-describedby={describedBy("title")}
            />
          </FieldShell>
          <FieldShell
            id="summary"
            label="Short summary"
            description="Explain the central idea in 20–500 characters."
            required
            error={errorFor("summary")}
          >
            <TextArea
              id="summary"
              name="summary"
              defaultValue={initialSubmission?.summary}
              maxLength={500}
              aria-invalid={Boolean(errorFor("summary"))}
              aria-describedby={describedBy("summary")}
              className="min-h-28"
            />
          </FieldShell>
          <FieldShell
            id="details"
            label="Full details"
            description="Plain text only. Include reporting context or factual specifics without confidential information."
            required
            error={errorFor("details")}
          >
            <TextArea
              id="details"
              name="details"
              defaultValue={initialSubmission?.details}
              maxLength={8000}
              aria-invalid={Boolean(errorFor("details"))}
              aria-describedby={describedBy("details")}
              className="min-h-52"
            />
          </FieldShell>
          <FieldShell
            id="contributorNote"
            label="Contributor note"
            description="Optional context for the editorial desk; do not include secrets or private contact data."
            error={errorFor("contributorNote")}
          >
            <TextArea
              id="contributorNote"
              name="contributorNote"
              defaultValue={initialSubmission?.contributorNote}
              maxLength={2000}
              aria-invalid={Boolean(errorFor("contributorNote"))}
              aria-describedby={describedBy("contributorNote")}
              className="min-h-28"
            />
          </FieldShell>
        </div>
      </fieldset>

      <fieldset className="border border-white/15 bg-surface p-5 sm:p-7">
        <legend className="px-2 text-lg font-black uppercase tracking-[-0.02em] text-ink">
          3 / Type-specific information
        </legend>
        {submissionType === "storyPitch" ? (
          <StoryPitchFields
            initial={
              initialSubmission?.submissionType === "storyPitch"
                ? initialSubmission.storyPitchDetails
                : undefined
            }
            errorFor={errorFor}
          />
        ) : null}
        {submissionType === "athleteNomination" ? (
          <AthleteFields
            initial={
              initialSubmission?.submissionType === "athleteNomination"
                ? initialSubmission.athleteNominationDetails
                : undefined
            }
            initialRequestKind={initialAthleteRequestKind}
            initialAthleteSlug={initialAthleteSlug}
            errorFor={errorFor}
          />
        ) : null}
        {submissionType === "competitionListing" ? (
          <CompetitionFields
            initial={
              initialSubmission?.submissionType === "competitionListing"
                ? initialSubmission.competitionListingDetails
                : undefined
            }
            errorFor={errorFor}
          />
        ) : null}
        {submissionType === "mediaPitch" ? (
          <MediaFields
            initial={
              initialSubmission?.submissionType === "mediaPitch"
                ? initialSubmission.mediaPitchDetails
                : undefined
            }
            errorFor={errorFor}
          />
        ) : null}
        {submissionType === "correctionRequest" ? (
          <CorrectionFields
            initial={
              initialSubmission?.submissionType === "correctionRequest"
                ? initialSubmission.correctionRequestDetails
                : undefined
            }
            initialAffectedUrl={initialCorrectionUrl}
            errorFor={errorFor}
          />
        ) : null}
      </fieldset>

      <fieldset className="border border-white/15 bg-surface p-5 sm:p-7">
        <legend className="px-2 text-lg font-black uppercase tracking-[-0.02em] text-ink">
          4 / Public supporting links
        </legend>
        <FieldShell
          id="supportingLinks"
          label="Supporting links"
          description="One complete http:// or https:// URL per line, up to 8. Links are validated but never fetched or previewed."
          error={errorFor("supportingLinks")}
        >
          <TextArea
            id="supportingLinks"
            name="supportingLinks"
            defaultValue={linkValue(initialSubmission?.supportingLinks)}
            aria-invalid={Boolean(errorFor("supportingLinks"))}
            aria-describedby={describedBy("supportingLinks")}
            placeholder={"https://example.com/source-one\nhttps://example.com/source-two"}
          />
        </FieldShell>
      </fieldset>

      {mode === "create" ? (
        <fieldset className="border border-amber-300/30 bg-amber-300/[0.06] p-5 sm:p-7">
          <legend className="px-2 text-lg font-black uppercase tracking-[-0.02em] text-amber-100">
            5 / Submission acknowledgement
          </legend>
          <label className="flex cursor-pointer gap-3 text-sm leading-6 text-muted">
            <input
              type="checkbox"
              name="termsAccepted"
              value="on"
              className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
              aria-describedby="terms-guidance"
            />
            <span>
              I have authority to submit this material, have not intentionally
              included confidential information, and understand that Cali
              Central may review and edit accepted material. Submission does not
              guarantee publication or transfer ownership.
            </span>
          </label>
          <p id="terms-guidance" className="mt-4 text-xs leading-5 text-amber-100/75">
            The acknowledgement is required to send for review. You may save an
            incomplete working draft without sending it.
          </p>
        </fieldset>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-white/15 pt-7">
        {mode === "create" ? (
          <>
            <button
              type="submit"
              name="intent"
              value="saveDraft"
              disabled={pending}
              className="inline-flex min-h-12 items-center justify-center border border-white/20 px-5 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save draft"}
            </button>
            <button
              type="submit"
              name="intent"
              value="submit"
              disabled={pending}
              className="clip-corner inline-flex min-h-12 items-center justify-center bg-accent px-5 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? "Submitting…" : "Submit for review"}
            </button>
          </>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="clip-corner inline-flex min-h-12 items-center justify-center bg-accent px-5 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Saving changes…" : "Save changes"}
          </button>
        )}
        <p aria-live="polite" className="text-xs leading-5 text-muted">
          {pending ? "Secure server validation is in progress." : "Nothing is published automatically."}
        </p>
      </div>
    </form>
  );
}

type FieldErrors = (name: string) => string | undefined;

function CompactField({
  name,
  label,
  initial,
  errorFor,
  required = false,
  type = "text",
  validationName,
}: {
  readonly name: string;
  readonly label: string;
  readonly initial?: string;
  readonly errorFor: FieldErrors;
  readonly required?: boolean;
  readonly type?: "text" | "date" | "url";
  readonly validationName?: string;
}) {
  const error = errorFor(validationName ?? name);
  return (
    <FieldShell id={name} label={label} required={required} error={error}>
      <TextInput
        id={name}
        name={name}
        type={type}
        defaultValue={initial}
        maxLength={type === "url" ? 2048 : 300}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
      />
    </FieldShell>
  );
}

function LongField({
  name,
  label,
  initial,
  errorFor,
  description,
  required = false,
}: {
  readonly name: string;
  readonly label: string;
  readonly initial?: string;
  readonly errorFor: FieldErrors;
  readonly description?: string;
  readonly required?: boolean;
}) {
  const error = errorFor(name);
  return (
    <FieldShell
      id={name}
      label={label}
      description={description}
      required={required}
      error={error}
    >
      <TextArea
        id={name}
        name={name}
        defaultValue={initial}
        maxLength={3000}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
      />
    </FieldShell>
  );
}

function StoryPitchFields({
  initial,
  errorFor,
}: {
  readonly initial?: StoryPitchDetails;
  readonly errorFor: FieldErrors;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <CompactField name="proposedHeadline" label="Proposed headline" initial={initial?.proposedHeadline} errorFor={errorFor} required />
      <CompactField name="section" label="Proposed section" initial={initial?.section} errorFor={errorFor} required />
      <div className="sm:col-span-2">
        <LongField name="pitchSummary" label="Pitch summary" initial={initial?.pitchSummary} errorFor={errorFor} required />
      </div>
      <div className="sm:col-span-2">
        <LongField name="reportingApproach" label="Reporting approach" initial={initial?.reportingApproach} errorFor={errorFor} required />
      </div>
      <LongField name="relevantPeople" label="Relevant people" description="One public name per line." initial={listValue(initial?.relevantPeople)} errorFor={errorFor} />
      <LongField name="relevantLocations" label="Relevant locations" description="One general location per line; no private addresses." initial={listValue(initial?.relevantLocations)} errorFor={errorFor} />
      <CompactField name="estimatedLength" label="Estimated length" initial={initial?.estimatedLength} errorFor={errorFor} />
      <div className="sm:col-span-2">
        <LongField name="conflictDisclosure" label="Conflict disclosure" initial={initial?.conflictDisclosure} errorFor={errorFor} />
      </div>
    </div>
  );
}

function AthleteFields({
  initial,
  initialRequestKind,
  initialAthleteSlug,
  errorFor,
}: {
  readonly initial?: AthleteNominationDetails;
  readonly initialRequestKind?: "create" | "claim";
  readonly initialAthleteSlug?: string;
  readonly errorFor: FieldErrors;
}) {
  const [requestKind, setRequestKind] = useState(
    initial?.requestKind ?? initialRequestKind ?? "create",
  );
  const [country, setCountry] = useState(initial?.country ?? "");
  const historyEntries = initial?.competitionHistory ?? [];
  const historyRowCount = Math.min(Math.max(3, historyEntries.length), 12);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <FieldShell
        id="requestKind"
        label="Profile request"
        required
        error={errorFor("requestKind")}
      >
        <SelectInput
          id="requestKind"
          name="requestKind"
          value={requestKind}
          onChange={(event) =>
            setRequestKind(event.target.value === "claim" ? "claim" : "create")
          }
        >
          <option value="create">Create a new athlete profile</option>
          <option value="claim">Claim an existing athlete profile</option>
        </SelectInput>
      </FieldShell>
      {requestKind === "claim" ? (
        <CompactField
          name="existingAthleteSlug"
          label="Existing profile slug"
          initial={initial?.existingAthleteSlug || initialAthleteSlug}
          errorFor={errorFor}
          required
        />
      ) : (
        <input type="hidden" name="existingAthleteSlug" value="" />
      )}
      <CompactField
        name="athleteName"
        label="Public athlete name"
        initial={initial?.athleteName}
        errorFor={errorFor}
        required
      />
      <CompactField
        name="displayName"
        label="Alternate display name"
        initial={initial?.displayName}
        errorFor={errorFor}
      />
      <FieldShell
        id="country"
        label="Country"
        required
        error={errorFor("country")}
      >
        <SelectInput
          id="country"
          name="country"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          required
        >
          <option value="">Select a country</option>
          {countries.map((option) => (
            <option key={option.code} value={option.name}>
              {option.name}
            </option>
          ))}
        </SelectInput>
      </FieldShell>
      {country === "United States" ? (
        <FieldShell
          id="administrativeArea"
          label="State or district"
          error={errorFor("administrativeArea")}
        >
          <SelectInput
            key={country}
            id="administrativeArea"
            name="administrativeArea"
            defaultValue={initial?.administrativeArea ?? ""}
          >
            <option value="">Not provided</option>
            {unitedStatesAdministrativeAreas.map((area) => (
              <option key={area.code} value={area.name}>
                {area.name}
              </option>
            ))}
          </SelectInput>
        </FieldShell>
      ) : (
        <CompactField
          key={country || "worldwide"}
          name="administrativeArea"
          label={administrativeAreaLabel(country)}
          initial={initial?.administrativeArea}
          errorFor={errorFor}
        />
      )}
      <CompactField
        name="city"
        label="Public city or training base"
        initial={initial?.city}
        errorFor={errorFor}
      />
      <FieldShell
        id="primaryCategory"
        label="Primary competition category"
        required
        error={errorFor("primaryCategory")}
      >
        <SelectInput
          id="primaryCategory"
          name="primaryCategory"
          defaultValue={initial?.primaryCategory ?? ""}
          required
        >
          <option value="">Select a category</option>
          {athleteCompetitionCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </SelectInput>
      </FieldShell>
      <FieldShell
        id="yearsActive"
        label="Years active"
        description="Optional public wording, such as 2019–present."
        error={errorFor("yearsActive")}
      >
        <TextInput
          id="yearsActive"
          name="yearsActive"
          defaultValue={initial?.yearsActive}
          maxLength={80}
        />
      </FieldShell>
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-bold uppercase tracking-[0.08em] text-ink">
          Specialties
        </legend>
        <p className="mt-1 text-xs leading-5 text-muted">
          Select every public specialty that applies. These are Cali Central
          directory labels, not universal governing-body classifications.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {athleteSpecialties.map((specialty) => (
            <label
              key={specialty.value}
              className="flex min-h-11 items-center gap-3 border border-white/15 px-3 py-2 text-sm text-ink"
            >
              <input
                type="checkbox"
                name="specialties"
                value={specialty.value}
                defaultChecked={initial?.specialties.includes(specialty.value)}
                className="size-4 accent-[var(--accent)]"
              />
              {specialty.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="sm:col-span-2">
        <LongField
          name="biography"
          label="Public biography"
          description="Do not include private contact information or a home address."
          initial={initial?.biography}
          errorFor={errorFor}
        />
      </div>
      <CompactField
        name="profileImageUrl"
        label="Profile image reference URL"
        type="url"
        initial={initial?.profileImageUrl}
        errorFor={errorFor}
      />
      <CompactField
        name="coverImageUrl"
        label="Cover image reference URL"
        type="url"
        initial={initial?.coverImageUrl}
        errorFor={errorFor}
      />
      <div className="sm:col-span-2">
        <LongField
          name="socialLinks"
          label="Public social profile links"
          description="One complete public http(s) profile URL per line, up to 8. Each account is reviewed separately."
          initial={linkValue(initial?.socialLinks)}
          errorFor={errorFor}
        />
      </div>
      {initial?.discipline ? (
        <CompactField
          name="discipline"
          label="Legacy discipline"
          initial={initial.discipline}
          errorFor={errorFor}
        />
      ) : (
        <input type="hidden" name="discipline" value="" />
      )}
      <CompactField
        name="relationshipToAthlete"
        label="Relationship to athlete"
        initial={initial?.relationshipToAthlete}
        errorFor={errorFor}
      />
      <div className="sm:col-span-2">
        <LongField
          name="nominationReason"
          label="Profile request reason"
          initial={initial?.nominationReason}
          errorFor={errorFor}
          required
        />
      </div>
      <FieldShell
        id="permissionStatus"
        label="Media permission status"
        error={errorFor("permissionStatus")}
      >
        <SelectInput
          id="permissionStatus"
          name="permissionStatus"
          defaultValue={initial?.permissionStatus ?? "unknown"}
        >
          <option value="unknown">Unknown</option>
          <option value="notRequested">Not requested</option>
          <option value="requested">Requested</option>
          <option value="confirmed">Confirmed</option>
          <option value="notApplicable">Not applicable</option>
        </SelectInput>
      </FieldShell>
      <div className="sm:col-span-2">
        <LongField
          name="publicReferenceLinks"
          label="Athlete reference links"
          description="One public http(s) evidence URL per line. General and athlete reference links are limited to 8 in total."
          initial={linkValue(initial?.publicReferenceLinks)}
          errorFor={errorFor}
        />
      </div>
      <div className="sm:col-span-2 border-t border-white/15 pt-6">
        <h3 className="text-sm font-black uppercase tracking-[0.08em] text-ink">
          Competition history for review
        </h3>
        <p className="mt-2 text-xs leading-5 text-muted">
          Add up to three records here. Submitted placements and scores remain
          unverified until an editor reviews public result evidence.
        </p>
        <div className="mt-4 space-y-4">
          {Array.from({ length: historyRowCount }, (_, index) => (
            <AthleteCompetitionHistoryFields
              key={historyEntries[index]?.key ?? index}
              index={index}
              initial={historyEntries[index]}
              errorFor={errorFor}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AthleteCompetitionHistoryFields({
  index,
  initial,
  errorFor,
}: {
  readonly index: number;
  readonly initial?: AthleteNominationDetails["competitionHistory"][number];
  readonly errorFor: FieldErrors;
}) {
  const errorPath = (field: string) => `competitionHistory.${index}.${field}`;

  return (
    <details
      open={index === 0 && Boolean(initial?.eventName)}
      className="border border-white/15 bg-canvas p-4"
    >
      <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.1em] text-ink">
        {initial?.eventName || `Competition entry ${index + 1}`}
      </summary>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <CompactField
          name={`competitionEventName${index}`}
          validationName={errorPath("eventName")}
          label="Competition"
          initial={initial?.eventName}
          errorFor={errorFor}
        />
        <CompactField
          name={`competitionOrganizer${index}`}
          validationName={errorPath("organizer")}
          label="Organizer"
          initial={initial?.organizer}
          errorFor={errorFor}
        />
        <CompactField
          name={`competitionDate${index}`}
          validationName={errorPath("date")}
          label="Date"
          type="date"
          initial={initial?.date}
          errorFor={errorFor}
        />
        <FieldShell
          id={`competitionCountry${index}`}
          label="Country"
          error={errorFor(errorPath("country"))}
        >
          <SelectInput
            id={`competitionCountry${index}`}
            name={`competitionCountry${index}`}
            defaultValue={initial?.country ?? ""}
          >
            <option value="">Select a country</option>
            {countries.map((option) => (
              <option key={option.code} value={option.name}>
                {option.name}
              </option>
            ))}
          </SelectInput>
        </FieldShell>
        <CompactField
          name={`competitionCity${index}`}
          validationName={errorPath("city")}
          label="City"
          initial={initial?.city}
          errorFor={errorFor}
        />
        <CompactField
          name={`competitionDivisionCategory${index}`}
          validationName={errorPath("divisionCategory")}
          label="Division or category"
          initial={initial?.divisionCategory}
          errorFor={errorFor}
        />
        <CompactField
          name={`competitionPlacement${index}`}
          validationName={errorPath("placement")}
          label="Placement"
          initial={initial?.placement}
          errorFor={errorFor}
        />
        <CompactField
          name={`competitionScore${index}`}
          validationName={errorPath("score")}
          label="Published score"
          initial={initial?.score}
          errorFor={errorFor}
        />
        <CompactField
          name={`competitionOfficialResultUrl${index}`}
          validationName={errorPath("officialResultUrl")}
          label="Official result URL"
          type="url"
          initial={initial?.officialResultUrl}
          errorFor={errorFor}
        />
        <CompactField
          name={`competitionEventUrl${index}`}
          validationName={errorPath("eventUrl")}
          label="Event URL"
          type="url"
          initial={initial?.eventUrl}
          errorFor={errorFor}
        />
        <div className="sm:col-span-2">
          <CompactField
            name={`competitionVideoUrl${index}`}
            validationName={errorPath("videoUrl")}
            label="Video URL"
            type="url"
            initial={initial?.videoUrl}
            errorFor={errorFor}
          />
        </div>
      </div>
    </details>
  );
}

function CompetitionFields({
  initial,
  errorFor,
}: {
  readonly initial?: CompetitionListingDetails;
  readonly errorFor: FieldErrors;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <CompactField name="eventName" label="Event name" initial={initial?.eventName} errorFor={errorFor} required />
      <CompactField name="city" label="City" initial={initial?.city} errorFor={errorFor} required />
      <CompactField name="proposedDate" label="Proposed date" type="date" initial={initial?.proposedDate} errorFor={errorFor} />
      <CompactField name="format" label="Competition format" initial={initial?.format} errorFor={errorFor} required />
      <LongField name="divisions" label="Divisions" description="One proposed division per line." initial={listValue(initial?.divisions)} errorFor={errorFor} />
      <CompactField name="organizerRelationship" label="Relationship to organizer" initial={initial?.organizerRelationship} errorFor={errorFor} />
      <FieldShell id="scheduleStatus" label="Schedule status" error={errorFor("scheduleStatus")}>
        <SelectInput id="scheduleStatus" name="scheduleStatus" defaultValue={initial?.scheduleStatus ?? "unconfirmed"}>
          <option value="unconfirmed">Unconfirmed</option>
          <option value="provisional">Provisional</option>
          <option value="confirmed">Confirmed by organizer</option>
        </SelectInput>
      </FieldShell>
      <div className="sm:col-span-2">
        <LongField name="publicReferenceLinks" label="Event reference links" description="One public http(s) URL per line, up to 8." initial={linkValue(initial?.publicReferenceLinks)} errorFor={errorFor} />
      </div>
    </div>
  );
}

function MediaFields({
  initial,
  errorFor,
}: {
  readonly initial?: MediaPitchDetails;
  readonly errorFor: FieldErrors;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <CompactField name="proposedTitle" label="Proposed title" initial={initial?.proposedTitle} errorFor={errorFor} required />
      <CompactField name="series" label="Proposed series" initial={initial?.series} errorFor={errorFor} />
      <CompactField name="format" label="Media format" initial={initial?.format} errorFor={errorFor} required />
      <CompactField name="subject" label="Subject" initial={initial?.subject} errorFor={errorFor} required />
      <CompactField name="location" label="Location" initial={initial?.location} errorFor={errorFor} />
      <CompactField name="estimatedDuration" label="Estimated duration" initial={initial?.estimatedDuration} errorFor={errorFor} />
      <FieldShell id="sourcePlatform" label="Source platform" error={errorFor("sourcePlatform")}>
        <SelectInput id="sourcePlatform" name="sourcePlatform" defaultValue={initial?.sourcePlatform ?? ""}>
          <option value="">Not selected</option>
          <option value="Cali Central">Cali Central</option>
          <option value="Instagram">Instagram</option>
          <option value="TikTok">TikTok</option>
          <option value="YouTube">YouTube</option>
          <option value="Facebook">Facebook</option>
          <option value="X">X</option>
          <option value="Threads">Threads</option>
          <option value="Website">Website</option>
        </SelectInput>
      </FieldShell>
      <CompactField name="sourceAccount" label="Source account" initial={initial?.sourceAccount} errorFor={errorFor} />
      <FieldShell id="mediaPermissionStatus" label="Your relationship to the media" error={errorFor("mediaPermissionStatus")}>
        <SelectInput id="mediaPermissionStatus" name="mediaPermissionStatus" defaultValue={initial?.mediaPermissionStatus ?? "unknown"}>
          <option value="unknown">Unknown / not stated</option>
          <option value="submitter-owned">I own this media</option>
          <option value="permission-confirmed">I have permission to submit it</option>
          <option value="public-reference-only">Public link for reference only</option>
        </SelectInput>
      </FieldShell>
      <CompactField name="originalPostUrl" label="Original public post URL" type="url" initial={initial?.originalPostUrl} errorFor={errorFor} />
      <div className="sm:col-span-2">
        <LongField name="visualApproach" label="Visual approach" initial={initial?.visualApproach} errorFor={errorFor} required />
      </div>
      <p className="sm:col-span-2 text-xs leading-5 text-muted">
        Keep the original platform and account visible. A public link is not a
        transfer of ownership, and all media remains subject to editorial
        review before publication.
      </p>
      <div className="sm:col-span-2">
        <LongField name="publicReferenceLinks" label="Media reference links" description="One public http(s) URL per line, up to 8." initial={linkValue(initial?.publicReferenceLinks)} errorFor={errorFor} />
      </div>
    </div>
  );
}

function CorrectionFields({
  initial,
  initialAffectedUrl,
  errorFor,
}: {
  readonly initial?: CorrectionRequestDetails;
  readonly initialAffectedUrl?: string;
  readonly errorFor: FieldErrors;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <CompactField name="affectedUrl" label="Affected public URL" type="url" initial={initial?.affectedUrl || initialAffectedUrl} errorFor={errorFor} required />
      </div>
      <div className="sm:col-span-2">
        <LongField name="issueSummary" label="Issue summary" initial={initial?.issueSummary} errorFor={errorFor} required />
      </div>
      <div className="sm:col-span-2">
        <LongField name="requestedCorrection" label="Requested correction" initial={initial?.requestedCorrection} errorFor={errorFor} required />
      </div>
      <CompactField name="relationshipToSubject" label="Relationship to subject" initial={initial?.relationshipToSubject} errorFor={errorFor} />
      <div className="sm:col-span-2">
        <LongField name="sourceLinks" label="Public source links" description="One public http(s) URL per line, up to 8." initial={linkValue(initial?.sourceLinks)} errorFor={errorFor} />
      </div>
    </div>
  );
}
