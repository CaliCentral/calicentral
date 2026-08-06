import type { EditorialImage, SeoData } from "@/types/content";

export type CompetitionStatus =
  | "upcoming"
  | "completed"
  | "postponed"
  | "preview";

export type RegistrationStatus =
  | "not-open"
  | "preview-only"
  | "closed"
  | "unavailable";

export type CompetitionScheduleStatus =
  | "pending"
  | "provisional"
  | "published"
  | "completed";

export type CompetitionResultsStatus =
  | "not-available"
  | "pending"
  | "sample-results";

export type CompetitionDiscipline =
  | "freestyle"
  | "static-strength"
  | "dynamic"
  | "endurance"
  | "team"
  | "mixed";

export type CompetitionVisualVariant = "signal" | "field" | "frame";

export type CompetitionDivision = {
  readonly slug: string;
  readonly name: string;
  readonly discipline: CompetitionDiscipline;
  readonly level: string;
  readonly format: string;
  readonly participantLimit: number;
  readonly description: string;
};

export type CompetitionScheduleItem = {
  readonly time: string;
  readonly label: string;
  readonly description: string;
  readonly stage: string;
  readonly status: "planned" | "provisional" | "complete" | "cancelled";
};

export type CompetitionParticipant = {
  readonly athleteSlug?: string;
  readonly athleteName: string;
  readonly city: string;
  readonly discipline: CompetitionDiscipline;
  readonly seed: string;
  readonly status: "sample-entry" | "invited" | "preview" | "withdrawn";
};

export type CompetitionResult = {
  readonly placement: number;
  readonly athleteSlug?: string;
  readonly athleteName: string;
  readonly region: string;
  readonly scoreDisplay: string;
  readonly resultLabel: string;
  readonly movementNote: string;
};

export type CompetitionTimelineEntry = {
  readonly dateLabel: string;
  readonly title: string;
  readonly description: string;
  readonly status: "complete" | "current" | "pending" | "paused";
};

export type CompetitionNotice = {
  readonly label: string;
  readonly text: string;
  readonly emphasis: "standard" | "signal";
};

export type Competition = {
  readonly slug: string;
  readonly name: string;
  readonly shortName: string;
  readonly eventNumber: string;
  readonly status: CompetitionStatus;
  readonly startDate: string;
  readonly endDate?: string;
  readonly dateDisplay: string;
  readonly monthCode: string;
  readonly day: string;
  readonly year: string;
  readonly city: string;
  readonly state: string;
  readonly country: string;
  readonly region: string;
  readonly venueName: string;
  readonly venueType: string;
  readonly summary: string;
  readonly fullDescription: readonly string[];
  readonly disciplines: readonly CompetitionDiscipline[];
  readonly primaryDiscipline: CompetitionDiscipline;
  readonly divisions: readonly CompetitionDivision[];
  readonly featured: boolean;
  readonly registrationStatus: RegistrationStatus;
  readonly scheduleStatus: CompetitionScheduleStatus;
  readonly resultsStatus: CompetitionResultsStatus;
  readonly capacityLabel: string;
  readonly organizerName: string;
  readonly competitionFormat: string;
  readonly visualVariant: CompetitionVisualVariant;
  readonly schedule: readonly CompetitionScheduleItem[];
  readonly participants: readonly CompetitionParticipant[];
  readonly results: readonly CompetitionResult[];
  readonly relatedStorySlugs: readonly string[];
  readonly relatedVideoSlugs: readonly string[];
  readonly relatedAthleteSlugs: readonly string[];
  readonly relatedCompetitionSlugs: readonly string[];
  readonly timeline: readonly CompetitionTimelineEntry[];
  readonly notices: readonly CompetitionNotice[];
  readonly image?: EditorialImage;
  readonly seo?: SeoData;
};
