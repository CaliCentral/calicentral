import type { WclRules, WclRulesetVersion } from "@/lib/wcl/types";

const rulesByVersion: Readonly<Record<WclRulesetVersion, WclRules>> = {
  "2.0": {
    organization: "WCL",
    version: "2.0",
    status: "current",
    publicLabel: "Official WCL Ruleset 2.0",
    calculationsAvailable: false,
    divisionPoints: { strength: 0, control: 0, endurance: 0, freestyle: 0 },
    finalStandPoints: 0,
    maximumMatchPoints: 0,
    sequence: [],
    recoveryIntervals: [],
    finalStandTimeCapSeconds: 0,
  },
  "3.0-proposed": {
    organization: "WCL",
    version: "3.0-proposed",
    status: "proposed",
    publicLabel: "Proposed WCL Ruleset 3.0",
    calculationsAvailable: true,
    divisionPoints: { strength: 10, control: 10, endurance: 10, freestyle: 10 },
    finalStandPoints: 25,
    maximumMatchPoints: 65,
    sequence: [
      "Opening",
      "Strength",
      "Control",
      "Endurance",
      "Freestyle",
      "Final Stand",
      "Awards",
    ],
    // The supplied implementation brief names versioned recovery intervals
    // but does not provide durations. Keep the versioned structure empty
    // instead of inventing historical or proposed timing values.
    recoveryIntervals: [],
    finalStandTimeCapSeconds: 8 * 60,
  },
};

export function getWclRules(version: WclRulesetVersion): WclRules {
  return rulesByVersion[version];
}

export function requireWclCalculations(version: WclRulesetVersion): WclRules {
  const rules = getWclRules(version);
  if (!rules.calculationsAvailable) {
    throw new Error(`WCL calculations are not encoded for ruleset ${version}.`);
  }
  return rules;
}
