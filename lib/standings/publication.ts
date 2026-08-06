import type {
  Competition,
  CompetitionResult,
  VerifiedCompetitionResult,
} from "@/types/competition";
import type { RankingCategory } from "@/types/ranking";

function isPublicHttpUrl(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function isPublishableCompetitionStanding(
  category: RankingCategory,
): boolean {
  return (
    category.scope === "competition" &&
    category.status === "published" &&
    category.methodologyStatus === "approved" &&
    Boolean(category.seasonLabel.trim()) &&
    category.entries.length > 0 &&
    category.entries.every(
      (entry) =>
        entry.sources.length > 0 &&
        entry.sources.every(
          (source) =>
            source.verificationStatus === "verified" &&
            Boolean(source.competitionSlug) &&
            Boolean(source.competitionName) &&
            Boolean(source.resultKey) &&
            Boolean(source.sourceName) &&
            isPublicHttpUrl(source.sourceUrl),
        ),
    )
  );
}

export function isVerifiedCompetitionResult(
  competition: Competition,
  result: CompetitionResult,
): result is CompetitionResult & {
  readonly key: string;
  readonly verificationStatus: "verified";
  readonly sourceName: string;
  readonly sourceUrl: string;
  readonly sourceType: NonNullable<CompetitionResult["sourceType"]>;
} {
  return (
    competition.status === "completed" &&
    competition.resultsStatus === "verified-results" &&
    result.verificationStatus === "verified" &&
    Boolean(result.key) &&
    Boolean(result.sourceName?.trim()) &&
    Boolean(result.sourceType) &&
    isPublicHttpUrl(result.sourceUrl)
  );
}

export function getVerifiedCompetitionResults(
  competitions: readonly Competition[],
): VerifiedCompetitionResult[] {
  return competitions
    .flatMap((competition) =>
      competition.results.flatMap((result) =>
        isVerifiedCompetitionResult(competition, result)
          ? [
              {
                ...result,
                competitionSlug: competition.slug,
                competitionName: competition.name,
                competitionDate: competition.startDate,
                competitionCountry: competition.country,
              },
            ]
          : [],
      ),
    )
    .sort(
      (first, second) =>
        second.competitionDate.localeCompare(first.competitionDate) ||
        first.placement - second.placement,
    );
}
