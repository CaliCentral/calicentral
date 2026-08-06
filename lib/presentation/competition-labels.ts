import type {
  CompetitionDiscipline,
  CompetitionResultsStatus,
  CompetitionScheduleStatus,
  CompetitionStatus,
  RegistrationStatus,
} from "@/types/competition";

export const competitionStatusLabels = {
  upcoming: "Upcoming",
  completed: "Completed",
  postponed: "Postponed",
  preview: "Preview",
} as const satisfies Record<CompetitionStatus, string>;

export const registrationStatusLabels = {
  "not-open": "Registration not open",
  "preview-only": "Preview listing only",
  closed: "Registration closed",
  unavailable: "Registration unavailable",
} as const satisfies Record<RegistrationStatus, string>;

export const competitionScheduleStatusLabels = {
  pending: "Schedule pending",
  provisional: "Provisional schedule",
  published: "Schedule published",
  completed: "Schedule complete",
} as const satisfies Record<CompetitionScheduleStatus, string>;

export const competitionResultsStatusLabels = {
  "not-available": "Not available",
  pending: "Pending",
  "sample-results": "Sample results",
} as const satisfies Record<CompetitionResultsStatus, string>;

export const competitionDisciplineLabels = {
  freestyle: "Freestyle",
  "static-strength": "Static strength",
  dynamic: "Dynamic",
  endurance: "Endurance",
  team: "Team",
  mixed: "Mixed",
} as const satisfies Record<CompetitionDiscipline, string>;
