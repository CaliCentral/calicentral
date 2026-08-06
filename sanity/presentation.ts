import {
  defineDocuments,
  defineLocations,
  type PresentationPluginOptions,
} from "sanity/presentation"

const documentWithSlug = (type: string, route: string) => ({
  route,
  filter: `_type == "${type}" && slug.current == $slug`,
})

export const mainDocuments = defineDocuments([
  {
    route: "/",
    filter: `_id == "siteSettings"`,
  },
  documentWithSlug("story", "/stories/:slug"),
  documentWithSlug("athlete", "/athletes/:slug"),
  documentWithSlug("competition", "/competitions/:slug"),
  documentWithSlug("video", "/videos/:slug"),
  {
    route: "/rankings",
    filter: `_type == "rankingCategory"`,
  },
])

export const storyLocations = defineLocations({
  select: {title: "title", slug: "slug.current"},
  resolve: (document) => ({
    locations: [
      {title: "Stories", href: "/stories"},
      ...(document?.slug
        ? [{title: document.title || "Story", href: `/stories/${document.slug}`}]
        : []),
    ],
  }),
})

export const athleteLocations = defineLocations({
  select: {title: "name", slug: "slug.current"},
  resolve: (document) => ({
    locations: [
      {title: "Athletes", href: "/athletes"},
      ...(document?.slug
        ? [
            {
              title: document.title || "Athlete",
              href: `/athletes/${document.slug}`,
            },
          ]
        : []),
    ],
  }),
})

export const competitionLocations = defineLocations({
  select: {title: "name", slug: "slug.current"},
  resolve: (document) => ({
    locations: [
      {title: "Competitions", href: "/competitions"},
      ...(document?.slug
        ? [
            {
              title: document.title || "Competition",
              href: `/competitions/${document.slug}`,
            },
          ]
        : []),
    ],
  }),
})

export const videoLocations = defineLocations({
  select: {title: "title", slug: "slug.current"},
  resolve: (document) => ({
    locations: [
      {title: "Videos", href: "/videos"},
      ...(document?.slug
        ? [{title: document.title || "Video", href: `/videos/${document.slug}`}]
        : []),
    ],
  }),
})

const homeLocations = defineLocations({
  select: {title: "siteTitle"},
  resolve: (document) => ({
    locations: [{title: document?.title || "Homepage", href: "/"}],
  }),
})

const rankingLocations = defineLocations({
  select: {title: "title"},
  resolve: (document) => ({
    locations: [{title: document?.title || "Rankings", href: "/rankings"}],
  }),
})

const directoryLocations = (title: string, href: string) =>
  defineLocations({
    select: {title: "title"},
    resolve: () => ({locations: [{title, href}]}),
  })

export const presentationResolve: PresentationPluginOptions["resolve"] = {
  mainDocuments,
  locations: {
    siteSettings: homeLocations,
    story: storyLocations,
    author: directoryLocations("Stories", "/stories"),
    athlete: athleteLocations,
    competition: competitionLocations,
    video: videoLocations,
    videoSeries: directoryLocations("Videos", "/videos"),
    rankingCategory: rankingLocations,
  },
}
