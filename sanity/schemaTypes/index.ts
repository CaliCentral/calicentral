import {athlete} from "./documents/athlete"
import {auditEvent} from "./documents/audit-event"
import {author} from "./documents/author"
import {competition} from "./documents/competition"
import {contributorProfile} from "./documents/contributor-profile"
import {contributorIdentityClaim} from "./documents/contributor-identity-claim"
import {operationalLock} from "./documents/operational-lock"
import {organization} from "./documents/organization"
import {product} from "./documents/product"
import {rankingCategory} from "./documents/ranking-category"
import {rankingProvider} from "./documents/ranking-provider"
import {rankingSnapshot} from "./documents/ranking-snapshot"
import {rankingSystem} from "./documents/ranking-system"
import {ruleset} from "./documents/ruleset"
import {siteSettings} from "./documents/site-settings"
import {sportingResult} from "./documents/sporting-result"
import {story} from "./documents/story"
import {submission} from "./documents/submission"
import {team} from "./documents/team"
import {teamSeason} from "./documents/team-season"
import {video} from "./documents/video"
import {videoSeries} from "./documents/video-series"
import {externalAthleteIdentity} from "./documents/external-athlete-identity"
import {externalCompetitionIdentity} from "./documents/external-competition-identity"
import {
  accessibleImage,
  seo,
} from "./objects/accessibility"
import {
  athleteAchievement,
  athleteCompetitionRecord,
  athleteSocialLink,
  athleteStatistic,
  athleteVerification,
  timelineEntry,
} from "./objects/athlete-records"
import {
  competitionActionLink,
  competitionDivision,
  competitionNotice,
  competitionParticipant,
  competitionResult,
  competitionScheduleItem,
} from "./objects/competition-records"
import {
  divider,
  externalLink,
  factBox,
  internalStoryLink,
  portableText,
  pullQuote,
} from "./objects/portable-text"
import {
  rankingEntry,
  standingResultSource,
} from "./objects/ranking-entry"
import {
  athleteCompetitionHistorySubmission,
  athleteNominationDetails,
  auditMetadata,
  competitionListingDetails,
  correctionRequestDetails,
  mediaPitchDetails,
  organizationClaimDetails,
  privateEditorialNote,
  productSubmissionDetails,
  storyPitchDetails,
  supportingLink,
  videoSubmissionDetails,
} from "./objects/editorial-operations"
import {
  editorialNote,
  transcriptBlock,
  videoChapter,
  videoCredit,
  videoPlatformMetric,
} from "./objects/video-records"
import {
  teamApplicationDetails,
  teamApplicationRosterEntry,
} from "./objects/team-application"
import {
  externalAlias,
  provenanceSource,
  rankingSnapshotEntry,
  resultPerformance,
  sportingMeasurement,
  teamBranding,
  teamSeasonMember,
  teamSocialLink,
  wclEquipmentCompliance,
} from "./objects/sporting-data"

export const schemaTypes = [
  accessibleImage,
  seo,
  externalLink,
  internalStoryLink,
  pullQuote,
  factBox,
  divider,
  portableText,
  athleteStatistic,
  athleteAchievement,
  athleteCompetitionRecord,
  athleteSocialLink,
  athleteVerification,
  timelineEntry,
  competitionDivision,
  competitionActionLink,
  competitionScheduleItem,
  competitionParticipant,
  competitionResult,
  competitionNotice,
  videoChapter,
  transcriptBlock,
  videoCredit,
  videoPlatformMetric,
  editorialNote,
  standingResultSource,
  rankingEntry,
  provenanceSource,
  rankingSnapshotEntry,
  sportingMeasurement,
  resultPerformance,
  teamBranding,
  teamSocialLink,
  teamSeasonMember,
  wclEquipmentCompliance,
  externalAlias,
  supportingLink,
  privateEditorialNote,
  storyPitchDetails,
  athleteCompetitionHistorySubmission,
  athleteNominationDetails,
  competitionListingDetails,
  mediaPitchDetails,
  organizationClaimDetails,
  videoSubmissionDetails,
  productSubmissionDetails,
  correctionRequestDetails,
  auditMetadata,
  teamApplicationRosterEntry,
  teamApplicationDetails,
  siteSettings,
  author,
  story,
  athlete,
  competition,
  videoSeries,
  video,
  rankingCategory,
  organization,
  product,
  ruleset,
  rankingProvider,
  rankingSystem,
  rankingSnapshot,
  externalAthleteIdentity,
  externalCompetitionIdentity,
  team,
  teamSeason,
  sportingResult,
  contributorProfile,
  contributorIdentityClaim,
  operationalLock,
  submission,
  auditEvent,
]
