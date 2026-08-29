import assert from "node:assert/strict";

import {
  compareControlHolds,
  controlHoldResultFromAttempts,
} from "@/lib/wcl/control";
import { compareFinalStandResults, validateFinalStandAssignments } from "@/lib/wcl/final-stand";
import { compareFreestyleScores, scoreFreestyle } from "@/lib/wcl/freestyle";
import { scoreWclMatch } from "@/lib/wcl/match-scoring";
import { validateOneFranchisePerSeason, validateWclRoster } from "@/lib/wcl/roster";
import { getWclRules } from "@/lib/wcl/rules";
import { rankWclStandings } from "@/lib/wcl/standings";
import { compareStrengthAttempts, strengthDivisionWinner } from "@/lib/wcl/strength";
import type { WclRosterMember, WclSpecialty, WclTeamSide } from "@/lib/wcl/types";

let assertionCount = 0;
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message);
  assertionCount += 1;
}

const roster: WclRosterMember[] = [
  { athleteId: "a1", rosterRole: "starter", specialty: "strength", captain: true },
  { athleteId: "a2", rosterRole: "starter", specialty: "control" },
  { athleteId: "a3", rosterRole: "starter", specialty: "endurance" },
  { athleteId: "a4", rosterRole: "starter", specialty: "freestyle" },
  { athleteId: "a5", rosterRole: "reserve" },
];

check(getWclRules("2.0").status === "current", "2.0 remains the current official metadata record");
check(!getWclRules("2.0").calculationsAvailable, "unknown 2.0 calculations fail closed");
check(getWclRules("3.0-proposed").status === "proposed", "3.0 is explicitly proposed");
check(validateWclRoster("3.0-proposed", roster).valid, "complete proposed roster is valid");
check(!validateWclRoster("3.0-proposed", [...roster.slice(0, 3), roster[4]]).valid, "four starters are required");
check(!validateWclRoster("3.0-proposed", roster.slice(0, 4)).valid, "reserve is mandatory");
check(!validateWclRoster("3.0-proposed", [...roster, {athleteId: "a6", rosterRole: "reserve"}]).valid, "the proposed roster has exactly one reserve");
check(!validateWclRoster("3.0-proposed", roster.map((member) => ({ ...member, captain: false }))).valid, "captain is mandatory");
check(!validateWclRoster("3.0-proposed", [...roster.slice(0, 3), { ...roster[3], specialty: "endurance" }, roster[4]]).valid, "specialist slots are required");
check(!validateWclRoster("3.0-proposed", [{ ...roster[0] }, { ...roster[1], athleteId: "a1" }, ...roster.slice(2)]).valid, "starters must be unique");
check(!validateOneFranchisePerSeason([
  { athleteId: "a1", seasonId: "2027", franchiseId: "north" },
  { athleteId: "a1", seasonId: "2027", franchiseId: "south" },
]).valid, "one franchise per athlete per season is enforced");

function match(specialtyHomeWins: number, finalStandWinner: WclTeamSide) {
  const keys: WclSpecialty[] = ["strength", "control", "endurance", "freestyle"];
  return scoreWclMatch({
    rulesetVersion: "3.0-proposed",
    specialtyWinners: Object.fromEntries(keys.map((key, index) => [key, index < specialtyHomeWins ? "home" : "away"])) as Record<WclSpecialty, WclTeamSide>,
    finalStandWinner,
  });
}

check(match(4, "away").homePoints === 40 && match(4, "away").awayPoints === 25 && match(4, "away").winner === "home", "4-0 plus lost Final Stand remains 40-25");
check(match(3, "away").winner === "away", "Final Stand completes a 3-1 comeback");
check(match(2, "away").winner === "away", "Final Stand decides a 2-2 split");
check(match(1, "home").winner === "home", "Final Stand completes a 1-3 comeback");

check(strengthDivisionWinner(["a", "a", "b"]) === "a", "two strength event wins decide the division");
check(compareStrengthAttempts(
  { athleteId: "a", addedLoadKg: 50, failedAttemptsAtLoad: 0, successfulCompletionOrder: 2 },
  { athleteId: "b", addedLoadKg: 50, failedAttemptsAtLoad: 1, successfulCompletionOrder: 1 },
) < 0, "fewer tied-load failures wins before completion order");
check(compareStrengthAttempts(
  { athleteId: "a", addedLoadKg: 50, failedAttemptsAtLoad: 0, successfulCompletionOrder: 1 },
  { athleteId: "b", addedLoadKg: 50, failedAttemptsAtLoad: 0, successfulCompletionOrder: 2 },
) < 0, "earlier tied-load completion is the second tiebreak");
check(compareStrengthAttempts(
  { athleteId: "a", addedLoadKg: 50, failedAttemptsAtLoad: 0, successfulCompletionOrder: 1, suddenDeathWon: true },
  { athleteId: "b", addedLoadKg: 50, failedAttemptsAtLoad: 0, successfulCompletionOrder: 1 },
) < 0, "declared-load sudden death resolves a remaining strength tie");

check(compareControlHolds(
  { athleteId: "a", legalAttemptSeconds: [10, 8] },
  { athleteId: "b", legalAttemptSeconds: [9, 9] },
)! < 0, "best legal hold wins");
check(compareControlHolds(
  { athleteId: "a", legalAttemptSeconds: [10, 9] },
  { athleteId: "b", legalAttemptSeconds: [10, 8] },
)! < 0, "second-best legal hold breaks a tie");
check(compareControlHolds(
  { athleteId: "a", legalAttemptSeconds: [10, 8] },
  { athleteId: "b", legalAttemptSeconds: [10, 8] },
) === null, "unresolved control tie requires sudden death");
const legalControlAttempt = controlHoldResultFromAttempts({
  athleteId: "a",
  attempts: [
    {durationSeconds: 20, feetOffFloor: true, lockedElbows: false, legalInvertedPosition: true, handsWithinMarkedBoxes: true, officialStop: true},
    {durationSeconds: 12, feetOffFloor: true, lockedElbows: true, legalInvertedPosition: true, handsWithinMarkedBoxes: true, officialStop: true},
  ],
});
check(legalControlAttempt.legalAttemptSeconds.length === 1 && legalControlAttempt.legalAttemptSeconds[0] === 12, "control legal-state fields exclude an invalid longer hold");

const judge = (judgeId: string, value: number) => ({
  judgeId,
  difficulty: value,
  execution: value,
  creativity: value,
  flow: value,
  control: value,
  deduction: 0,
});
const freestyle = scoreFreestyle([
  judge("j1", 10),
  judge("j2", 8),
  judge("j3", 7),
  judge("j4", 6),
  judge("j5", 1),
]);
check(freestyle.judgeTotals.length === 5, "five judge totals are retained");
check(freestyle.finalScore === 35, "highest and lowest totals are removed and the middle three averaged");
const executionWinner = { ...freestyle, finalScore: 40, categoryAverages: { ...freestyle.categoryAverages, execution: 9 } };
const executionLoser = { ...freestyle, finalScore: 40, categoryAverages: { ...freestyle.categoryAverages, execution: 8 } };
check(compareFreestyleScores(executionWinner, executionLoser)! < 0, "execution is the first freestyle tiebreak");
const difficultyWinner = { ...freestyle, finalScore: 40, categoryAverages: { ...freestyle.categoryAverages, execution: 9, difficulty: 9, control: 7 } };
const difficultyLoser = { ...freestyle, finalScore: 40, categoryAverages: { ...freestyle.categoryAverages, execution: 9, difficulty: 8, control: 10 } };
check(compareFreestyleScores(difficultyWinner, difficultyLoser)! < 0, "difficulty follows execution in the freestyle tiebreak");
const controlWinner = { ...freestyle, finalScore: 40, categoryAverages: { ...freestyle.categoryAverages, execution: 9, difficulty: 9, control: 9 } };
const controlLoser = { ...freestyle, finalScore: 40, categoryAverages: { ...freestyle.categoryAverages, execution: 9, difficulty: 9, control: 8 } };
check(compareFreestyleScores(controlWinner, controlLoser)! < 0, "control follows difficulty in the freestyle tiebreak");

const assignments = [
  { stationId: "muscle-ups", athleteId: "a1" },
  { stationId: "pull-ups", athleteId: "a2" },
  { stationId: "dips", athleteId: "a3" },
  { stationId: "push-ups", athleteId: "a4" },
  { stationId: "handstand-walk", athleteId: "a1" },
] as const;
check(validateFinalStandAssignments(assignments, ["a1", "a2", "a3", "a4"]).valid, "all four starters work before a second station");
check(!validateFinalStandAssignments(assignments.map((item, index) => index === 3 ? { ...item, athleteId: "a1" } : item), ["a1", "a2", "a3", "a4"]).valid, "a second station cannot precede all four starters");
check(!validateFinalStandAssignments(assignments.map((item, index) => index === 1 ? { ...item, stationId: "muscle-ups" } : item), ["a1", "a2", "a3", "a4"]).valid, "the versioned Final Stand station order is enforced");
check(compareFinalStandResults(
  { completed: false, legalProgress: 90, noReps: 3 },
  { completed: false, legalProgress: 80, noReps: 0 },
)! < 0, "greater time-cap progress wins");
check(compareFinalStandResults(
  { completed: false, legalProgress: 90, noReps: 1 },
  { completed: false, legalProgress: 90, noReps: 2 },
)! < 0, "fewer no-reps breaks a Final Stand progress tie");

const standings = rankWclStandings([
  { teamId: "a", matchWins: 2, matchPointsFor: 80, matchPointsAgainst: 50, specialtyDivisionWins: 5, finalStandWins: 1, completedFinalStandTimes: [300] },
  { teamId: "b", matchWins: 3, matchPointsFor: 70, matchPointsAgainst: 65, specialtyDivisionWins: 4, finalStandWins: 2, completedFinalStandTimes: [280] },
]);
check(standings[0]?.teamId === "b", "match wins lead standings order");
const tiebreakStandings = rankWclStandings([
  { teamId: "a", matchWins: 2, matchPointsFor: 80, matchPointsAgainst: 50, specialtyDivisionWins: 5, finalStandWins: 1, completedFinalStandTimes: [300] },
  { teamId: "b", matchWins: 2, matchPointsFor: 80, matchPointsAgainst: 50, specialtyDivisionWins: 5, finalStandWins: 1, completedFinalStandTimes: [280] },
], { "a:b": 1, "b:a": 0 });
check(tiebreakStandings[0]?.teamId === "a", "head-to-head precedes point differential and later tiebreaks");

const standing = (teamId: string, overrides: Partial<(typeof standings)[number]> = {}) => ({
  teamId,
  matchWins: 2,
  matchPointsFor: 80,
  matchPointsAgainst: 60,
  specialtyDivisionWins: 4,
  finalStandWins: 1,
  completedFinalStandTimes: [300] as readonly number[],
  ...overrides,
});
check(rankWclStandings([
  standing("a", {matchPointsFor: 90}),
  standing("b"),
])[0]?.teamId === "a", "match-point differential follows head-to-head");
check(rankWclStandings([
  standing("a", {specialtyDivisionWins: 5}),
  standing("b"),
])[0]?.teamId === "a", "specialty division wins follow point differential");
check(rankWclStandings([
  standing("a", {finalStandWins: 2}),
  standing("b"),
])[0]?.teamId === "a", "Final Stand wins follow specialty divisions");
check(rankWclStandings([
  standing("a", {completedFinalStandTimes: [280]}),
  standing("b"),
])[0]?.teamId === "a", "average completed Final Stand time is the last deterministic tiebreak");
check(rankWclStandings([
  standing("a"),
  standing("b"),
]).every((entry) => entry.requiresPlayoff), "an unresolved deterministic tie requires an administrative playoff");

console.log(`WCL validation passed (${assertionCount} assertions).`);
