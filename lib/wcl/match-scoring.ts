import { requireWclCalculations } from "@/lib/wcl/rules";
import type {
  WclMatchScore,
  WclRulesetVersion,
  WclSpecialty,
  WclTeamSide,
} from "@/lib/wcl/types";

export function scoreWclMatch(input: {
  readonly rulesetVersion: WclRulesetVersion;
  readonly specialtyWinners: Readonly<Record<WclSpecialty, WclTeamSide>>;
  readonly finalStandWinner: WclTeamSide;
}): WclMatchScore {
  const rules = requireWclCalculations(input.rulesetVersion);
  let homePoints = 0;
  let awayPoints = 0;
  let homeSpecialtyWins = 0;
  let awaySpecialtyWins = 0;

  for (const [specialty, winner] of Object.entries(input.specialtyWinners) as [WclSpecialty, WclTeamSide][]) {
    if (winner === "home") {
      homePoints += rules.divisionPoints[specialty];
      homeSpecialtyWins += 1;
    } else {
      awayPoints += rules.divisionPoints[specialty];
      awaySpecialtyWins += 1;
    }
  }
  if (input.finalStandWinner === "home") homePoints += rules.finalStandPoints;
  else awayPoints += rules.finalStandPoints;

  if (homePoints === awayPoints) {
    throw new Error("The configured WCL points must produce a match winner.");
  }
  return {
    rulesetVersion: input.rulesetVersion,
    homePoints,
    awayPoints,
    homeSpecialtyWins,
    awaySpecialtyWins,
    finalStandWinner: input.finalStandWinner,
    winner: homePoints > awayPoints ? "home" : "away",
  };
}

