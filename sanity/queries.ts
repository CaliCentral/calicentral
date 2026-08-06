import { defineQuery } from "next-sanity";

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[
    _id == "siteSettings"
  ][0]{
    siteTitle,
    shortTitle,
    siteDescription,
    prototypeNotice,
    footerStatement,
    homepageHeroEyebrow,
    homepageHeroTitle,
    homepageHeroBody,
    defaultSeo{
      metaTitle,
      metaDescription,
      noIndex,
      socialImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    }
  }
`);

export const HOMEPAGE_QUERY = defineQuery(`
  {
    "settings": *[
      _id == "siteSettings"
    ][0]{
      homepageHeroEyebrow,
      homepageHeroTitle,
      homepageHeroBody
    },
    "featuredStory": coalesce(
      *[
        _type == "story" &&
        _id == *[_id == "siteSettings"][0].featuredStory._ref &&
        defined(slug.current)
      ][0]{
        "slug": slug.current,
        title,
        excerpt,
        category,
        publishedAt,
        readTimeMinutes,
        location,
        heroVisualVariant,
        heroImage{
          asset->{
            _id,
            "_ref": _id,
            url,
            metadata{
              dimensions{width, height, aspectRatio},
              lqip
            }
          },
          crop{top, bottom, left, right},
          hotspot{x, y, width, height},
          alt,
          caption,
          credit,
          decorative
        }
      },
      *[
        _type == "story" &&
        featured == true &&
        defined(slug.current)
      ] | order(publishedAt desc)[0]{
        "slug": slug.current,
        title,
        excerpt,
        category,
        publishedAt,
        readTimeMinutes,
        location,
        heroVisualVariant,
        heroImage{
          asset->{
            _id,
            "_ref": _id,
            url,
            metadata{
              dimensions{width, height, aspectRatio},
              lqip
            }
          },
          crop{top, bottom, left, right},
          hotspot{x, y, width, height},
          alt,
          caption,
          credit,
          decorative
        }
      },
      *[
        _type == "story" &&
        defined(slug.current)
      ] | order(publishedAt desc)[0]{
        "slug": slug.current,
        title,
        excerpt,
        category,
        publishedAt,
        readTimeMinutes,
        location,
        heroVisualVariant,
        heroImage{
          asset->{
            _id,
            "_ref": _id,
            url,
            metadata{
              dimensions{width, height, aspectRatio},
              lqip
            }
          },
          crop{top, bottom, left, right},
          hotspot{x, y, width, height},
          alt,
          caption,
          credit,
          decorative
        }
      }
    ),
    "stories": *[
      _type == "story" &&
      defined(slug.current)
    ] | order(featured desc, publishedAt desc)[0...4]{
      "slug": slug.current,
      title,
      excerpt,
      category,
      publishedAt,
      readTimeMinutes,
      location,
      heroVisualVariant,
      heroImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    "athlete": coalesce(
      *[
        _type == "athlete" &&
        _id == *[_id == "siteSettings"][0].featuredAthlete._ref &&
        defined(slug.current)
      ][0]{
        "slug": slug.current,
        name,
        initials,
        profileNumber,
        profileStatus,
        city,
        state,
        country,
        region,
        primaryDiscipline,
        secondaryDisciplines,
        shortBio,
        quote,
        trainingBase,
        yearsActive,
        styleLabel,
        featured,
        rankingEligible,
        visualVariant,
        disciplineCode,
        profileImage{
          asset->{
            _id,
            "_ref": _id,
            url,
            metadata{
              dimensions{width, height, aspectRatio},
              lqip
            }
          },
          crop{top, bottom, left, right},
          hotspot{x, y, width, height},
          alt,
          caption,
          credit,
          decorative
        }
      },
      *[
        _type == "athlete" &&
        featured == true &&
        defined(slug.current)
      ] | order(profileNumber asc)[0]{
        "slug": slug.current,
        name,
        initials,
        profileNumber,
        profileStatus,
        city,
        state,
        country,
        region,
        primaryDiscipline,
        secondaryDisciplines,
        shortBio,
        quote,
        trainingBase,
        yearsActive,
        styleLabel,
        featured,
        rankingEligible,
        visualVariant,
        disciplineCode,
        profileImage{
          asset->{
            _id,
            "_ref": _id,
            url,
            metadata{
              dimensions{width, height, aspectRatio},
              lqip
            }
          },
          crop{top, bottom, left, right},
          hotspot{x, y, width, height},
          alt,
          caption,
          credit,
          decorative
        }
      },
      *[
        _type == "athlete" &&
        defined(slug.current)
      ] | order(name asc)[0]{
        "slug": slug.current,
        name,
        initials,
        profileNumber,
        profileStatus,
        city,
        state,
        country,
        region,
        primaryDiscipline,
        secondaryDisciplines,
        shortBio,
        quote,
        trainingBase,
        yearsActive,
        styleLabel,
        featured,
        rankingEligible,
        visualVariant,
        disciplineCode,
        profileImage{
          asset->{
            _id,
            "_ref": _id,
            url,
            metadata{
              dimensions{width, height, aspectRatio},
              lqip
            }
          },
          crop{top, bottom, left, right},
          hotspot{x, y, width, height},
          alt,
          caption,
          credit,
          decorative
        }
      }
    ),
    "featuredCompetition": *[
      _type == "competition" &&
      _id == *[_id == "siteSettings"][0].featuredCompetition._ref &&
      defined(slug.current)
    ][0]{
      "slug": slug.current,
      name,
      shortName,
      eventNumber,
      status,
      "contentStatus": coalesce(contentStatus, prototypeStatus),
      startDate,
      endDate,
      city,
      administrativeArea,
      state,
      country,
      venueName,
      venueType,
      summary,
      disciplines,
      primaryDiscipline,
      featured,
      registrationStatus,
      scheduleStatus,
      resultsStatus,
      capacityLabel,
      organizerName,
      competitionFormat,
      visualVariant,
      heroImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    "competitions": *[
      _type == "competition" &&
      status == "upcoming" &&
      defined(slug.current)
    ] | order(startDate asc)[0...3]{
      "slug": slug.current,
      name,
      shortName,
      eventNumber,
      status,
      "contentStatus": coalesce(contentStatus, prototypeStatus),
      startDate,
      endDate,
      city,
      administrativeArea,
      state,
      country,
      venueName,
      venueType,
      summary,
      disciplines,
      primaryDiscipline,
      featured,
      registrationStatus,
      scheduleStatus,
      resultsStatus,
      capacityLabel,
      organizerName,
      competitionFormat,
      visualVariant,
      heroImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    "featuredVideo": coalesce(
      *[
        _type == "video" &&
        _id == *[_id == "siteSettings"][0].featuredVideo._ref &&
        defined(slug.current)
      ][0]{
        "slug": slug.current,
        title,
        shortTitle,
        episodeNumber,
        "seriesSlug": series->slug.current,
        "seriesTitle": series->title,
        category,
        format,
        status,
        durationSeconds,
        publishedAt,
        location,
        summary,
        featured,
        visualVariant,
        posterLabel,
        frameCode,
        tags,
        availabilityLabel,
        sourcePlatform,
        sourceAccount,
        originalPostUrl,
        ownershipStatus,
        discoverContext,
        platformMetrics[]{platform, label, value, observedAt, sourceUrl},
        posterImage{
          asset->{
            _id,
            "_ref": _id,
            url,
            metadata{
              dimensions{width, height, aspectRatio},
              lqip
            }
          },
          crop{top, bottom, left, right},
          hotspot{x, y, width, height},
          alt,
          caption,
          credit,
          decorative
        }
      },
      *[
        _type == "video" &&
        featured == true &&
        defined(slug.current)
      ] | order(publishedAt desc)[0]{
        "slug": slug.current,
        title,
        shortTitle,
        episodeNumber,
        "seriesSlug": series->slug.current,
        "seriesTitle": series->title,
        category,
        format,
        status,
        durationSeconds,
        publishedAt,
        location,
        summary,
        featured,
        visualVariant,
        posterLabel,
        frameCode,
        tags,
        availabilityLabel,
        sourcePlatform,
        sourceAccount,
        originalPostUrl,
        ownershipStatus,
        discoverContext,
        platformMetrics[]{platform, label, value, observedAt, sourceUrl},
        posterImage{
          asset->{
            _id,
            "_ref": _id,
            url,
            metadata{
              dimensions{width, height, aspectRatio},
              lqip
            }
          },
          crop{top, bottom, left, right},
          hotspot{x, y, width, height},
          alt,
          caption,
          credit,
          decorative
        }
      }
    ),
    "videos": *[
      _type == "video" &&
      defined(slug.current)
    ] | order(featured desc, publishedAt desc)[0...4]{
      "slug": slug.current,
      title,
      shortTitle,
      episodeNumber,
      "seriesSlug": series->slug.current,
      "seriesTitle": series->title,
      category,
      format,
      status,
      durationSeconds,
      publishedAt,
      location,
      summary,
      featured,
      visualVariant,
      posterLabel,
      frameCode,
      tags,
      availabilityLabel,
      sourcePlatform,
      sourceAccount,
      originalPostUrl,
      ownershipStatus,
      discoverContext,
      platformMetrics[]{platform, label, value, observedAt, sourceUrl},
      posterImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    "rankingCategory": coalesce(
      *[
        _type == "rankingCategory" &&
        _id == *[_id == "siteSettings"][0].featuredRankingCategory._ref &&
        status == "published" &&
        methodologyStatus == "approved" &&
        defined(slug.current)
      ][0]{
        "slug": slug.current,
        title,
        subtitle,
        discipline,
        division,
        region,
        scope,
        status,
        methodologyStatus,
        seasonLabel,
        seasonStart,
        seasonEnd,
        updatedAt,
        description,
        displayOrder,
        methodologyNote,
        prototypeStatus,
        entries[0...12]{
          rank,
          "athleteSlug": athlete->slug.current,
          "athleteName": athlete->name,
          "athleteRegion": athlete->region,
          points,
          movementDirection,
          movementAmount,
          movementLabel,
          status,
          sources[]{
            "competitionSlug": competition->slug.current,
            "competitionName": competition->name,
            resultKey,
            sourceName,
            sourceUrl,
            verificationStatus
          }
        }
      },
      *[
        _type == "rankingCategory" &&
        status == "published" &&
        methodologyStatus == "approved" &&
        defined(slug.current)
      ] | order(displayOrder asc)[0]{
        "slug": slug.current,
        title,
        subtitle,
        discipline,
        division,
        region,
        scope,
        status,
        methodologyStatus,
        seasonLabel,
        seasonStart,
        seasonEnd,
        updatedAt,
        description,
        displayOrder,
        methodologyNote,
        prototypeStatus,
        entries[0...12]{
          rank,
          "athleteSlug": athlete->slug.current,
          "athleteName": athlete->name,
          "athleteRegion": athlete->region,
          points,
          movementDirection,
          movementAmount,
          movementLabel,
          status,
          sources[]{
            "competitionSlug": competition->slug.current,
            "competitionName": competition->name,
            resultKey,
            sourceName,
            sourceUrl,
            verificationStatus
          }
        }
      }
    )
  }
`);

/**
 * Public collection queries are intentionally capped for the launch
 * architecture. Add cursor-based pagination before raising these limits so
 * directory pages, static params, and discovery routes stay bounded.
 */
export const STORIES_QUERY = defineQuery(`
  *[
    _type == "story" &&
    defined(slug.current)
  ] | order(featured desc, publishedAt desc)[0...120]{
    "slug": slug.current,
    title,
    excerpt,
    category,
    "authorName": author->name,
    publishedAt,
    readTimeMinutes,
    location,
    featured,
    issueNumber,
    eyebrow,
    heroVisualVariant,
    prototypeStatus,
    heroImage{
      asset->{
        _id,
        "_ref": _id,
        url,
        metadata{
          dimensions{width, height, aspectRatio},
          lqip
        }
      },
      crop{top, bottom, left, right},
      hotspot{x, y, width, height},
      alt,
      caption,
      credit,
      decorative
    },
    seo{
      metaTitle,
      metaDescription,
      noIndex,
      socialImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    }
  }
`);

export const STORY_SLUGS_QUERY = defineQuery(`
  *[
    _type == "story" &&
    defined(slug.current)
  ] | order(featured desc, publishedAt desc)[0...120].slug.current
`);

export const STORY_PAGE_QUERY = defineQuery(`
  *[
    _type == "story" &&
    slug.current == $slug
  ][0]{
    "slug": slug.current,
    title,
    excerpt,
    category,
    "authorName": author->name,
    publishedAt,
    readTimeMinutes,
    location,
    featured,
    issueNumber,
    eyebrow,
    heroVisualVariant,
    prototypeStatus,
    tags,
    "portableBody": body[]{
      ...,
      _type == "block" => {
        markDefs[]{
          ...,
          _type == "internalStoryLink" => {
            "_type": "internalLink",
            "storySlug": story->slug.current
          }
        }
      },
      _type == "accessibleImage" => {
        "_type": "editorialImage",
        "image": {
          "asset": asset->{
            _id,
            "_ref": _id,
            url,
            metadata{
              dimensions{width, height, aspectRatio},
              lqip
            }
          },
          "crop": crop{top, bottom, left, right},
          "hotspot": hotspot{x, y, width, height},
          alt,
          caption,
          credit,
          decorative
        }
      }
    },
    heroImage{
      asset->{
        _id,
        "_ref": _id,
        url,
        metadata{
          dimensions{width, height, aspectRatio},
          lqip
        }
      },
      crop{top, bottom, left, right},
      hotspot{x, y, width, height},
      alt,
      caption,
      credit,
      decorative
    },
    seo{
      metaTitle,
      metaDescription,
      noIndex,
      socialImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    relatedStories[defined(@->slug.current)][0...3]->{
      "slug": slug.current,
      title,
      excerpt,
      category,
      "authorName": author->name,
      publishedAt,
      readTimeMinutes,
      location,
      featured,
      issueNumber,
      eyebrow,
      heroVisualVariant,
      prototypeStatus,
      heroImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    "relatedAthletes": *[
      _type == "athlete" &&
      defined(slug.current) &&
      references(^._id)
    ] | order(name asc)[0...3]{
      "slug": slug.current,
      name,
      initials,
      profileNumber,
      profileStatus,
      city,
      state,
      country,
      region,
      primaryDiscipline,
      secondaryDisciplines,
      shortBio,
      quote,
      trainingBase,
      yearsActive,
      styleLabel,
      featured,
      rankingEligible,
      visualVariant,
      disciplineCode,
      profileImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    "relatedCompetitions": *[
      _type == "competition" &&
      defined(slug.current) &&
      references(^._id)
    ] | order(startDate desc)[0...3]{
      "slug": slug.current,
      name,
      shortName,
      eventNumber,
      status,
      "contentStatus": coalesce(contentStatus, prototypeStatus),
      startDate,
      endDate,
      city,
      administrativeArea,
      state,
      country,
      venueName,
      venueType,
      summary,
      disciplines,
      primaryDiscipline,
      featured,
      registrationStatus,
      scheduleStatus,
      resultsStatus,
      capacityLabel,
      organizerName,
      competitionFormat,
      visualVariant,
      heroImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    "relatedVideos": *[
      _type == "video" &&
      defined(slug.current) &&
      references(^._id)
    ] | order(publishedAt desc)[0...3]{
      "slug": slug.current,
      title,
      shortTitle,
      episodeNumber,
      "seriesSlug": series->slug.current,
      "seriesTitle": series->title,
      category,
      format,
      status,
      durationSeconds,
      publishedAt,
      location,
      summary,
      featured,
      visualVariant,
      posterLabel,
      frameCode,
      tags,
      availabilityLabel,
      sourcePlatform,
      sourceAccount,
      originalPostUrl,
      ownershipStatus,
      discoverContext,
      platformMetrics[]{platform, label, value, observedAt, sourceUrl},
      posterImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    }
  }
`);

export const ATHLETES_QUERY = defineQuery(`
  *[
    _type == "athlete" &&
    defined(slug.current)
  ] | order(featured desc, name asc)[0...240]{
    "slug": slug.current,
    name,
    initials,
    profileNumber,
    profileStatus,
    city,
    state,
    country,
    administrativeArea,
    region,
    primaryDiscipline,
    primaryCategory,
    secondaryDisciplines,
    specialties,
    "updatedAt": _updatedAt,
    verification,
    socialLinks[]{
      platform,
      url,
      handle,
      confirmationStatus
    },
    shortBio,
    quote,
    trainingBase,
    yearsActive,
    styleLabel,
    featured,
    rankingEligible,
    visualVariant,
    disciplineCode,
    profileImage{
      asset->{
        _id,
        "_ref": _id,
        url,
        metadata{
          dimensions{width, height, aspectRatio},
          lqip
        }
      },
      crop{top, bottom, left, right},
      hotspot{x, y, width, height},
      alt,
      caption,
      credit,
      decorative
    },
    seo{
      metaTitle,
      metaDescription,
      noIndex
    }
  }
`);

export const ATHLETE_SLUGS_QUERY = defineQuery(`
  *[
    _type == "athlete" &&
    defined(slug.current)
  ] | order(featured desc, name asc)[0...240].slug.current
`);

export const ATHLETE_PAGE_QUERY = defineQuery(`
  *[
    _type == "athlete" &&
    slug.current == $slug
  ][0]{
    "slug": slug.current,
    name,
    initials,
    profileNumber,
    profileStatus,
    city,
    state,
    country,
    administrativeArea,
    region,
    primaryDiscipline,
    primaryCategory,
    secondaryDisciplines,
    specialties,
    "updatedAt": _updatedAt,
    verification,
    socialLinks[]{
      platform,
      url,
      handle,
      confirmationStatus
    },
    shortBio,
    "portableProfile": fullProfile,
    quote,
    trainingBase,
    yearsActive,
    styleLabel,
    featured,
    rankingEligible,
    visualVariant,
    disciplineCode,
    profileLabel,
    prototypeStatus,
    statistics,
    achievements,
    timeline,
    competitionHistory[]{
      "eventSlug": competition->slug.current,
      "eventName": coalesce(eventName, competition->name),
      date,
      country,
      administrativeArea,
      city,
      divisionCategory,
      placement,
      score,
      verificationStatus,
      sourceLabel,
      sourceUrl,
      videoUrl
    },
    profileImage{
      asset->{
        _id,
        "_ref": _id,
        url,
        metadata{
          dimensions{width, height, aspectRatio},
          lqip
        }
      },
      crop{top, bottom, left, right},
      hotspot{x, y, width, height},
      alt,
      caption,
      credit,
      decorative
    },
    coverImage{
      asset->{
        _id,
        "_ref": _id,
        url,
        metadata{
          dimensions{width, height, aspectRatio},
          lqip
        }
      },
      crop{top, bottom, left, right},
      hotspot{x, y, width, height},
      alt,
      caption,
      credit,
      decorative
    },
    seo{
      metaTitle,
      metaDescription,
      noIndex,
      socialImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    relatedStories[defined(@->slug.current)][0...3]->{
      "slug": slug.current,
      title,
      excerpt,
      category,
      "authorName": author->name,
      publishedAt,
      readTimeMinutes,
      location,
      featured,
      issueNumber,
      eyebrow,
      heroVisualVariant,
      prototypeStatus,
      heroImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    relatedAthletes[defined(@->slug.current)][0...3]->{
      "slug": slug.current,
      name,
      initials,
      profileNumber,
      profileStatus,
      city,
      state,
      country,
      region,
      primaryDiscipline,
      secondaryDisciplines,
      shortBio,
      quote,
      trainingBase,
      yearsActive,
      styleLabel,
      featured,
      rankingEligible,
      visualVariant,
      disciplineCode,
      profileImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    "relatedCompetitions": *[
      _type == "competition" &&
      defined(slug.current) &&
      references(^._id)
    ] | order(startDate desc)[0...3]{
      "slug": slug.current,
      name,
      shortName,
      eventNumber,
      status,
      "contentStatus": coalesce(contentStatus, prototypeStatus),
      startDate,
      endDate,
      city,
      administrativeArea,
      state,
      country,
      venueName,
      venueType,
      summary,
      disciplines,
      primaryDiscipline,
      featured,
      registrationStatus,
      scheduleStatus,
      resultsStatus,
      capacityLabel,
      organizerName,
      competitionFormat,
      visualVariant,
      heroImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    "relatedVideos": *[
      _type == "video" &&
      defined(slug.current) &&
      references(^._id)
    ] | order(publishedAt desc)[0...3]{
      "slug": slug.current,
      title,
      shortTitle,
      episodeNumber,
      "seriesSlug": series->slug.current,
      "seriesTitle": series->title,
      category,
      format,
      status,
      durationSeconds,
      publishedAt,
      location,
      summary,
      featured,
      visualVariant,
      posterLabel,
      frameCode,
      tags,
      availabilityLabel,
      sourcePlatform,
      sourceAccount,
      originalPostUrl,
      ownershipStatus,
      discoverContext,
      platformMetrics[]{platform, label, value, observedAt, sourceUrl},
      posterImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    }
  }
`);

export const RANKING_CATEGORIES_QUERY = defineQuery(`
  *[
    _type == "rankingCategory" &&
    status == "published" &&
    methodologyStatus == "approved" &&
    defined(slug.current)
  ] | order(displayOrder asc, title asc)[0...40]{
    "slug": slug.current,
    title,
    subtitle,
    discipline,
    division,
    region,
    scope,
    status,
    methodologyStatus,
    seasonLabel,
    seasonStart,
    seasonEnd,
    updatedAt,
    description,
    displayOrder,
    methodologyNote,
    prototypeStatus,
    entries[0...200]{
      rank,
      "athleteSlug": athlete->slug.current,
      "athleteName": athlete->name,
      "athleteRegion": athlete->region,
      points,
      movementDirection,
      movementAmount,
      movementLabel,
      status,
      sources[]{
        "competitionSlug": competition->slug.current,
        "competitionName": competition->name,
        resultKey,
        sourceName,
        sourceUrl,
        verificationStatus
      }
    }
  }
`);

export const COMPETITIONS_QUERY = defineQuery(`
  *[
    _type == "competition" &&
    defined(slug.current)
  ] | order(startDate asc, name asc)[0...240]{
    "slug": slug.current,
    name,
    shortName,
    eventNumber,
    status,
    "contentStatus": coalesce(contentStatus, prototypeStatus),
    startDate,
    endDate,
    city,
    administrativeArea,
    state,
    country,
    region,
    venueName,
    venueType,
    summary,
    disciplines,
    primaryDiscipline,
    featured,
    registrationStatus,
    registrationDeadline,
    scheduleStatus,
    resultsStatus,
    capacityLabel,
    organizerName,
    organizerVerificationStatus,
    actionLinks[]{
      label,
      url,
      linkType,
      affiliate,
      partnerName,
      disclosure
    },
    competitionFormat,
    results[]{
      "key": _key,
      placement,
      "athleteSlug": athlete->slug.current,
      "athleteName": coalesce(athlete->name, displayName),
      "athleteRegion": athlete->region,
      region,
      category,
      division,
      ruleset,
      bodyweightDisplay,
      scoreDisplay,
      resultLabel,
      movementNote,
      verificationStatus,
      sourceType,
      sourceName,
      sourceUrl,
      videoUrl,
      verifiedAt
    },
    visualVariant,
    heroImage{
      asset->{
        _id,
        "_ref": _id,
        url,
        metadata{
          dimensions{width, height, aspectRatio},
          lqip
        }
      },
      crop{top, bottom, left, right},
      hotspot{x, y, width, height},
      alt,
      caption,
      credit,
      decorative
    },
    seo{
      metaTitle,
      metaDescription,
      noIndex
    }
  }
`);

export const COMPETITION_SLUGS_QUERY = defineQuery(`
  *[
    _type == "competition" &&
    defined(slug.current)
  ] | order(startDate asc, name asc)[0...240].slug.current
`);

export const COMPETITION_PAGE_QUERY = defineQuery(`
  *[
    _type == "competition" &&
    slug.current == $slug
  ][0]{
    "slug": slug.current,
    name,
    shortName,
    eventNumber,
    status,
    "contentStatus": coalesce(contentStatus, prototypeStatus),
    startDate,
    endDate,
    city,
    administrativeArea,
    state,
    country,
    region,
    venueName,
    venueType,
    summary,
    "portableDescription": description,
    disciplines,
    primaryDiscipline,
    divisions[]{
      "slug": coalesce(slug.current, _key),
      name,
      discipline,
      level,
      format,
      participantLimit,
      description
    },
    featured,
    registrationStatus,
    registrationDeadline,
    scheduleStatus,
    resultsStatus,
    capacityLabel,
    organizerName,
    organizerVerificationStatus,
    actionLinks[]{
      label,
      url,
      linkType,
      affiliate,
      partnerName,
      disclosure
    },
    competitionFormat,
    visualVariant,
    schedule[]{
      time,
      "label": coalesce(label, title),
      description,
      stage,
      status
    },
    participants[]{
      "athleteSlug": athlete->slug.current,
      "athleteName": coalesce(athlete->name, displayName),
      city,
      discipline,
      seed,
      status
    },
    results[]{
      "key": _key,
      placement,
      "athleteSlug": athlete->slug.current,
      "athleteName": coalesce(athlete->name, displayName),
      "athleteRegion": athlete->region,
      region,
      category,
      division,
      ruleset,
      bodyweightDisplay,
      scoreDisplay,
      resultLabel,
      movementNote,
      verificationStatus,
      sourceType,
      sourceName,
      sourceUrl,
      videoUrl,
      verifiedAt
    },
    timeline,
    notices,
    heroImage{
      asset->{
        _id,
        "_ref": _id,
        url,
        metadata{
          dimensions{width, height, aspectRatio},
          lqip
        }
      },
      crop{top, bottom, left, right},
      hotspot{x, y, width, height},
      alt,
      caption,
      credit,
      decorative
    },
    seo{
      metaTitle,
      metaDescription,
      noIndex,
      socialImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    relatedStories[defined(@->slug.current)][0...3]->{
      "slug": slug.current,
      title,
      excerpt,
      category,
      "authorName": author->name,
      publishedAt,
      readTimeMinutes,
      location,
      featured,
      issueNumber,
      eyebrow,
      heroVisualVariant,
      prototypeStatus,
      heroImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    relatedAthletes[defined(@->slug.current)][0...3]->{
      "slug": slug.current,
      name,
      initials,
      profileNumber,
      profileStatus,
      city,
      state,
      country,
      region,
      primaryDiscipline,
      secondaryDisciplines,
      shortBio,
      quote,
      trainingBase,
      yearsActive,
      styleLabel,
      featured,
      rankingEligible,
      visualVariant,
      disciplineCode,
      profileImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    relatedCompetitions[defined(@->slug.current)][0...3]->{
      "slug": slug.current,
      name,
      shortName,
      eventNumber,
      status,
      "contentStatus": coalesce(contentStatus, prototypeStatus),
      startDate,
      endDate,
      city,
      administrativeArea,
      state,
      country,
      region,
      venueName,
      venueType,
      summary,
      disciplines,
      primaryDiscipline,
      featured,
      registrationStatus,
      scheduleStatus,
      resultsStatus,
      capacityLabel,
      organizerName,
      competitionFormat,
      visualVariant,
      heroImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    "relatedVideos": *[
      _type == "video" &&
      defined(slug.current) &&
      references(^._id)
    ] | order(publishedAt desc)[0...3]{
      "slug": slug.current,
      title,
      shortTitle,
      episodeNumber,
      "seriesSlug": series->slug.current,
      "seriesTitle": series->title,
      category,
      format,
      status,
      durationSeconds,
      publishedAt,
      location,
      summary,
      featured,
      visualVariant,
      posterLabel,
      frameCode,
      tags,
      availabilityLabel,
      sourcePlatform,
      sourceAccount,
      originalPostUrl,
      ownershipStatus,
      discoverContext,
      platformMetrics[]{platform, label, value, observedAt, sourceUrl},
      posterImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    }
  }
`);

export const VIDEOS_PAGE_QUERY = defineQuery(`
  {
    "series": *[
      _type == "videoSeries" &&
      defined(slug.current)
    ] | order(displayOrder asc, title asc)[0...40]{
      "slug": slug.current,
      title,
      description,
      categoryFocus,
      displayOrder
    },
    "videos": *[
      _type == "video" &&
      defined(slug.current)
    ] | order(featured desc, publishedAt desc)[0...180]{
      "slug": slug.current,
      title,
      shortTitle,
      episodeNumber,
      "seriesSlug": series->slug.current,
      "seriesTitle": series->title,
      category,
      format,
      status,
      durationSeconds,
      publishedAt,
      location,
      summary,
      featured,
      visualVariant,
      posterLabel,
      frameCode,
      tags,
      availabilityLabel,
      sourcePlatform,
      sourceAccount,
      originalPostUrl,
      ownershipStatus,
      discoverContext,
      platformMetrics[]{platform, label, value, observedAt, sourceUrl},
      posterImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      },
      seo{
        metaTitle,
        metaDescription,
        noIndex
      }
    },
    "featuredVideo": coalesce(
      *[
        _type == "video" &&
        _id == *[_id == "siteSettings"][0].featuredVideo._ref &&
        defined(slug.current)
      ][0]{
        "slug": slug.current,
        title,
        shortTitle,
        episodeNumber,
        "seriesSlug": series->slug.current,
        "seriesTitle": series->title,
        category,
        format,
        status,
        durationSeconds,
        publishedAt,
        location,
        summary,
        featured,
        visualVariant,
        posterLabel,
        frameCode,
        tags,
        availabilityLabel,
        sourcePlatform,
        sourceAccount,
        originalPostUrl,
        ownershipStatus,
        discoverContext,
        platformMetrics[]{platform, label, value, observedAt, sourceUrl},
        posterImage{
          asset->{
            _id,
            "_ref": _id,
            url,
            metadata{
              dimensions{width, height, aspectRatio},
              lqip
            }
          },
          crop{top, bottom, left, right},
          hotspot{x, y, width, height},
          alt,
          caption,
          credit,
          decorative
        }
      },
      *[
        _type == "video" &&
        featured == true &&
        defined(slug.current)
      ] | order(publishedAt desc)[0]{
        "slug": slug.current,
        title,
        shortTitle,
        episodeNumber,
        "seriesSlug": series->slug.current,
        "seriesTitle": series->title,
        category,
        format,
        status,
        durationSeconds,
        publishedAt,
        location,
        summary,
        featured,
        visualVariant,
        posterLabel,
        frameCode,
        tags,
        availabilityLabel,
        sourcePlatform,
        sourceAccount,
        originalPostUrl,
        ownershipStatus,
        discoverContext,
        platformMetrics[]{platform, label, value, observedAt, sourceUrl},
        posterImage{
          asset->{
            _id,
            "_ref": _id,
            url,
            metadata{
              dimensions{width, height, aspectRatio},
              lqip
            }
          },
          crop{top, bottom, left, right},
          hotspot{x, y, width, height},
          alt,
          caption,
          credit,
          decorative
        }
      }
    )
  }
`);

export const VIDEO_SLUGS_QUERY = defineQuery(`
  *[
    _type == "video" &&
    defined(slug.current)
  ] | order(featured desc, publishedAt desc)[0...180].slug.current
`);

export const VIDEO_PAGE_QUERY = defineQuery(`
  *[
    _type == "video" &&
    slug.current == $slug
  ][0]{
    "slug": slug.current,
    title,
    shortTitle,
    episodeNumber,
    "seriesSlug": series->slug.current,
    "seriesTitle": series->title,
    category,
    format,
    status,
    durationSeconds,
    publishedAt,
    location,
    summary,
    "portableDescription": description,
    editorialNotes,
    featured,
    visualVariant,
    posterLabel,
    frameCode,
    chapters,
    transcript,
    credits,
    tags,
    availabilityLabel,
    sourcePlatform,
    sourceAccount,
    originalPostUrl,
    ownershipStatus,
    discoverContext,
    platformMetrics[]{platform, label, value, observedAt, sourceUrl},
    posterImage{
      asset->{
        _id,
        "_ref": _id,
        url,
        metadata{
          dimensions{width, height, aspectRatio},
          lqip
        }
      },
      crop{top, bottom, left, right},
      hotspot{x, y, width, height},
      alt,
      caption,
      credit,
      decorative
    },
    seo{
      metaTitle,
      metaDescription,
      noIndex,
      socialImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    relatedStories[defined(@->slug.current)][0...3]->{
      "slug": slug.current,
      title,
      excerpt,
      category,
      "authorName": author->name,
      publishedAt,
      readTimeMinutes,
      location,
      featured,
      issueNumber,
      eyebrow,
      heroVisualVariant,
      prototypeStatus,
      heroImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    relatedAthletes[defined(@->slug.current)][0...3]->{
      "slug": slug.current,
      name,
      initials,
      profileNumber,
      profileStatus,
      city,
      state,
      country,
      region,
      primaryDiscipline,
      secondaryDisciplines,
      shortBio,
      quote,
      trainingBase,
      yearsActive,
      styleLabel,
      featured,
      rankingEligible,
      visualVariant,
      disciplineCode,
      profileImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    relatedCompetitions[defined(@->slug.current)][0...3]->{
      "slug": slug.current,
      name,
      shortName,
      eventNumber,
      status,
      "contentStatus": coalesce(contentStatus, prototypeStatus),
      startDate,
      endDate,
      city,
      administrativeArea,
      state,
      country,
      region,
      venueName,
      venueType,
      summary,
      disciplines,
      primaryDiscipline,
      featured,
      registrationStatus,
      scheduleStatus,
      resultsStatus,
      capacityLabel,
      organizerName,
      competitionFormat,
      visualVariant,
      heroImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    },
    relatedVideos[defined(@->slug.current)][0...3]->{
      "slug": slug.current,
      title,
      shortTitle,
      episodeNumber,
      "seriesSlug": series->slug.current,
      "seriesTitle": series->title,
      category,
      format,
      status,
      durationSeconds,
      publishedAt,
      location,
      summary,
      featured,
      visualVariant,
      posterLabel,
      frameCode,
      tags,
      availabilityLabel,
      sourcePlatform,
      sourceAccount,
      originalPostUrl,
      ownershipStatus,
      discoverContext,
      platformMetrics[]{platform, label, value, observedAt, sourceUrl},
      posterImage{
        asset->{
          _id,
          "_ref": _id,
          url,
          metadata{
            dimensions{width, height, aspectRatio},
            lqip
          }
        },
        crop{top, bottom, left, right},
        hotspot{x, y, width, height},
        alt,
        caption,
        credit,
        decorative
      }
    }
  }
`);
