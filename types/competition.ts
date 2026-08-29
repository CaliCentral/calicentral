import type { EditorialImage, SeoData } from "@/types/content";

export type CompetitionStatus =
  | "upcoming"
  | "completed"
  | "postponed"
  | "cancelled"
  | "preview";

export type CompetitionContentStatus =
  | "published-record"
  | "fictional-prototype"
  | "sample-record"
  | "not-official";

export type RegistrationStatus =
  | "not-open"
  | "open"
  | "preview-only"
  | "closed"
  | "sold-out"
  | "unavailable";

export type CompetitionScheduleStatus =
  | "pending"
  | "provisional"
  | "published"
  | "completed";

export type CompetitionResultsStatus =
  | "not-available"
  | "pending"
  | "verified-results"
  | "sample-results";

export type CompetitionResultVerificationStatus =
  | "unverified"
  | "source-reviewed"
  | "verified"
  | "disputed"
  | "sample";

export type CompetitionResultSourceType =
  | "official-event-results"
  | "organizer-published"
  | "event-website"
  | "video"
  | "other";

export type OrganizerVerificationStatus =
  | "unverified"
  | "reviewed"
  | "verified"
  | "sample";

export type CompetitionActionLinkType =
  | "registration"
  | "tickets"
  | "official-site"
  | "organizer-social"
  | "results"
  | "map"
  | "livestream";

export type CompetitionActionLink = {
  readonly label: string;
  readonly url: string;
  readonly linkType: CompetitionActionLinkType;
  readonly affiliate: boolean;
  readonly partnerName?: string;
  readonly disclosure?: string;
};

export type CompetitionDiscipline =
  | "freestyle"
  | "streetlifting"
  | "weighted-calisthenics"
  | "static-strength"
  | "dynamic"
  | "endurance"
  | "skills"
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
  readonly key?: string;
  readonly placement: number;
  readonly athleteSlug?: string;
  readonly athleteName: string;
  readonly region: string;
  readonly category?: string;
  readonly division?: string;
  readonly ruleset?: string;
  readonly bodyweightDisplay?: string;
  readonly scoreDisplay: string;
  readonly resultLabel: string;
  readonly movementNote: string;
  readonly verificationStatus?: CompetitionResultVerificationStatus;
  readonly sourceType?: CompetitionResultSourceType;
  readonly sourceName?: string;
  readonly sourceUrl?: string;
  readonly videoUrl?: string;
  readonly verifiedAt?: string;
};

export type VerifiedCompetitionResult = CompetitionResult & {
  readonly key: string;
  readonly verificationStatus: "verified";
  readonly sourceName: string;
  readonly sourceUrl: string;
  readonly sourceType: CompetitionResultSourceType;
  readonly competitionSlug: string;
  readonly competitionName: string;
  readonly competitionDate: string;
  readonly competitionCountry: string;
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
  readonly canonicalId: string;
  readonly slug: string;
  readonly name: string;
  readonly shortName: string;
  readonly eventNumber: string;
  readonly status: CompetitionStatus;
  readonly contentStatus: CompetitionContentStatus;
  readonly startDate: string;
  readonly endDate?: string;
  readonly dateDisplay: string;
  readonly monthCode: string;
  readonly day: string;
  readonly year: string;
  readonly city: string;
  readonly state: string;
  readonly administrativeArea?: string;
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
  readonly registrationDeadline?: string;
  readonly scheduleStatus: CompetitionScheduleStatus;
  readonly resultsStatus: CompetitionResultsStatus;
  readonly capacityLabel: string;
  readonly organizerName: string;
  readonly organizerVerificationStatus?: OrganizerVerificationStatus;
  readonly competitionFormat: string;
  readonly visualVariant: CompetitionVisualVariant;
  readonly schedule: readonly CompetitionScheduleItem[];
  readonly participants: readonly CompetitionParticipant[];
  readonly results: readonly CompetitionResult[];
  readonly actionLinks?: readonly CompetitionActionLink[];
  readonly relatedStorySlugs: readonly string[];
  readonly relatedVideoSlugs: readonly string[];
  readonly relatedAthleteSlugs: readonly string[];
  readonly relatedCompetitionSlugs: readonly string[];
  readonly timeline: readonly CompetitionTimelineEntry[];
  readonly notices: readonly CompetitionNotice[];
  readonly image?: EditorialImage;
  readonly seo?: SeoData;
};
