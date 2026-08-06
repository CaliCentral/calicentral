import {
  athleteCompetitionCategories,
  athleteSpecialties,
} from "../../lib/athlete-taxonomy"
import {countries} from "../../lib/geography"

export const prototypeStatusOptions = [
  {title: "Fictional prototype", value: "fictional-prototype"},
  {title: "Sample record", value: "sample-record"},
  {title: "Not official", value: "not-official"},
]

export const storyCategoryOptions = [
  {title: "Culture", value: "Culture"},
  {title: "Training", value: "Training"},
  {title: "Competition", value: "Competition"},
  {title: "Athlete Journal", value: "Athlete Journal"},
  {title: "Field Note", value: "Field Note"},
  {title: "Analysis", value: "Analysis"},
]

export const athleteDisciplineOptions = [
  {title: "Freestyle", value: "Freestyle"},
  {title: "Static strength", value: "Static strength"},
  {title: "Dynamic freestyle", value: "Dynamic freestyle"},
  {title: "Endurance", value: "Endurance"},
  {title: "Strength", value: "Strength"},
  {title: "Hand balancing", value: "Hand balancing"},
]

export const athleteCompetitionCategoryOptions =
  athleteCompetitionCategories.map(({label, value}) => ({
    title: label,
    value,
  }))

export const athleteSpecialtyOptions = athleteSpecialties.map(
  ({label, value}) => ({title: label, value}),
)

export const athleteSocialPlatformOptions = [
  {title: "Instagram", value: "instagram"},
  {title: "TikTok", value: "tiktok"},
  {title: "YouTube", value: "youtube"},
  {title: "Facebook", value: "facebook"},
  {title: "X", value: "x"},
  {title: "Threads", value: "threads"},
  {title: "Personal website", value: "website"},
  {title: "Sponsor or merchandise", value: "sponsor-merch"},
]

export const countryOptions = countries.map(({code, name}) => ({
  title: name,
  value: name,
  code,
}))

export const disciplineCodeOptions = [
  {title: "Freestyle", value: "freestyle"},
  {title: "Static strength", value: "static-strength"},
  {title: "Dynamic freestyle", value: "dynamic"},
  {title: "Endurance", value: "endurance"},
  {title: "Team", value: "team"},
  {title: "Mixed", value: "mixed"},
]

export const visualVariantOptions = [
  {title: "Signal", value: "signal"},
  {title: "Field", value: "field"},
  {title: "Frame", value: "frame"},
  {title: "Motion", value: "motion"},
  {title: "Handstand", value: "handstand"},
  {title: "Static", value: "static"},
  {title: "Team", value: "team"},
  {title: "Portrait", value: "portrait"},
  {title: "Competition", value: "competition"},
]

export const competitionStatusOptions = [
  {title: "Upcoming", value: "upcoming"},
  {title: "Completed", value: "completed"},
  {title: "Postponed", value: "postponed"},
  {title: "Cancelled", value: "cancelled"},
  {title: "Preview", value: "preview"},
]

export const competitionContentStatusOptions = [
  {title: "Published event record", value: "published-record"},
  {title: "Fictional prototype", value: "fictional-prototype"},
  {title: "Sample record", value: "sample-record"},
  {title: "Not official", value: "not-official"},
]

export const registrationStatusOptions = [
  {title: "Not open", value: "not-open"},
  {title: "Open", value: "open"},
  {title: "Preview only", value: "preview-only"},
  {title: "Closed", value: "closed"},
  {title: "Sold out", value: "sold-out"},
  {title: "Unavailable", value: "unavailable"},
]

export const scheduleStatusOptions = [
  {title: "Pending", value: "pending"},
  {title: "Provisional", value: "provisional"},
  {title: "Published", value: "published"},
  {title: "Completed", value: "completed"},
]

export const scheduleItemStatusOptions = [
  {title: "Planned", value: "planned"},
  {title: "Provisional", value: "provisional"},
  {title: "Complete", value: "complete"},
  {title: "Cancelled", value: "cancelled"},
]

export const resultsStatusOptions = [
  {title: "Not available", value: "not-available"},
  {title: "Pending", value: "pending"},
  {title: "Verified results", value: "verified-results"},
  {title: "Sample results", value: "sample-results"},
]

export const resultVerificationStatusOptions = [
  {title: "Unverified", value: "unverified"},
  {title: "Source reviewed", value: "source-reviewed"},
  {title: "Verified", value: "verified"},
  {title: "Disputed", value: "disputed"},
  {title: "Fictional sample", value: "sample"},
]

export const resultSourceTypeOptions = [
  {title: "Official event results", value: "official-event-results"},
  {title: "Organizer-published results", value: "organizer-published"},
  {title: "Official event website", value: "event-website"},
  {title: "Video evidence", value: "video"},
  {title: "Other public source", value: "other"},
]

export const organizerVerificationStatusOptions = [
  {title: "Unverified", value: "unverified"},
  {title: "Reviewed", value: "reviewed"},
  {title: "Verified organizer", value: "verified"},
  {title: "Fictional sample", value: "sample"},
]

export const competitionActionLinkTypeOptions = [
  {title: "Register to compete", value: "registration"},
  {title: "Get tickets", value: "tickets"},
  {title: "Official event site", value: "official-site"},
  {title: "Organizer social profile", value: "organizer-social"},
  {title: "View results", value: "results"},
  {title: "Map", value: "map"},
  {title: "Livestream", value: "livestream"},
]

export const videoCategoryOptions = [
  {title: "Technique", value: "Technique"},
  {title: "Competition", value: "Competition"},
  {title: "Culture", value: "Culture"},
  {title: "Athlete Profile", value: "Athlete Profile"},
  {title: "Training", value: "Training"},
  {title: "Interview", value: "Interview"},
  {title: "Competition highlight", value: "Competition Highlight"},
  {title: "Documentary", value: "Documentary"},
  {title: "Short clip", value: "Short Clip"},
  {title: "Cali Central original", value: "Cali Central Original"},
]

export const videoFormatOptions = [
  {title: "Visual study", value: "Visual Study"},
  {title: "Short documentary", value: "Short Documentary"},
  {title: "Field report", value: "Field Report"},
  {title: "Technique breakdown", value: "Technique Breakdown"},
  {title: "Event preview", value: "Event Preview"},
  {title: "Interview / profile study", value: "Interview/Profile Study"},
  {title: "Editorial breakdown", value: "Editorial Breakdown"},
]

export const videoStatusOptions = [
  {title: "Preview", value: "preview"},
  {title: "Archive sample", value: "archive-sample"},
  {title: "Published prototype", value: "published-prototype"},
]

export const rankingStatusOptions = [
  {title: "Draft", value: "draft"},
  {title: "Published", value: "published"},
  {title: "Retired", value: "retired"},
  {title: "Prototype", value: "prototype"},
  {title: "Unofficial", value: "unofficial"},
]

export const standingMethodologyStatusOptions = [
  {title: "Draft methodology", value: "draft"},
  {title: "Approved methodology", value: "approved"},
]

export const standingScopeOptions = [
  {title: "Competition standings", value: "competition"},
  {title: "Country standings (future)", value: "country"},
]

export const movementDirectionOptions = [
  {title: "Up", value: "up"},
  {title: "Down", value: "down"},
  {title: "Hold", value: "hold"},
  {title: "New", value: "new"},
]
