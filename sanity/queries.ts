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

export const ORGANIZATIONS_QUERY = defineQuery(`
  *[
    _type == "organization" &&
    defined(slug.current) &&
    publicStatus == "published"
  ] | order(name asc)[0...300]{
    "canonicalId": _id,
    "slug": slug.current,
    name,
    organizationType,
    description,
    website,
    country,
    administrativeArea,
    city,
    geographicScope,
    disciplines,
    socialLinks[]{label, url},
    "lifecycleStatus": status,
    prototypeStatus,
    logo{
      asset->{_id, "_ref": _id, url, metadata{dimensions{width, height, aspectRatio}, lqip}},
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
        asset->{_id, "_ref": _id, url, metadata{dimensions{width, height, aspectRatio}, lqip}},
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

export const ORGANIZATION_SLUGS_QUERY = defineQuery(`
  *[
    _type == "organization" &&
    defined(slug.current) &&
    publicStatus == "published"
  ].slug.current
`);

export const ORGANIZATION_PAGE_QUERY = defineQuery(`
  *[
    _type == "organization" &&
    slug.current == $slug &&
    publicStatus == "published"
  ][0]{
    "canonicalId": _id,
    "slug": slug.current,
    name,
    organizationType,
    description,
    website,
    country,
    administrativeArea,
    city,
    geographicScope,
    disciplines,
    socialLinks[]{label, url},
    "lifecycleStatus": status,
    prototypeStatus,
    logo{
      asset->{_id, "_ref": _id, url, metadata{dimensions{width, height, aspectRatio}, lqip}},
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
        asset->{_id, "_ref": _id, url, metadata{dimensions{width, height, aspectRatio}, lqip}},
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

export const PRODUCTS_QUERY = defineQuery(`
  *[
    _type == "product" &&
    defined(slug.current) &&
    status == "published" &&
    brand->publicStatus == "published"
  ] | order(featured desc, name asc)[0...300]{
    "canonicalId": _id,
    "slug": slug.current,
    name,
    "brand": brand->{"canonicalId": _id, "slug": slug.current, name, organizationType, logo{asset->{_id, "_ref": _id, url, metadata{dimensions{width, height, aspectRatio}, lqip}}, alt, decorative}},
    "retailer": select(retailer->publicStatus == "published" => retailer->{"canonicalId": _id, "slug": slug.current, name, organizationType, logo{asset->{_id, "_ref": _id, url, metadata{dimensions{width, height, aspectRatio}, lqip}}, alt, decorative}}),
    category,
    subcategory,
    images[]{asset->{_id, "_ref": _id, url, metadata{dimensions{width, height, aspectRatio}, lqip}}, crop{top, bottom, left, right}, hotspot{x, y, width, height}, alt, caption, credit, decorative},
    shortDescription,
    editorialSummary,
    useCases,
    disciplines,
    trainingLevel,
    environments,
    portable,
    priceDisplay,
    currency,
    standardProductUrl,
    affiliateUrl,
    affiliateNetwork,
    affiliateStatus,
    countryAvailability,
    featured,
    editorPick,
    sponsored,
    commercialRelationship,
    lastCheckedAt,
    availabilityNote,
    disclosure,
    prototypeStatus,
    seo{metaTitle, metaDescription, noIndex, socialImage{asset->{_id, "_ref": _id, url, metadata{dimensions{width, height, aspectRatio}, lqip}}, alt, decorative}}
  }
`);

export const PRODUCT_SLUGS_QUERY = defineQuery(`
  *[
    _type == "product" &&
    defined(slug.current) &&
    status == "published" &&
    brand->publicStatus == "published"
  ].slug.current
`);

export const PRODUCT_PAGE_QUERY = defineQuery(`
  *[
    _type == "product" &&
    slug.current == $slug &&
    status == "published" &&
    brand->publicStatus == "published"
  ][0]{
    "canonicalId": _id,
    "slug": slug.current,
    name,
    "brand": brand->{"canonicalId": _id, "slug": slug.current, name, organizationType, logo{asset->{_id, "_ref": _id, url, metadata{dimensions{width, height, aspectRatio}, lqip}}, alt, decorative}},
    "retailer": select(retailer->publicStatus == "published" => retailer->{"canonicalId": _id, "slug": slug.current, name, organizationType, logo{asset->{_id, "_ref": _id, url, metadata{dimensions{width, height, aspectRatio}, lqip}}, alt, decorative}}),
    category,
    subcategory,
    images[]{asset->{_id, "_ref": _id, url, metadata{dimensions{width, height, aspectRatio}, lqip}}, crop{top, bottom, left, right}, hotspot{x, y, width, height}, alt, caption, credit, decorative},
    shortDescription,
    editorialSummary,
    useCases,
    disciplines,
    trainingLevel,
    environments,
    portable,
    priceDisplay,
    currency,
    standardProductUrl,
    affiliateUrl,
    affiliateNetwork,
    affiliateStatus,
    countryAvailability,
    featured,
    editorPick,
    sponsored,
    commercialRelationship,
    lastCheckedAt,
    availabilityNote,
    disclosure,
    prototypeStatus,
    seo{metaTitle, metaDescription, noIndex, socialImage{asset->{_id, "_ref": _id, url, metadata{dimensions{width, height, aspectRatio}, lqip}}, alt, decorative}}
  }
`);

export const TEAMS_QUERY = defineQuery(`
  *[
    _type == "team" &&
    defined(slug.current) &&
    publicStatus in ["approved-prospective", "official", "active", "inactive"]
  ] | order(featured desc, name asc)[0...200]{
    "canonicalId": _id,
    "slug": slug.current,
    name,
    shortName,
    code,
    teamType,
    publicStatus,
    leagueAdmissionStatus,
    country,
    administrativeArea,
    city,
    trainingBase,
    foundingYear,
    description,
    disciplines,
    branding{primaryColor, secondaryColor, accentColor, uniformNotes, approvalStatus},
    socialLinks[]{label, url},
    featured,
    prototypeStatus,
    seo{metaTitle, metaDescription, noIndex},
    "seasonLabel": currentSeason->seasonLabel,
    "roster": currentSeason->members[
      membershipStatus == "active" &&
      consentStatus == "accepted" &&
      (
        athlete->verification.profileStatus == "approved" ||
        athlete->prototypeStatus in ["fictional-prototype", "sample-record"]
      )
    ]{
      "canonicalId": _key,
      role,
      specialty,
      athleteNumber,
      captain,
      athlete->{"canonicalId": _id, "slug": slug.current, name}
    }
  }
`);

export const TEAM_SLUGS_QUERY = defineQuery(`
  *[
    _type == "team" &&
    defined(slug.current) &&
    publicStatus in ["approved-prospective", "official", "active", "inactive"]
  ].slug.current
`);

export const TEAM_PAGE_QUERY = defineQuery(`
  *[
    _type == "team" &&
    slug.current == $slug &&
    publicStatus in ["approved-prospective", "official", "active", "inactive"]
  ][0]{
    "canonicalId": _id,
    "slug": slug.current,
    name,
    shortName,
    code,
    teamType,
    publicStatus,
    leagueAdmissionStatus,
    country,
    administrativeArea,
    city,
    trainingBase,
    foundingYear,
    description,
    disciplines,
    branding{primaryColor, secondaryColor, accentColor, uniformNotes, approvalStatus},
    socialLinks[]{label, url},
    featured,
    prototypeStatus,
    seo{metaTitle, metaDescription, noIndex},
    "seasonLabel": currentSeason->seasonLabel,
    "roster": currentSeason->members[
      membershipStatus == "active" &&
      consentStatus == "accepted" &&
      (
        athlete->verification.profileStatus == "approved" ||
        athlete->prototypeStatus in ["fictional-prototype", "sample-record"]
      )
    ]{
      "canonicalId": _key,
      role,
      specialty,
      athleteNumber,
      captain,
      athlete->{"canonicalId": _id, "slug": slug.current, name}
    }
  }
`);

export const ATHLETE_RANKING_SNAPSHOTS_QUERY = defineQuery(`
  *[
    _type == "rankingSnapshot" &&
    publicationStatus == "published" &&
    rankingSystem->status == "active" &&
    rankingSystem->provider->status == "active" &&
    source.verificationStatus in ["source-confirmed", "official"] &&
    defined(source.url)
  ] | order(rankingDate desc)[0...50]{
    "canonicalId": _id,
    rankingDate,
    sourcePublishedAt,
    checkedAt,
    season,
    methodologyVersion,
    "systemName": rankingSystem->name,
    "systemSlug": rankingSystem->slug.current,
    "rankingKind": rankingSystem->rankingKind,
    "discipline": rankingSystem->discipline,
    "movement": rankingSystem->movement,
    "category": rankingSystem->category,
    "division": rankingSystem->division,
    "weightClass": rankingSystem->weightClass,
    "sexDivision": rankingSystem->sexDivision,
    "ageGroup": rankingSystem->ageGroup,
    "geographicScope": rankingSystem->geographicScope,
    "provider": rankingSystem->provider->{
      "canonicalId": _id,
      "slug": slug.current,
      name,
      "organizationId": organization->_id,
      website,
      description,
      status,
      disciplines,
      geographicScope,
      integrationMethod,
      attributionRequirement,
      lastReviewedAt
    },
    entries[
      athlete->verification.profileStatus == "approved" ||
      athlete->prototypeStatus in ["fictional-prototype", "sample-record"]
    ][0...500]{
      "canonicalId": _key,
      sourceDisplayName,
      position,
      points,
      rating,
      previousPosition,
      status,
      athlete->{"canonicalId": _id, "slug": slug.current, name}
    },
    "provenance": source{
      "title": sourceTitle,
      "type": sourceType,
      url,
      externalRecordId,
      publishedAt,
      checkedAt,
      verificationStatus
    }
  }
`);

// These projections are editor-only data-transfer objects. They intentionally
// omit private review notes while retaining draft lifecycle state. Public
// ranking and athlete queries above remain independently gated.
export const ADMIN_ATHLETES_QUERY = defineQuery(`
  *[_type == "athlete"] | order(name asc)[0...1000]{
    "canonicalId": _id,
    "slug": slug.current,
    name,
    country,
    prototypeStatus,
    rankingEligible,
    verification{
      identityStatus,
      profileStatus
    }
  }
`);

export const ADMIN_ATHLETE_DIRECTORY_QUERY = defineQuery(`
  {
    "items": *[
      _type == "athlete" &&
      ($q == "" || name match $q || _id match $q || country match $q) &&
      ($profileStatus == "" || verification.profileStatus == $profileStatus) &&
      ($prototypeStatus == "" || ($prototypeStatus == "real" && !defined(prototypeStatus)) || prototypeStatus == $prototypeStatus) &&
      ($country == "" || country == $country) &&
      (
        $sourceStatus == "all" ||
        ($sourceStatus == "linked" && count(*[_type == "externalAthleteIdentity" && references(^._id)]) > 0) ||
        ($sourceStatus == "unlinked" && count(*[_type == "externalAthleteIdentity" && references(^._id)]) == 0)
      ) &&
      (
        $rankingStatus == "all" ||
        ($rankingStatus == "linked" && count(*[_type == "rankingSnapshot" && references(^._id)]) > 0) ||
        ($rankingStatus == "unlinked" && count(*[_type == "rankingSnapshot" && references(^._id)]) == 0)
      )
    ] | order(name asc, _id asc)[$offset...$end]{
      "canonicalId": _id,
      "slug": slug.current,
      name,
      country,
      prototypeStatus,
      rankingEligible,
      "externalIdentityCount": count(*[_type == "externalAthleteIdentity" && references(^._id)]),
      "rankingSnapshotCount": count(*[_type == "rankingSnapshot" && references(^._id)]),
      verification{
        identityStatus,
        profileStatus
      }
    },
    "total": count(*[
      _type == "athlete" &&
      ($q == "" || name match $q || _id match $q || country match $q) &&
      ($profileStatus == "" || verification.profileStatus == $profileStatus) &&
      ($prototypeStatus == "" || ($prototypeStatus == "real" && !defined(prototypeStatus)) || prototypeStatus == $prototypeStatus) &&
      ($country == "" || country == $country) &&
      (
        $sourceStatus == "all" ||
        ($sourceStatus == "linked" && count(*[_type == "externalAthleteIdentity" && references(^._id)]) > 0) ||
        ($sourceStatus == "unlinked" && count(*[_type == "externalAthleteIdentity" && references(^._id)]) == 0)
      ) &&
      (
        $rankingStatus == "all" ||
        ($rankingStatus == "linked" && count(*[_type == "rankingSnapshot" && references(^._id)]) > 0) ||
        ($rankingStatus == "unlinked" && count(*[_type == "rankingSnapshot" && references(^._id)]) == 0)
      )
    ]),
    "awaitingProfileReview": count(*[
      _type == "athlete" && verification.profileStatus == "not-reviewed"
    ]),
    "sampleRecords": count(*[
      _type == "athlete" && prototypeStatus == "sample-record"
    ]),
    "countries": array::unique(*[
      _type == "athlete" && defined(country)
    ].country)
  }
`);

export const ADMIN_ATHLETE_DETAIL_QUERY = defineQuery(`
  {
    "athlete": *[
      _type == "athlete" && (_id == $id || slug.current == $id)
    ][0]{
      "canonicalId": _id,
      "slug": slug.current,
      name,
      country,
      prototypeStatus,
      rankingEligible,
      verification{
        identityStatus,
        profileStatus
      }
    },
    "identities": *[
      _type == "externalAthleteIdentity" &&
      (athlete._ref == $id || athlete->slug.current == $id)
    ] | order(provider->name asc, providerDisplayName asc)[0...100]{
      "canonicalId": _id,
      providerAthleteId,
      providerAthleteUrl,
      providerDisplayName,
      matchingStatus,
      reviewStatus,
      "athlete": athlete->{
        "canonicalId": _id,
        "slug": slug.current,
        name
      },
      "provider": provider->{
        "canonicalId": _id,
        "slug": slug.current,
        name,
        website,
        status,
        disciplines,
        geographicScope,
        integrationMethod,
        attributionRequirement,
        lastReviewedAt
      }
    },
    "rankings": *[
      _type == "rankingSnapshot" &&
      count(entries[athlete._ref == $id || athlete->slug.current == $id]) > 0
    ] | order(rankingDate desc, _id asc)[0...100]{
      "canonicalId": _id,
      publicationStatus,
      rankingDate,
      sourcePublishedAt,
      checkedAt,
      season,
      methodologyVersion,
      "entryCount": count(entries),
      "system": rankingSystem->{
        "canonicalId": _id,
        name,
        "slug": slug.current,
        status,
        rankingKind,
        discipline,
        movement,
        category,
        division,
        weightClass,
        sexDivision,
        ageGroup,
        geographicScope,
        methodologyVersion,
        "provider": provider->{
          "canonicalId": _id,
          "slug": slug.current,
          name,
          website,
          status,
          disciplines,
          geographicScope,
          integrationMethod,
          attributionRequirement,
          lastReviewedAt
        }
      },
      entries[athlete._ref == $id || athlete->slug.current == $id][0...20]{
        "canonicalId": _key,
        providerAthleteId,
        sourceDisplayName,
        position,
        points,
        rating,
        previousPosition,
        status,
        athlete->{
          "canonicalId": _id,
          "slug": slug.current,
          name
        }
      },
      "provenance": source{
        "title": sourceTitle,
        "type": sourceType,
        url,
        externalRecordId,
        publishedAt,
        checkedAt,
        verificationStatus
      }
    }
  }
`);

export const ADMIN_RANKING_PROVIDERS_QUERY = defineQuery(`
  *[_type == "rankingProvider"] | order(name asc)[0...200]{
    "canonicalId": _id,
    "slug": slug.current,
    name,
    website,
    status,
    disciplines,
    geographicScope,
    integrationMethod,
    attributionRequirement,
    lastReviewedAt
  }
`);

export const ADMIN_RANKING_SYSTEMS_QUERY = defineQuery(`
  *[_type == "rankingSystem"] | order(name asc)[0...500]{
    "canonicalId": _id,
    name,
    "slug": slug.current,
    status,
    rankingKind,
    discipline,
    movement,
    category,
    division,
    weightClass,
    sexDivision,
    ageGroup,
    geographicScope,
    methodologyVersion,
    "provider": provider->{
      "canonicalId": _id,
      "slug": slug.current,
      name,
      website,
      status,
      disciplines,
      geographicScope,
      integrationMethod,
      attributionRequirement,
      lastReviewedAt
    }
  }
`);

export const ADMIN_ATHLETE_RANKING_SNAPSHOTS_QUERY = defineQuery(`
  *[_type == "rankingSnapshot"] | order(rankingDate desc)[0...500]{
    "canonicalId": _id,
    publicationStatus,
    rankingDate,
    sourcePublishedAt,
    checkedAt,
    season,
    methodologyVersion,
    "system": rankingSystem->{
      "canonicalId": _id,
      name,
      "slug": slug.current,
      status,
      rankingKind,
      discipline,
      movement,
      category,
      division,
      weightClass,
      sexDivision,
      ageGroup,
      geographicScope,
      methodologyVersion,
      "provider": provider->{
        "canonicalId": _id,
        "slug": slug.current,
        name,
        website,
        status,
        disciplines,
        geographicScope,
        integrationMethod,
        attributionRequirement,
        lastReviewedAt
      }
    },
    entries[0...1000]{
      "canonicalId": _key,
      providerAthleteId,
      sourceDisplayName,
      position,
      points,
      rating,
      previousPosition,
      status,
      athlete->{
        "canonicalId": _id,
        "slug": slug.current,
        name
      }
    },
    "provenance": source{
      "title": sourceTitle,
      "type": sourceType,
      url,
      externalRecordId,
      publishedAt,
      checkedAt,
      verificationStatus,
      "provider": provider->{
        "canonicalId": _id,
        name
      }
    }
  }
`);

export const ADMIN_RANKING_OVERVIEW_QUERY = defineQuery(`
  {
    "canonicalAthletes": count(*[_type == "athlete"]),
    "rankingLinkedAthletes": count(array::unique(
      *[_type == "rankingSnapshot"].entries[defined(athlete._ref)].athlete._ref
    )),
    "snapshots": count(*[_type == "rankingSnapshot"]),
    "draftSnapshots": count(*[
      _type == "rankingSnapshot" && publicationStatus == "draft"
    ]),
    "draftSystems": count(*[
      _type == "rankingSystem" && status == "draft"
    ]),
    "providersUnderReview": count(*[
      _type == "rankingProvider" && status == "under-review"
    ]),
    "candidateIdentities": count(*[
      _type == "externalAthleteIdentity" && matchingStatus == "candidate"
    ])
  }
`);

export const ADMIN_RANKING_SNAPSHOT_DIRECTORY_QUERY = defineQuery(`
  {
    "items": *[
      _type == "rankingSnapshot" &&
      ($q == "" || _id match $q || rankingSystem->name match $q || rankingSystem->provider->name match $q) &&
      ($status == "" || publicationStatus == $status) &&
      ($providerId == "" || rankingSystem->provider._ref == $providerId)
    ] | order(rankingDate desc, _id asc)[$offset...$end]{
      "canonicalId": _id,
      publicationStatus,
      rankingDate,
      sourcePublishedAt,
      checkedAt,
      season,
      methodologyVersion,
      "entryCount": count(entries),
      "system": rankingSystem->{
        "canonicalId": _id,
        name,
        "slug": slug.current,
        status,
        rankingKind,
        discipline,
        movement,
        category,
        division,
        weightClass,
        sexDivision,
        ageGroup,
        geographicScope,
        methodologyVersion,
        "provider": provider->{
          "canonicalId": _id,
          "slug": slug.current,
          name,
          website,
          status,
          disciplines,
          geographicScope,
          integrationMethod,
          attributionRequirement,
          lastReviewedAt
        }
      },
      entries[0...12]{
        "canonicalId": _key,
        providerAthleteId,
        sourceDisplayName,
        position,
        points,
        rating,
        previousPosition,
        status,
        athlete->{
          "canonicalId": _id,
          "slug": slug.current,
          name
        }
      },
      "provenance": source{
        "title": sourceTitle,
        "type": sourceType,
        url,
        externalRecordId,
        publishedAt,
        checkedAt,
        verificationStatus
      }
    },
    "total": count(*[
      _type == "rankingSnapshot" &&
      ($q == "" || _id match $q || rankingSystem->name match $q || rankingSystem->provider->name match $q) &&
      ($status == "" || publicationStatus == $status) &&
      ($providerId == "" || rankingSystem->provider._ref == $providerId)
    ])
  }
`);

export const ADMIN_RANKING_SNAPSHOT_DETAIL_QUERY = defineQuery(`
  *[_type == "rankingSnapshot" && _id == $id][0]{
    "canonicalId": _id,
    publicationStatus,
    rankingDate,
    sourcePublishedAt,
    checkedAt,
    season,
    methodologyVersion,
    "entryCount": count(entries),
    "system": rankingSystem->{
      "canonicalId": _id,
      name,
      "slug": slug.current,
      status,
      rankingKind,
      discipline,
      movement,
      category,
      division,
      weightClass,
      sexDivision,
      ageGroup,
      geographicScope,
      methodologyVersion,
      "provider": provider->{
        "canonicalId": _id,
        "slug": slug.current,
        name,
        website,
        status,
        disciplines,
        geographicScope,
        integrationMethod,
        attributionRequirement,
        lastReviewedAt
      }
    },
    entries[0...1000]{
      "canonicalId": _key,
      providerAthleteId,
      sourceDisplayName,
      position,
      points,
      rating,
      previousPosition,
      status,
      athlete->{
        "canonicalId": _id,
        "slug": slug.current,
        name
      }
    },
    "provenance": source{
      "title": sourceTitle,
      "type": sourceType,
      url,
      externalRecordId,
      publishedAt,
      checkedAt,
      verificationStatus
    }
  }
`);

export const ADMIN_EXTERNAL_ATHLETE_IDENTITIES_QUERY = defineQuery(`
  *[_type == "externalAthleteIdentity"] | order(providerDisplayName asc)[0...2000]{
    "canonicalId": _id,
    providerAthleteId,
    providerAthleteUrl,
    providerDisplayName,
    matchingStatus,
    reviewStatus,
    athlete->{
      "canonicalId": _id,
      "slug": slug.current,
      name
    },
    "provider": provider->{
      "canonicalId": _id,
      "slug": slug.current,
      name,
      website,
      status,
      disciplines,
      geographicScope,
      integrationMethod,
      attributionRequirement,
      lastReviewedAt
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
        defined(slug.current) &&
        (
          verification.profileStatus == "approved" ||
          prototypeStatus in ["fictional-prototype", "sample-record"]
        )
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
        defined(slug.current) &&
        (
          verification.profileStatus == "approved" ||
          prototypeStatus in ["fictional-prototype", "sample-record"]
        )
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
        defined(slug.current) &&
        (
          verification.profileStatus == "approved" ||
          prototypeStatus in ["fictional-prototype", "sample-record"]
        )
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
      defined(slug.current) &&
      (
        (
          publicStatus == "published" &&
          (
            coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"] ||
            (source.verificationStatus in ["source-confirmed", "official"] && defined(source.url))
          )
        ) ||
        (!defined(publicStatus) && coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"])
      )
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
      defined(slug.current) &&
      (
        (
          publicStatus == "published" &&
          (
            coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"] ||
            (source.verificationStatus in ["source-confirmed", "official"] && defined(source.url))
          )
        ) ||
        (!defined(publicStatus) && coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"])
      )
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
        origin,
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
        origin,
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
      origin,
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
        entries[
          athlete->verification.profileStatus == "approved" ||
          athlete->prototypeStatus in ["fictional-prototype", "sample-record"]
        ][0...12]{
          rank,
          "athleteSlug": athlete->slug.current,
          "athleteName": athlete->name,
          "athleteRegion": athlete->region,
          points,
          movementDirection,
          movementAmount,
          movementLabel,
          status,
          sources[
            !defined(competition._ref) ||
            (
              (
                competition->publicStatus == "published" &&
                (
                  coalesce(competition->contentStatus, competition->prototypeStatus) in ["fictional-prototype", "sample-record"] ||
                  (competition->source.verificationStatus in ["source-confirmed", "official"] && defined(competition->source.url))
                )
              ) ||
              (
                !defined(competition->publicStatus) &&
                coalesce(competition->contentStatus, competition->prototypeStatus) in ["fictional-prototype", "sample-record"]
              )
            )
          ]{
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
        entries[
          athlete->verification.profileStatus == "approved" ||
          athlete->prototypeStatus in ["fictional-prototype", "sample-record"]
        ][0...12]{
          rank,
          "athleteSlug": athlete->slug.current,
          "athleteName": athlete->name,
          "athleteRegion": athlete->region,
          points,
          movementDirection,
          movementAmount,
          movementLabel,
          status,
          sources[
            !defined(competition._ref) ||
            (
              (
                competition->publicStatus == "published" &&
                (
                  coalesce(competition->contentStatus, competition->prototypeStatus) in ["fictional-prototype", "sample-record"] ||
                  (competition->source.verificationStatus in ["source-confirmed", "official"] && defined(competition->source.url))
                )
              ) ||
              (
                !defined(competition->publicStatus) &&
                coalesce(competition->contentStatus, competition->prototypeStatus) in ["fictional-prototype", "sample-record"]
              )
            )
          ]{
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
    "canonicalId": _id,
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
    "canonicalId": _id,
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
      (
        verification.profileStatus == "approved" ||
        prototypeStatus in ["fictional-prototype", "sample-record"]
      ) &&
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
      (
        (
          publicStatus == "published" &&
          (
            coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"] ||
            (source.verificationStatus in ["source-confirmed", "official"] && defined(source.url))
          )
        ) ||
        (!defined(publicStatus) && coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"])
      ) &&
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
      origin,
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
    "canonicalId": _id,
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

// Public-facing athlete queries: only include athletes approved for public publication
export const PUBLIC_ATHLETES_QUERY = defineQuery(`
  *[
    _type == "athlete" &&
    defined(slug.current) &&
    (
      verification.profileStatus == "approved" ||
      prototypeStatus in ["fictional-prototype", "sample-record"]
    )
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

export const PUBLIC_ATHLETE_SLUGS_QUERY = defineQuery(`
  *[
    _type == "athlete" &&
    defined(slug.current) &&
    (
      verification.profileStatus == "approved" ||
      prototypeStatus in ["fictional-prototype", "sample-record"]
    )
  ] | order(featured desc, name asc)[0...240].slug.current
`);

export const PUBLIC_ATHLETE_PAGE_QUERY = defineQuery(`
  *[
    _type == "athlete" &&
    slug.current == $slug &&
    (
      verification.profileStatus == "approved" ||
      prototypeStatus in ["fictional-prototype", "sample-record"]
    )
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
    competitionHistory[
      !defined(competition._ref) ||
      (
        (
          competition->publicStatus == "published" &&
          (
            coalesce(competition->contentStatus, competition->prototypeStatus) in ["fictional-prototype", "sample-record"] ||
            (competition->source.verificationStatus in ["source-confirmed", "official"] && defined(competition->source.url))
          )
        ) ||
        (
          !defined(competition->publicStatus) &&
          coalesce(competition->contentStatus, competition->prototypeStatus) in ["fictional-prototype", "sample-record"]
        )
      )
    ]{
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
    relatedAthletes[
      defined(@->slug.current) &&
      (
        @->verification.profileStatus == "approved" ||
        @->prototypeStatus in ["fictional-prototype", "sample-record"]
      )
    ][0...3]->{
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
      (
        (
          publicStatus == "published" &&
          (
            coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"] ||
            (source.verificationStatus in ["source-confirmed", "official"] && defined(source.url))
          )
        ) ||
        (!defined(publicStatus) && coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"])
      ) &&
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

export const ATHLETE_PAGE_QUERY = defineQuery(`
  *[
    _type == "athlete" &&
    slug.current == $slug
  ][0]{
    "canonicalId": _id,
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
      (
        (
          publicStatus == "published" &&
          (
            coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"] ||
            (source.verificationStatus in ["source-confirmed", "official"] && defined(source.url))
          )
        ) ||
        (!defined(publicStatus) && coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"])
      ) &&
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
      origin,
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
    entries[
      athlete->verification.profileStatus == "approved" ||
      athlete->prototypeStatus in ["fictional-prototype", "sample-record"]
    ][0...200]{
      rank,
      "athleteSlug": athlete->slug.current,
      "athleteName": athlete->name,
      "athleteRegion": athlete->region,
      points,
      movementDirection,
      movementAmount,
      movementLabel,
      status,
      sources[
        !defined(competition._ref) ||
        (
          (
            competition->publicStatus == "published" &&
            (
              coalesce(competition->contentStatus, competition->prototypeStatus) in ["fictional-prototype", "sample-record"] ||
              (competition->source.verificationStatus in ["source-confirmed", "official"] && defined(competition->source.url))
            )
          ) ||
          (
            !defined(competition->publicStatus) &&
            coalesce(competition->contentStatus, competition->prototypeStatus) in ["fictional-prototype", "sample-record"]
          )
        )
      ]{
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
    defined(slug.current) &&
    (
      (
        publicStatus == "published" &&
        (
          coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"] ||
          (source.verificationStatus in ["source-confirmed", "official"] && defined(source.url))
        )
      ) ||
      (!defined(publicStatus) && coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"])
    )
  ] | order(startDate asc, name asc)[0...240]{
    "canonicalId": _id,
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
      "athleteSlug": select(
        athlete->verification.profileStatus == "approved" ||
        athlete->prototypeStatus in ["fictional-prototype", "sample-record"] => athlete->slug.current
      ),
      "athleteName": coalesce(
        select(
          athlete->verification.profileStatus == "approved" ||
          athlete->prototypeStatus in ["fictional-prototype", "sample-record"] => athlete->name
        ),
        displayName
      ),
      "athleteRegion": select(
        athlete->verification.profileStatus == "approved" ||
        athlete->prototypeStatus in ["fictional-prototype", "sample-record"] => athlete->region
      ),
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
    defined(slug.current) &&
    (
      (
        publicStatus == "published" &&
        (
          coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"] ||
          (source.verificationStatus in ["source-confirmed", "official"] && defined(source.url))
        )
      ) ||
      (!defined(publicStatus) && coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"])
    )
  ] | order(startDate asc, name asc)[0...240].slug.current
`);

export const COMPETITION_PAGE_QUERY = defineQuery(`
  *[
    _type == "competition" &&
    slug.current == $slug &&
    (
      (
        publicStatus == "published" &&
        (
          coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"] ||
          (source.verificationStatus in ["source-confirmed", "official"] && defined(source.url))
        )
      ) ||
      (!defined(publicStatus) && coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"])
    )
  ][0]{
    "canonicalId": _id,
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
      "athleteSlug": select(
        athlete->verification.profileStatus == "approved" ||
        athlete->prototypeStatus in ["fictional-prototype", "sample-record"] => athlete->slug.current
      ),
      "athleteName": coalesce(
        select(
          athlete->verification.profileStatus == "approved" ||
          athlete->prototypeStatus in ["fictional-prototype", "sample-record"] => athlete->name
        ),
        displayName
      ),
      city,
      discipline,
      seed,
      status
    },
    results[]{
      "key": _key,
      placement,
      "athleteSlug": select(
        athlete->verification.profileStatus == "approved" ||
        athlete->prototypeStatus in ["fictional-prototype", "sample-record"] => athlete->slug.current
      ),
      "athleteName": coalesce(
        select(
          athlete->verification.profileStatus == "approved" ||
          athlete->prototypeStatus in ["fictional-prototype", "sample-record"] => athlete->name
        ),
        displayName
      ),
      "athleteRegion": select(
        athlete->verification.profileStatus == "approved" ||
        athlete->prototypeStatus in ["fictional-prototype", "sample-record"] => athlete->region
      ),
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
    relatedAthletes[
      defined(@->slug.current) &&
      (
        @->verification.profileStatus == "approved" ||
        @->prototypeStatus in ["fictional-prototype", "sample-record"]
      )
    ][0...3]->{
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
    relatedCompetitions[
      defined(@->slug.current) &&
      (
        (
          @->publicStatus == "published" &&
          (
            coalesce(@->contentStatus, @->prototypeStatus) in ["fictional-prototype", "sample-record"] ||
            (@->source.verificationStatus in ["source-confirmed", "official"] && defined(@->source.url))
          )
        ) ||
        (!defined(@->publicStatus) && coalesce(@->contentStatus, @->prototypeStatus) in ["fictional-prototype", "sample-record"])
      )
    ][0...3]->{
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
      origin,
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

// Editor-only, bounded competition review projection. Private identity notes
// and other moderation-only fields are intentionally excluded.
export const ADMIN_COMPETITIONS_QUERY = defineQuery(`
  {
    "counts": {
      "total": count(*[_type == "competition"]),
      "samples": count(*[
        _type == "competition" &&
        coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"]
      ]),
      "real": count(*[
        _type == "competition" &&
        coalesce(contentStatus, prototypeStatus) == "published-record"
      ]),
      "sourceConfirmed": count(*[
        _type == "competition" &&
        source.verificationStatus in ["source-confirmed", "official"]
      ]),
      "upcoming": count(*[
        _type == "competition" &&
        startDate >= $today
      ]),
      "past": count(*[
        _type == "competition" &&
        startDate < $today
      ])
    },
    "total": count(*[
      _type == "competition" &&
      ($q == "" || name match $q || organizerName match $q || city match $q || country match $q || _id match $q) &&
      ($status == "" || status == $status) &&
      (
        $publicStatus == "" ||
        publicStatus == $publicStatus ||
        (
          $publicStatus == "legacy-public" &&
          !defined(publicStatus) &&
          coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"]
        )
      ) &&
      ($verification == "" || source.verificationStatus == $verification) &&
      ($country == "" || country == $country) &&
      (
        $dateScope == "" ||
        ($dateScope == "upcoming" && startDate >= $today) ||
        ($dateScope == "past" && startDate < $today)
      ) &&
      (
        $recordKind == "" ||
        ($recordKind == "sample" && coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"]) ||
        ($recordKind == "real" && coalesce(contentStatus, prototypeStatus) == "published-record")
      )
    ]),
    "items": *[
      _type == "competition" &&
      ($q == "" || name match $q || organizerName match $q || city match $q || country match $q || _id match $q) &&
      ($status == "" || status == $status) &&
      (
        $publicStatus == "" ||
        publicStatus == $publicStatus ||
        (
          $publicStatus == "legacy-public" &&
          !defined(publicStatus) &&
          coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"]
        )
      ) &&
      ($verification == "" || source.verificationStatus == $verification) &&
      ($country == "" || country == $country) &&
      (
        $dateScope == "" ||
        ($dateScope == "upcoming" && startDate >= $today) ||
        ($dateScope == "past" && startDate < $today)
      ) &&
      (
        $recordKind == "" ||
        ($recordKind == "sample" && coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"]) ||
        ($recordKind == "real" && coalesce(contentStatus, prototypeStatus) == "published-record")
      )
    ] | order(startDate desc, name asc, _id asc)[$offset...$end]{
      "canonicalId": _id,
      "slug": slug.current,
      name,
      eventSeries,
      editorialPriority,
      featured,
      status,
      publicStatus,
      "legacyPublic": !defined(publicStatus) && coalesce(contentStatus, prototypeStatus) in ["fictional-prototype", "sample-record"],
      "contentStatus": coalesce(contentStatus, prototypeStatus),
      startDate,
      endDate,
      city,
      administrativeArea,
      state,
      country,
      venueName,
      organizerName,
      organizerVerificationStatus,
      disciplines,
      primaryDiscipline,
      competitionFormat,
      externalProviderId,
      externalProviderUrl,
      "organization": organization->{
        "canonicalId": _id,
        name
      },
      "source": source{
        "title": sourceTitle,
        "type": sourceType,
        url,
        externalRecordId,
        checkedAt,
        verificationStatus,
        "provider": provider->{
          "canonicalId": _id,
          name,
          status
        }
      },
      "updatedAt": _updatedAt
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
      "canonicalId": _id,
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
      relatedAthletes[
        defined(@->slug.current) &&
        (
          @->verification.profileStatus == "approved" ||
          @->prototypeStatus in ["fictional-prototype", "sample-record"]
        )
      ]->{"slug": slug.current},
      relatedCompetitions[
        defined(@->slug.current) &&
        (
          (
            @->publicStatus == "published" &&
            (
              coalesce(@->contentStatus, @->prototypeStatus) in ["fictional-prototype", "sample-record"] ||
              (@->source.verificationStatus in ["source-confirmed", "official"] && defined(@->source.url))
            )
          ) ||
          (!defined(@->publicStatus) && coalesce(@->contentStatus, @->prototypeStatus) in ["fictional-prototype", "sample-record"])
        )
      ]->{"slug": slug.current},
      relatedStories[]->{"slug": slug.current},
      relatedVideos[]->{"slug": slug.current},
      availabilityLabel,
      sourcePlatform,
      sourceAccount,
      originalPostUrl,
      origin,
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
        relatedAthletes[
          defined(@->slug.current) &&
          (
            @->verification.profileStatus == "approved" ||
            @->prototypeStatus in ["fictional-prototype", "sample-record"]
          )
        ]->{"slug": slug.current},
        relatedCompetitions[
          defined(@->slug.current) &&
          (
            (
              @->publicStatus == "published" &&
              (
                coalesce(@->contentStatus, @->prototypeStatus) in ["fictional-prototype", "sample-record"] ||
                (@->source.verificationStatus in ["source-confirmed", "official"] && defined(@->source.url))
              )
            ) ||
            (!defined(@->publicStatus) && coalesce(@->contentStatus, @->prototypeStatus) in ["fictional-prototype", "sample-record"])
          )
        ]->{"slug": slug.current},
        relatedStories[]->{"slug": slug.current},
        relatedVideos[]->{"slug": slug.current},
        availabilityLabel,
        sourcePlatform,
        sourceAccount,
        originalPostUrl,
        origin,
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
        relatedAthletes[
          defined(@->slug.current) &&
          (
            @->verification.profileStatus == "approved" ||
            @->prototypeStatus in ["fictional-prototype", "sample-record"]
          )
        ]->{"slug": slug.current},
        relatedCompetitions[
          defined(@->slug.current) &&
          (
            (
              @->publicStatus == "published" &&
              (
                coalesce(@->contentStatus, @->prototypeStatus) in ["fictional-prototype", "sample-record"] ||
                (@->source.verificationStatus in ["source-confirmed", "official"] && defined(@->source.url))
              )
            ) ||
            (!defined(@->publicStatus) && coalesce(@->contentStatus, @->prototypeStatus) in ["fictional-prototype", "sample-record"])
          )
        ]->{"slug": slug.current},
        relatedStories[]->{"slug": slug.current},
        relatedVideos[]->{"slug": slug.current},
        availabilityLabel,
        sourcePlatform,
        sourceAccount,
        originalPostUrl,
        origin,
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
    "canonicalId": _id,
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
    origin,
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
    relatedAthletes[
      defined(@->slug.current) &&
      (
        @->verification.profileStatus == "approved" ||
        @->prototypeStatus in ["fictional-prototype", "sample-record"]
      )
    ][0...3]->{
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
    relatedCompetitions[
      defined(@->slug.current) &&
      (
        (
          @->publicStatus == "published" &&
          (
            coalesce(@->contentStatus, @->prototypeStatus) in ["fictional-prototype", "sample-record"] ||
            (@->source.verificationStatus in ["source-confirmed", "official"] && defined(@->source.url))
          )
        ) ||
        (!defined(@->publicStatus) && coalesce(@->contentStatus, @->prototypeStatus) in ["fictional-prototype", "sample-record"])
      )
    ][0...3]->{
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
      origin,
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
