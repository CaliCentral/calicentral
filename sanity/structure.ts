import type {StructureResolver} from "sanity/structure"

const singletonListItem = (
  S: Parameters<StructureResolver>[0],
  schemaType: string,
  title: string,
) =>
  S.listItem()
    .title(title)
    .id(schemaType)
    .child(
      S.document()
        .schemaType(schemaType)
        .documentId(schemaType)
        .title(title),
    )

const orderedDocumentList = (
  S: Parameters<StructureResolver>[0],
  schemaType: string,
  title: string,
  orderings: Array<{field: string; direction: "asc" | "desc"}>,
) =>
  S.documentTypeList(schemaType)
    .title(title)
    .defaultOrdering(orderings)

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Cali Central")
    .items([
      S.listItem()
        .title("Site")
        .id("site")
        .child(
          S.list()
            .title("Site")
            .items([singletonListItem(S, "siteSettings", "Site settings")]),
        ),
      S.divider(),
      S.listItem()
        .title("Editorial")
        .id("editorial")
        .child(
          S.list()
            .title("Editorial")
            .items([
              S.listItem()
                .title("Stories")
                .schemaType("story")
                .child(
                  orderedDocumentList(S, "story", "Stories", [
                    {field: "publishedAt", direction: "desc"},
                  ]),
                ),
              S.listItem()
                .title("Authors")
                .schemaType("author")
                .child(
                  orderedDocumentList(S, "author", "Authors", [
                    {field: "name", direction: "asc"},
                  ]),
                ),
            ]),
        ),
      S.listItem()
        .title("Editorial Operations")
        .id("editorial-operations")
        .child(
          S.list()
            .title("Editorial Operations")
            .items([
              S.listItem()
                .title("Submissions")
                .schemaType("submission")
                .child(
                  orderedDocumentList(S, "submission", "Submissions", [
                    {field: "updatedAt", direction: "desc"},
                  ]),
                ),
              S.listItem()
                .title("Contributors")
                .schemaType("contributorProfile")
                .child(
                  orderedDocumentList(
                    S,
                    "contributorProfile",
                    "Contributors",
                    [{field: "displayName", direction: "asc"}],
                  ),
                ),
              S.listItem()
                .title("Audit events")
                .schemaType("auditEvent")
                .child(
                  orderedDocumentList(S, "auditEvent", "Audit events", [
                    {field: "createdAt", direction: "desc"},
                  ]),
                ),
            ]),
        ),
      S.listItem()
        .title("Athletes")
        .id("athletes-and-rankings")
        .child(
          S.list()
            .title("Athletes")
            .items([
              S.listItem()
                .title("Athletes")
                .schemaType("athlete")
                .child(
                  orderedDocumentList(S, "athlete", "Athletes", [
                    {field: "name", direction: "asc"},
                  ]),
                ),
              S.listItem()
                .title("Ranking categories")
                .schemaType("rankingCategory")
                .child(
                  orderedDocumentList(
                    S,
                    "rankingCategory",
                    "Ranking categories",
                    [
                      {field: "displayOrder", direction: "asc"},
                      {field: "title", direction: "asc"},
                    ],
                  ),
                ),
            ]),
        ),
      S.listItem()
        .title("Competitions")
        .schemaType("competition")
        .child(
          orderedDocumentList(S, "competition", "Competitions", [
            {field: "startDate", direction: "asc"},
          ]),
        ),
      S.listItem()
        .title("Media")
        .id("media")
        .child(
          S.list()
            .title("Media")
            .items([
              S.listItem()
                .title("Videos")
                .schemaType("video")
                .child(
                  orderedDocumentList(S, "video", "Videos", [
                    {field: "publishedAt", direction: "desc"},
                  ]),
                ),
              S.listItem()
                .title("Video series")
                .schemaType("videoSeries")
                .child(
                  orderedDocumentList(S, "videoSeries", "Video series", [
                    {field: "displayOrder", direction: "asc"},
                    {field: "title", direction: "asc"},
                  ]),
                ),
            ]),
        ),
    ])
