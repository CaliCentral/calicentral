export type WclRulesetVersion = "2.0" | "3.0-proposed";
export type WclRulesetStatus = "current" | "historical" | "proposed";
export type WclTeamSide = "home" | "away";
export type WclSpecialty = "strength" | "control" | "endurance" | "freestyle";

export type WclRules = {
  readonly organization: "WCL";
  readonly version: WclRulesetVersion;
  readonly status: WclRulesetStatus;
  readonly publicLabel: string;
  readonly calculationsAvailable: boolean;
  readonly divisionPoints: Readonly<Record<WclSpecialty, number>>;
  readonly finalStandPoints: number;
  readonly maximumMatchPoints: number;
  readonly sequence: readonly string[];
  readonly recoveryIntervals: readonly {
    readonly after: string;
    readonly seconds: number;
  }[];
  readonly finalStandTimeCapSeconds: number;
};

export type WclOfficialRole =
  | "head-referee"
  | "movement-judge"
  | "official-scorekeeper"
  | "timekeeper"
  | "video-review-official"
  | "equipment-official"
  | "freestyle-judge";

export type WclChallengeCategory =
  | "rep-validity"
  | "timing"
  | "equipment"
  | "arithmetic"
  | "procedure";

export type WclChallengeRecord = {
  readonly id: string;
  readonly rulesetVersion: WclRulesetVersion;
  readonly captainMemberId: string;
  readonly category: WclChallengeCategory;
  readonly status: "submitted" | "reviewing" | "resolved";
  readonly outcome?: "successful-retained" | "unsuccessful-lost";
};

export type WclRosterMember = {
  readonly athleteId: string;
  readonly rosterRole: "starter" | "reserve";
  readonly specialty?: WclSpecialty;
  readonly captain?: boolean;
};

export type WclValidationResult = {
  readonly valid: boolean;
  readonly errors: readonly string[];
};

export type WclMatchScore = {
  readonly rulesetVersion: WclRulesetVersion;
  readonly homePoints: number;
  readonly awayPoints: number;
  readonly homeSpecialtyWins: number;
  readonly awaySpecialtyWins: number;
  readonly finalStandWinner: WclTeamSide;
  readonly winner: WclTeamSide;
};
