import {athlete} from "./documents/athlete"
import {auditEvent} from "./documents/audit-event"
import {author} from "./documents/author"
import {competition} from "./documents/competition"
import {contributorProfile} from "./documents/contributor-profile"
import {contributorIdentityClaim} from "./documents/contributor-identity-claim"
import {operationalLock} from "./documents/operational-lock"
import {rankingCategory} from "./documents/ranking-category"
import {siteSettings} from "./documents/site-settings"
import {story} from "./documents/story"
import {submission} from "./documents/submission"
import {video} from "./documents/video"
import {videoSeries} from "./documents/video-series"
import {
  accessibleImage,
  seo,
} from "./objects/accessibility"
import {
  athleteAchievement,
  athleteStatistic,
  timelineEntry,
} from "./objects/athlete-records"
import {
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
import {rankingEntry} from "./objects/ranking-entry"
import {
  athleteNominationDetails,
  auditMetadata,
  competitionListingDetails,
  correctionRequestDetails,
  mediaPitchDetails,
  privateEditorialNote,
  storyPitchDetails,
  supportingLink,
} from "./objects/editorial-operations"
import {
  editorialNote,
  transcriptBlock,
  videoChapter,
  videoCredit,
} from "./objects/video-records"

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
  timelineEntry,
  competitionDivision,
  competitionScheduleItem,
  competitionParticipant,
  competitionResult,
  competitionNotice,
  videoChapter,
  transcriptBlock,
  videoCredit,
  editorialNote,
  rankingEntry,
  supportingLink,
  privateEditorialNote,
  storyPitchDetails,
  athleteNominationDetails,
  competitionListingDetails,
  mediaPitchDetails,
  correctionRequestDetails,
  auditMetadata,
  siteSettings,
  author,
  story,
  athlete,
  competition,
  videoSeries,
  video,
  rankingCategory,
  contributorProfile,
  contributorIdentityClaim,
  operationalLock,
  submission,
  auditEvent,
]
