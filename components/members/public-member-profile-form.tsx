import { ActionForm } from "@/components/operations/action-form";
import { updatePublicMemberProfileAction } from "@/lib/community/actions/members";
import type { OwnMemberProfile } from "@/lib/community/types";

const publicRoles = [
  "Fan",
  "Coach",
  "Organizer",
  "Photographer",
  "Videographer",
  "Creator",
  "Contributor",
  "Team manager",
] as const;
const socialPlatforms = [
  ["instagram", "Instagram"],
  ["youtube", "YouTube"],
  ["tiktok", "TikTok"],
  ["x", "X"],
  ["threads", "Threads"],
  ["facebook", "Facebook"],
  ["website", "Website"],
  ["discord", "Discord"],
] as const;

export function PublicMemberProfileForm({
  profile,
  authenticatedDisplayName,
}: {
  readonly profile: OwnMemberProfile | null;
  readonly authenticatedDisplayName: string;
}) {
  const socialByPlatform = new Map(
    profile?.socialAccounts.map((account) => [account.platform, account.url]),
  );
  return (
    <ActionForm
      action={updatePublicMemberProfileAction}
      submitLabel={profile ? "Save public profile" : "Create member profile"}
      pendingLabel="Saving profile…"
      onSuccess="redirect"
    >
      <input type="hidden" name="returnTo" value="/account/profile" />
      {profile?.linkedAthleteId ? (
        <div className="mb-6 border border-accent/35 bg-accent/8 p-4 text-sm leading-6 text-ink">
          <strong className="block font-mono text-xs uppercase tracking-[0.11em] text-accent">
            Approved athlete connection
          </strong>
          Your avatar, cover, biography, website, and social links remain
          self-managed here and are available from the linked athlete page.
          Rankings, results, provider identities, provenance, and verification
          remain editorial/source controlled.
        </div>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Handle" hint="Public URL: /members/handle">
          <input
            name="handle"
            required
            minLength={3}
            maxLength={32}
            pattern="[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?"
            defaultValue={profile?.handle ?? ""}
            autoComplete="off"
            className={inputClass}
          />
        </Field>
        <Field label="Public display name">
          <input
            name="displayName"
            required
            maxLength={100}
            defaultValue={profile?.displayName ?? authenticatedDisplayName}
            className={inputClass}
          />
        </Field>
        <Field label="Public biography" className="sm:col-span-2">
          <textarea
            name="biography"
            maxLength={500}
            rows={5}
            defaultValue={profile?.biography ?? ""}
            className={`${inputClass} resize-y py-3`}
          />
        </Field>
        <Field
          label="Avatar URL"
          hint="Only approved image hosts render; direct uploads remain unavailable."
        >
          <input
            type="url"
            name="avatarUrl"
            maxLength={2000}
            defaultValue={profile?.avatarUrl ?? ""}
            className={inputClass}
          />
        </Field>
        <Field
          label="Cover image URL"
          hint="Only approved Cali Central, GitHub, or Google image hosts render."
        >
          <input
            type="url"
            name="coverImageUrl"
            maxLength={2000}
            defaultValue={profile?.coverImageUrl ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="City">
          <input name="city" maxLength={100} defaultValue={profile?.city ?? ""} className={inputClass} />
        </Field>
        <Field label="State / region">
          <input
            name="administrativeArea"
            maxLength={100}
            defaultValue={profile?.administrativeArea ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Country">
          <input name="country" maxLength={80} defaultValue={profile?.country ?? ""} className={inputClass} />
        </Field>
        <Field label="Preferred timezone" hint="Private account setting, for example America/Chicago.">
          <input name="preferredTimeZone" maxLength={64} defaultValue={profile?.preferredTimeZone ?? ""} className={inputClass} autoComplete="off" />
        </Field>
        <Field label="Interests" hint="Comma-separated, up to 30.">
          <input name="interests" defaultValue={profile?.interests.join(", ") ?? ""} className={inputClass} />
        </Field>
        <Field label="Disciplines" hint="Comma-separated, up to 30." className="sm:col-span-2">
          <input name="disciplines" defaultValue={profile?.disciplines.join(", ") ?? ""} className={inputClass} />
        </Field>
      </div>

      <fieldset className="mt-7 border-t border-white/12 pt-5">
        <legend className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/55">
          Public role labels
        </legend>
        <p className="mt-2 text-xs leading-5 text-muted">
          Self-described community roles are not identity verification or
          control of an athlete/team file.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {publicRoles.map((role) => (
            <label key={role} className="flex min-h-11 items-center gap-3 border border-white/12 px-3 text-sm text-ink/85">
              <input
                type="checkbox"
                name="publicRoles"
                value={role}
                defaultChecked={profile?.publicRoles.includes(role)}
                className="size-4 accent-[var(--color-accent)]"
              />
              {role}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-7 border-t border-white/12 pt-5">
        <legend className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/55">
          Public social links
        </legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {socialPlatforms.map(([platform, label]) => (
            <Field key={platform} label={label}>
              <input
                type="url"
                name={`social_${platform}`}
                maxLength={2000}
                defaultValue={socialByPlatform.get(platform) ?? ""}
                placeholder="https://…"
                className={inputClass}
              />
            </Field>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-7 border-t border-white/12 pt-5">
        <legend className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/55">
          Publication and privacy
        </legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <PrivacyCheckbox
            name="profilePublic"
            label="Publish my member profile"
            defaultChecked={profile?.profilePublic ?? false}
          />
          <PrivacyCheckbox
            name="discoverable"
            label="Allow public discovery/index eligibility"
            defaultChecked={profile?.discoverable ?? false}
          />
          <PrivacyCheckbox
            name="showLocation"
            label="Show my public location"
            defaultChecked={profile?.showLocation ?? false}
          />
          <PrivacyCheckbox
            name="showSocialAccounts"
            label="Show my social links"
            defaultChecked={profile?.showSocialAccounts ?? false}
          />
          <PrivacyCheckbox
            name="showMedia"
            label="Show my public Media tab"
            defaultChecked={profile?.showMedia ?? false}
          />
        </div>
      </fieldset>
    </ActionForm>
  );
}

const inputClass =
  "mt-2 min-h-12 w-full border border-white/15 bg-canvas px-3 text-sm text-ink focus:border-accent focus:outline-none";

function Field({
  label,
  hint,
  className = "",
  children,
}: {
  readonly label: string;
  readonly hint?: string;
  readonly className?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white/55">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-5 text-muted">{hint}</span> : null}
    </label>
  );
}

function PrivacyCheckbox({
  name,
  label,
  defaultChecked,
}: {
  readonly name: string;
  readonly label: string;
  readonly defaultChecked: boolean;
}) {
  return (
    <label className="flex min-h-12 items-start gap-3 border border-white/12 p-3 text-sm leading-6 text-ink/85">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 size-4 accent-[var(--color-accent)]"
      />
      {label}
    </label>
  );
}
