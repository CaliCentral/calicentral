import { validateWclRoster } from "@/lib/wcl/roster";
import type { WclRosterMember, WclRulesetVersion } from "@/lib/wcl/types";

export type WclTeamReadiness = {
  readonly applicationApproved: boolean;
  readonly brandingComplete: boolean;
  readonly rosterComplete: boolean;
  readonly invitationsComplete: boolean;
  readonly eligibilityConfirmed: boolean;
  readonly uniformApproved: boolean;
  readonly seasonRegistered: boolean;
  readonly competitionReady: boolean;
};

export function calculateWclTeamReadiness(input: {
  readonly rulesetVersion: WclRulesetVersion;
  readonly roster: readonly WclRosterMember[];
  readonly applicationApproved: boolean;
  readonly brandingComplete: boolean;
  readonly invitationsComplete: boolean;
  readonly eligibilityConfirmed: boolean;
  readonly uniformApproved: boolean;
  readonly seasonRegistered: boolean;
}): WclTeamReadiness {
  const rosterComplete = validateWclRoster(input.rulesetVersion, input.roster).valid;
  const checks = [
    input.applicationApproved,
    input.brandingComplete,
    rosterComplete,
    input.invitationsComplete,
    input.eligibilityConfirmed,
    input.uniformApproved,
    input.seasonRegistered,
  ];
  return {
    applicationApproved: input.applicationApproved,
    brandingComplete: input.brandingComplete,
    rosterComplete,
    invitationsComplete: input.invitationsComplete,
    eligibilityConfirmed: input.eligibilityConfirmed,
    uniformApproved: input.uniformApproved,
    seasonRegistered: input.seasonRegistered,
    competitionReady: checks.every(Boolean),
  };
}

