"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect } from "react";

import {
  FieldShell,
  TextArea,
  TextInput,
} from "@/components/operations/field";
import {
  initialActionState,
  type ActionResult,
} from "@/lib/operations/action-result";
type EditableProfile = {
  readonly displayName: string;
  readonly biography: string;
  readonly location: string;
  readonly areasOfInterest: readonly string[];
};

type ProfileAction = (
  state: ActionResult,
  formData: FormData,
) => Promise<ActionResult>;

export function ProfileForm({
  action,
  profile,
}: {
  readonly action: ProfileAction;
  readonly profile: EditableProfile;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const errorFor = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success) {
      startTransition(() => router.refresh());
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="space-y-6">
      {!state.success && (state.formError || state.message) ? (
        <div
          role="alert"
          className="border border-rose-300/40 bg-rose-300/10 p-4 text-sm leading-6 text-rose-100"
        >
          {state.formError || state.message}
        </div>
      ) : null}
      {!state.success &&
      state.fieldErrors &&
      Object.keys(state.fieldErrors).length ? (
        <div
          role="alert"
          className="border border-rose-300/40 bg-rose-300/10 p-4 text-sm leading-6 text-rose-100"
        >
          <p className="font-bold">Review these profile fields:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {Object.entries(state.fieldErrors).flatMap(([field, errors]) =>
              errors.map((error) => (
                <li key={`${field}-${error}`}>{error}</li>
              )),
            )}
          </ul>
        </div>
      ) : null}
      {state.success ? (
        <p
          role="status"
          className="border border-sky-300/40 bg-sky-300/10 p-4 text-sm leading-6 text-sky-100"
        >
          {state.message}
        </p>
      ) : null}
      <FieldShell
        id="displayName"
        label="Display name"
        required
        error={errorFor("displayName")}
      >
        <TextInput
          id="displayName"
          name="displayName"
          defaultValue={profile.displayName}
          minLength={2}
          maxLength={80}
          required
          aria-invalid={Boolean(errorFor("displayName"))}
          aria-describedby={
            errorFor("displayName") ? "displayName-error" : undefined
          }
        />
      </FieldShell>
      <FieldShell
        id="biography"
        label="Short biography"
        description="A concise editorial introduction. It is not published automatically."
        error={errorFor("biography")}
      >
        <TextArea
          id="biography"
          name="biography"
          defaultValue={profile.biography}
          maxLength={1000}
          aria-invalid={Boolean(errorFor("biography"))}
          aria-describedby={errorFor("biography") ? "biography-error" : undefined}
        />
      </FieldShell>
      <FieldShell
        id="location"
        label="Public location"
        description="Use a city, region, or general training base—not a home address."
        error={errorFor("location")}
      >
        <TextInput
          id="location"
          name="location"
          defaultValue={profile.location}
          maxLength={120}
          aria-invalid={Boolean(errorFor("location"))}
          aria-describedby={errorFor("location") ? "location-error" : undefined}
        />
      </FieldShell>
      <FieldShell
        id="areasOfInterest"
        label="Areas of interest"
        description="One topic per line, up to 8. Examples: competition reporting, athlete profiles, or training culture."
        error={errorFor("areasOfInterest")}
      >
        <TextArea
          id="areasOfInterest"
          name="areasOfInterest"
          defaultValue={profile.areasOfInterest.join("\n")}
          aria-invalid={Boolean(errorFor("areasOfInterest"))}
          aria-describedby={
            errorFor("areasOfInterest") ? "areasOfInterest-error" : undefined
          }
        />
      </FieldShell>
      <button
        type="submit"
        disabled={pending}
        className="clip-corner inline-flex min-h-12 items-center justify-center bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Saving profile…" : "Save profile"}
      </button>
      <p aria-live="polite" className="text-xs text-muted">
        {pending ? "Server validation is in progress." : ""}
      </p>
    </form>
  );
}
