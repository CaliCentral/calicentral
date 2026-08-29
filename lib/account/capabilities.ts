export const ACCOUNT_CAPABILITIES = [
  "member",
  "athlete",
  "organizer",
  "team",
  "contributor",
] as const;

export type AccountCapability = (typeof ACCOUNT_CAPABILITIES)[number];

export type JoinIntentDescriptor = {
  readonly capability: AccountCapability;
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly nextStep: string;
};

export const JOIN_INTENTS = [
  {
    capability: "member",
    label: "I'm here to follow the sport",
    title: "Member",
    description:
      "Create one account to follow the field, save public records, organize private collections, and manage update preferences.",
    nextStep:
      "Complete your private account profile. Follow and save tools appear when Community is enabled; email delivery is not active.",
  },
  {
    capability: "athlete",
    label: "I'm an athlete",
    title: "Athlete",
    description:
      "Prepare a profile request, share public sources, or ask to be connected to an existing athlete record.",
    nextStep:
      "Complete your account profile, then submit an athlete profile request for editorial review.",
  },
  {
    capability: "organizer",
    label: "I'm an organizer",
    title: "Organizer",
    description:
      "Propose competition information, schedules, official links, results, or corrections for review.",
    nextStep:
      "Complete your account profile, then submit competition information for editorial review.",
  },
  {
    capability: "team",
    label: "I manage a team",
    title: "Team manager",
    description:
      "Prepare a private application for a crew, club, competitive team, or prospective WCL team.",
    nextStep:
      "Complete your account profile, then use the team workspace when applications are open. Approval does not publish a team or grant league admission.",
  },
  {
    capability: "contributor",
    label: "I'm a contributor",
    title: "Contributor",
    description:
      "Pitch reporting, interviews, photography, video, or other editorial work through the existing review desk.",
    nextStep:
      "Complete your contributor profile. Submission access remains subject to the existing editorial access workflow.",
  },
] as const satisfies readonly JoinIntentDescriptor[];

export function isAccountCapability(
  value: unknown,
): value is AccountCapability {
  return (
    typeof value === "string" &&
    (ACCOUNT_CAPABILITIES as readonly string[]).includes(value)
  );
}

export function resolveJoinIntent(
  value: string | string[] | undefined,
): JoinIntentDescriptor {
  const candidate = Array.isArray(value) ? value[0] : value;

  return (
    JOIN_INTENTS.find((intent) => intent.capability === candidate) ??
    JOIN_INTENTS[0]
  );
}

export function joinIntentReturnPath(
  capability: AccountCapability,
): string {
  return `/account/onboarding?intent=${encodeURIComponent(capability)}`;
}
