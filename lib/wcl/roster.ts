import type {
  WclRosterMember,
  WclRulesetVersion,
  WclSpecialty,
  WclValidationResult,
} from "@/lib/wcl/types";
import { requireWclCalculations } from "@/lib/wcl/rules";

const specialties: readonly WclSpecialty[] = [
  "strength",
  "control",
  "endurance",
  "freestyle",
];

export function validateWclRoster(
  version: WclRulesetVersion,
  members: readonly WclRosterMember[],
): WclValidationResult {
  requireWclCalculations(version);
  const errors: string[] = [];
  const starters = members.filter((member) => member.rosterRole === "starter");
  const reserves = members.filter((member) => member.rosterRole === "reserve");

  if (starters.length !== 4) errors.push("Exactly four starters are required.");
  if (reserves.length !== 1) errors.push("Exactly one reserve is required.");
  if (!members.some((member) => member.captain)) errors.push("A team captain is required.");
  if (new Set(starters.map((member) => member.athleteId)).size !== starters.length) {
    errors.push("Starter identities must be unique.");
  }
  if (new Set(members.map((member) => member.athleteId)).size !== members.length) {
    errors.push("An athlete may occupy only one roster position.");
  }
  for (const specialty of specialties) {
    if (starters.filter((member) => member.specialty === specialty).length !== 1) {
      errors.push(`Exactly one ${specialty} starter is required.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateOneFranchisePerSeason(
  memberships: readonly { athleteId: string; seasonId: string; franchiseId: string }[],
): WclValidationResult {
  const errors: string[] = [];
  const franchiseByAthleteSeason = new Map<string, string>();
  for (const membership of memberships) {
    const key = `${membership.athleteId}:${membership.seasonId}`;
    const existing = franchiseByAthleteSeason.get(key);
    if (existing && existing !== membership.franchiseId) {
      errors.push(`${membership.athleteId} is assigned to multiple franchises in ${membership.seasonId}.`);
    }
    franchiseByAthleteSeason.set(key, membership.franchiseId);
  }
  return { valid: errors.length === 0, errors };
}
