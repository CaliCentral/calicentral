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
  documentWithSlug("team", "/teams/:slug"),
  documentWithSlug("video", "/videos/:slug"),
  documentWithSlug("organization", "/organizations/:slug"),
  documentWithSlug("product", "/shop/:slug"),
  {
    route: "/standings",
    filter: `_type == "rankingCategory"`,
  },
  {
    route: "/rankings",
    filter: `_type in ["rankingProvider", "rankingSystem", "rankingSnapshot"]`,
  },
  {
    route: "/wcl/rules",
    filter: `_type == "ruleset"`,
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

export const teamLocations = defineLocations({
  select: {title: "name", slug: "slug.current"},
  resolve: (document) => ({
    locations: [
      {title: "Teams", href: "/teams"},
      ...(document?.slug ? [{title: document.title || "Team", href: `/teams/${document.slug}`}] : []),
    ],
  }),
})

export const organizationLocations = defineLocations({
  select: {title: "name", slug: "slug.current"},
  resolve: (document) => ({
    locations: document?.slug
      ? [{title: document.title || "Organization", href: `/organizations/${document.slug}`}]
      : [],
  }),
})

export const productLocations = defineLocations({
  select: {title: "name", slug: "slug.current"},
  resolve: (document) => ({
    locations: [
      {title: "Shop", href: "/shop"},
      ...(document?.slug ? [{title: document.title || "Product", href: `/shop/${document.slug}`}] : []),
    ],
  }),
})

const homeLocations = defineLocations({
  select: {title: "siteTitle"},
  resolve: (document) => ({
    locations: [{title: document?.title || "Homepage", href: "/"}],
  }),
})

const standingLocations = defineLocations({
  select: {title: "title"},
  resolve: (document) => ({
    locations: [{title: document?.title || "Standings", href: "/standings"}],
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
    team: teamLocations,
    teamSeason: directoryLocations("Teams", "/teams"),
    video: videoLocations,
    videoSeries: directoryLocations("Videos", "/videos"),
    rankingCategory: standingLocations,
    rankingProvider: directoryLocations("Athlete rankings", "/rankings"),
    rankingSystem: directoryLocations("Athlete rankings", "/rankings"),
    rankingSnapshot: directoryLocations("Athlete rankings", "/rankings"),
    ruleset: directoryLocations("WCL rules", "/wcl/rules"),
    organization: organizationLocations,
    product: productLocations,
  },
}
