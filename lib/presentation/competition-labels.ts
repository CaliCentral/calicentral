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
  cancelled: "Cancelled",
  preview: "Preview",
  unknown: "Status unknown",
} as const satisfies Record<CompetitionStatus, string>;

export const registrationStatusLabels = {
  "not-open": "Registration not open",
  open: "Registration open",
  "preview-only": "Preview listing only",
  closed: "Registration closed",
  "sold-out": "Registration sold out",
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
  "verified-results": "Verified results",
  "sample-results": "Sample results",
} as const satisfies Record<CompetitionResultsStatus, string>;

export const competitionDisciplineLabels = {
  freestyle: "Freestyle",
  streetlifting: "Streetlifting",
  "weighted-calisthenics": "Weighted calisthenics",
  "static-strength": "Static strength",
  dynamic: "Dynamic",
  endurance: "Endurance",
  skills: "Skills",
  team: "Team",
  mixed: "Mixed",
} as const satisfies Record<CompetitionDiscipline, string>;
