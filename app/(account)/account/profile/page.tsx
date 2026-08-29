import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ProfileForm } from "@/components/operations/profile-form";
import { PublicMemberProfileForm } from "@/components/members/public-member-profile-form";
import {
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import { StatusLabel } from "@/components/operations/status-label";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getCommunityRepository } from "@/lib/community/runtime";
import { featureConfig } from "@/lib/features/config";
import { updateContributorProfileAction } from "@/lib/operations/actions";
import { getOwnContributorProfile } from "@/lib/operations/contributors";
import { formatOperationsDate } from "@/lib/presentation/operations";

export const metadata: Metadata = {
  title: "Account profiles",
};

export default async function ContributorProfilePage() {
  const user = await requireAuthenticatedUser("/account/profile");

  if (user.accessStatus === "suspended" || user.accessStatus === "archived") {
    redirect(`/account/access?status=${user.accessStatus}`);
  }

  const profile = await getOwnContributorProfile(user.id);

  if (!profile) {
    notFound();
  }

  const communityRepository = featureConfig.community
    ? await getCommunityRepository()
    : null;
  const memberProfile = communityRepository?.availability.writable
    ? await communityRepository.getMemberProfileByPrincipalId(user.id)
    : null;

  return (
    <OperationsPage
      eyebrow="Account / Profile"
      title="Account profiles"
      description="Keep private contributor information separate from the optional public identity used in community conversations."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,0.4fr)]">
        <OperationsPanel
          title="Editable profile"
          description="Role, access, email, avatar, and CMS relationships cannot be changed from this form."
        >
          <ProfileForm
            action={updateContributorProfileAction}
            profile={{
              displayName: profile.displayName,
              biography: profile.biography,
              location: profile.location,
              areasOfInterest: profile.areasOfInterest,
            }}
          />
        </OperationsPanel>
        <OperationsPanel
          title="Authenticated record"
          description="Read-only identity and editorial-link status."
        >
          <dl className="space-y-5">
            <ReadOnlyRow label="Authenticated email" value={profile.normalizedEmail} />
            <div>
              <dt className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
                Role
              </dt>
              <dd className="mt-2">
                <StatusLabel kind="role" value={user.role} />
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
                Access
              </dt>
              <dd className="mt-2">
                <StatusLabel kind="access" value={profile.accessStatus} />
              </dd>
            </div>
            <ReadOnlyRow
              label="Contributor since"
              value={formatOperationsDate(profile.contributorSince)}
            />
            <ReadOnlyRow
              label="Linked public author"
              value={profile.linkedAuthorId ? "Linked by an editor" : "Not linked"}
            />
            <ReadOnlyRow
              label="Linked public athlete"
              value={profile.linkedAthleteId ? "Linked by an editor" : "Not linked"}
            />
          </dl>
        </OperationsPanel>
      </div>
      {featureConfig.community ? (
        <section id="public-member-profile" className="mt-10 scroll-mt-8">
          <OperationsPanel
            title="Public member profile"
            description="This is an explicit public projection for community posts. Contributor biography, authenticated email, access, submissions, and private team intake are never copied into it automatically."
          >
            {communityRepository?.availability.writable ? (
              <PublicMemberProfileForm
                profile={memberProfile}
                authenticatedDisplayName={user.displayName}
              />
            ) : (
              <div className="border border-amber-300/30 bg-amber-300/8 p-5 text-sm leading-7 text-amber-100/85">
                Community persistence is not configured. No public profile will
                be created or falsely reported as saved.
              </div>
            )}
          </OperationsPanel>
        </section>
      ) : null}
    </OperationsPage>
  );
}

function ReadOnlyRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div>
      <dt className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm leading-6 text-muted">{value}</dd>
    </div>
  );
}
