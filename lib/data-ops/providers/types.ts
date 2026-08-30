export type SourceEntityType =
  | "athlete-directory"
  | "competition-directory"
  | "competition-detail"
  | "results-directory"
  | "ranking-table";

export type RawSourceSnapshot = {
  readonly provider: string;
  readonly sourceUrl: string;
  readonly fetchedAt: string;
  readonly httpStatus: number;
  readonly contentType: string;
  readonly contentHash: string;
  readonly parserVersion: string;
  readonly sourceEntityType: SourceEntityType;
  readonly sourceEntityIdentifier?: string;
  readonly sourceRevisionMarker?: string;
  readonly body: string;
};

export type OfficialStreetliftingCompetition = {
  readonly externalId: string;
  readonly sourceUrl: string;
  readonly name: string;
  readonly sourceStatus: string;
  readonly startDate?: string;
  readonly location?: string;
  readonly style?: string;
};

export type OfficialStreetliftingResult = {
  readonly externalResultId: string;
  readonly sourceUrl: string;
  readonly athleteExternalId: string;
  readonly athleteSourceUrl: string;
  readonly athleteName: string;
  readonly competitionExternalId?: string;
  readonly competitionSourceUrl?: string;
  readonly competitionName?: string;
  readonly position?: number;
  readonly gender?: string;
  readonly weightClass?: string;
  readonly bodyweightKg?: number;
  readonly style?: string;
  readonly totalKg?: number;
  readonly score?: number;
  readonly resultDate?: string;
  readonly liftsKg: Readonly<Record<string, number>>;
};

export type OfficialStreetliftingRanking = {
  readonly sourceUrl: string;
  readonly title: string;
  readonly category: string;
  readonly gender?: string;
  readonly weightClass?: string;
  readonly division?: string;
  readonly entries: readonly OfficialStreetliftingResult[];
};
