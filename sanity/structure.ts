import type {StructureResolver} from "sanity/structure"

type Ordering = {field: string; direction: "asc" | "desc"}

const singletonListItem = (
  S: Parameters<StructureResolver>[0],
  schemaType: string,
  title: string,
) =>
  S.listItem()
    .title(title)
    .id(`${schemaType}-singleton-item`)
    .child(
      S.document()
        .id(`${schemaType}-singleton-document`)
        .schemaType(schemaType)
        .documentId(schemaType)
        .title(title),
    )

const documentListItem = (
  S: Parameters<StructureResolver>[0],
  schemaType: string,
  title: string,
  orderings: Ordering[],
) =>
  S.listItem()
    .id(`${schemaType}-list-item`)
    .title(title)
    .schemaType(schemaType)
    .child(
      S.documentTypeList(schemaType)
        .id(`${schemaType}-document-list`)
        .title(title)
        .defaultOrdering(orderings),
    )

const section = (
  S: Parameters<StructureResolver>[0],
  id: string,
  title: string,
  items: ReturnType<typeof documentListItem>[],
) =>
  S.listItem()
    .id(`${id}-section-item`)
    .title(title)
    .child(
      S.list()
        .id(`${id}-section-list`)
        .title(title)
        .items(items),
    )

export const structure: StructureResolver = (S) =>
  S.list()
    .id("cali-central-root")
    .title("Cali Central")
    .items([
      section(S, "site", "Site", [
        singletonListItem(S, "siteSettings", "Site settings"),
      ]),
      S.divider(),
      section(S, "editorial", "Editorial", [
        documentListItem(S, "story", "Stories", [{field: "publishedAt", direction: "desc"}]),
        documentListItem(S, "author", "Authors", [{field: "name", direction: "asc"}]),
      ]),
      section(S, "editorial-operations", "Editorial Operations", [
        documentListItem(S, "submission", "Submissions", [{field: "updatedAt", direction: "desc"}]),
        documentListItem(S, "contributorProfile", "Contributors", [{field: "displayName", direction: "asc"}]),
        documentListItem(S, "auditEvent", "Audit events", [{field: "createdAt", direction: "desc"}]),
      ]),
      section(S, "athletes-rankings", "Athletes & Rankings", [
        documentListItem(S, "athlete", "Athletes", [{field: "name", direction: "asc"}]),
        documentListItem(S, "rankingCategory", "League standing categories", [{field: "displayOrder", direction: "asc"}]),
        documentListItem(S, "rankingProvider", "Ranking providers", [{field: "name", direction: "asc"}]),
        documentListItem(S, "rankingSystem", "Athlete ranking systems", [{field: "name", direction: "asc"}]),
        documentListItem(S, "rankingSnapshot", "Athlete ranking snapshots", [{field: "rankingDate", direction: "desc"}]),
        documentListItem(S, "externalAthleteIdentity", "External athlete identities (private)", [{field: "updatedAt", direction: "desc"}]),
      ]),
      section(S, "teams", "Teams", [
        documentListItem(S, "team", "Public team records", [{field: "name", direction: "asc"}]),
        documentListItem(S, "teamSeason", "Team seasons & rosters", [{field: "seasonLabel", direction: "desc"}]),
      ]),
      section(S, "competitions", "Competitions", [
        documentListItem(S, "competition", "Competition editions", [{field: "startDate", direction: "asc"}]),
        documentListItem(S, "externalCompetitionIdentity", "External competition identities (private)", [{field: "updatedAt", direction: "desc"}]),
        documentListItem(S, "sportingResult", "Structured sporting results", [{field: "_updatedAt", direction: "desc"}]),
      ]),
      section(S, "organizations-commerce", "Organizations & Commerce", [
        documentListItem(S, "organization", "Organizations", [{field: "name", direction: "asc"}]),
        documentListItem(S, "product", "Curated products", [{field: "featured", direction: "desc"}, {field: "name", direction: "asc"}]),
        documentListItem(S, "ruleset", "Ruleset metadata", [{field: "effectiveFrom", direction: "desc"}]),
      ]),
      section(S, "media", "Media", [
        documentListItem(S, "video", "Videos", [{field: "publishedAt", direction: "desc"}]),
        documentListItem(S, "videoSeries", "Video series", [{field: "displayOrder", direction: "asc"}]),
      ]),
    ])
