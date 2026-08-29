import type {
  MediaFeature,
  VideoSeries,
  VideoSeriesSlug,
} from "@/types/video";

const prototypeCredit = {
  role: "Archive design",
  name: "Fictional Prototype Production",
  status: "Illustrative credit",
} as const;

export const videoSeries = [
  {
    slug: "frame-by-frame",
    title: "Frame by Frame",
    description:
      "Fictional visual studies that isolate timing, position, and the small decisions inside a movement.",
    categoryEmphasis: "Technique and training",
  },
  {
    slug: "competition-diary",
    title: "Competition Diary",
    description:
      "Prototype field records about preparation, event structure, and the quieter moments around a round.",
    categoryEmphasis: "Competition and reflection",
  },
  {
    slug: "local-motion",
    title: "Local Motion",
    description:
      "Illustrative documentary notes from shared parks, neighborhood crews, and open training spaces.",
    categoryEmphasis: "Culture and community",
  },
  {
    slug: "athlete-file",
    title: "Athlete File",
    description:
      "Fictional portraits organized around an athlete's process, decisions, and relationship to practice.",
    categoryEmphasis: "Athlete profiles",
  },
  {
    slug: "field-notes",
    title: "Field Notes",
    description:
      "Editorial breakdowns that make sample competition formats and movement choices easier to read.",
    categoryEmphasis: "Competition analysis",
  },
] as const satisfies readonly VideoSeries[];

export const videos = [
  {
    canonicalId: "sample.video.finding-control-through-the-handstand-line",
    slug: "finding-control-through-the-handstand-line",
    title: "Finding Control Through the Handstand Line",
    shortTitle: "The Handstand Line",
    episodeNumber: "01",
    seriesSlug: "frame-by-frame",
    seriesTitle: "Frame by Frame",
    category: "Technique",
    format: "Visual Study",
    status: "archive-sample",
    origin: "cali-central-original",
    source: {
      platform: "Cali Central",
      ownershipStatus: "cali-central-original",
    },
    duration: "08:42",
    durationSeconds: 522,
    publishedDate: "2026-07-29",
    publishedDateDisplay: "July 29, 2026",
    location: "Oakland, California",
    summary:
      "A fictional visual study of alignment, tempo, hand pressure, and the small corrections behind a composed hold.",
    description: [
      "This archive sample slows an imagined hand-balance session into a sequence of readable frames. The focus is not a universal technique prescription, but the way one fictional athlete observes position, tempo, and the decision to leave a hold.",
      "Abstract graphics mark changes through the shoulders, hands, and center line without presenting the feature as coaching or safety guidance. The record demonstrates how Cali Central could pair movement analysis with a concise editorial note.",
    ],
    featured: true,
    homepageFeatured: true,
    visualVariant: "handstand",
    posterLabel: "Preview frame / Handstand line",
    frameCode: "FBF-01 / 08:42",
    chapters: [
      {
        timestamp: "00:00",
        timestampSeconds: 0,
        title: "Establishing the line",
        description:
          "The fictional session and its abstract reference frame are introduced.",
      },
      {
        timestamp: "01:34",
        timestampSeconds: 94,
        title: "Shoulder position",
        description:
          "A visual overlay compares two illustrative moments without prescribing a correction.",
      },
      {
        timestamp: "03:12",
        timestampSeconds: 192,
        title: "Pressure through the hands",
        description:
          "Small balance responses are represented through rings and directional marks.",
      },
      {
        timestamp: "05:26",
        timestampSeconds: 326,
        title: "Correction and recovery",
        description:
          "The study follows how the sample hold changes without treating movement as failure.",
      },
      {
        timestamp: "07:45",
        timestampSeconds: 465,
        title: "Leaving the hold",
        description:
          "The final frame centers a deliberate exit and a concise field note.",
      },
    ],
    editorialNotes: [
      {
        heading: "What the frame records",
        text: "The overlays identify changes in an invented sequence. They are editorial observations, not individualized coaching instructions.",
      },
      {
        heading: "Why the exit remains visible",
        text: "The archive treats the decision to end an attempt as part of the movement record rather than cutting the study at its most composed frame.",
      },
    ],
    credits: [
      {
        role: "Editorial",
        name: "Cali Central Editorial",
        status: "Fictional prototype credit",
      },
      {
        role: "Movement study",
        name: "Rowan Kim",
        status: "Fictional athlete contribution",
      },
      prototypeCredit,
    ],
    relatedAthleteSlugs: ["rowan-kim", "noa-bennett"],
    relatedCompetitionSlugs: [],
    relatedStorySlugs: ["language-of-control"],
    relatedVideoSlugs: [
      "building-the-first-clean-transition",
      "maya-calder-between-hold-and-flight",
    ],
    tags: ["hand balancing", "control", "visual study", "static strength"],
    availabilityLabel: "Archive sample / No playback",
  },
  {
    canonicalId: "sample.video.after-the-last-round",
    slug: "after-the-last-round",
    title: "After the Last Round",
    shortTitle: "After the Last Round",
    episodeNumber: "02",
    seriesSlug: "competition-diary",
    seriesTitle: "Competition Diary",
    category: "Competition",
    format: "Short Documentary",
    status: "preview",
    origin: "cali-central-original",
    source: {
      platform: "Cali Central",
      ownershipStatus: "cali-central-original",
    },
    duration: "12:18",
    durationSeconds: 738,
    publishedDate: "2026-07-22",
    publishedDateDisplay: "July 22, 2026",
    location: "Los Angeles, California",
    summary:
      "A fictional athlete reflects on preparation, pressure, and the reset that begins after a final round.",
    description: [
      "This fictional competition diary begins after the sample standings are posted. Instead of replaying a result as a verdict, it follows an athlete through the first quiet review of a round and the return to ordinary practice.",
      "The feature uses an invented event, athlete voice, score context, and production record. Its purpose is to demonstrate reflective sports storytelling without presenting a prototype result as verified reporting.",
    ],
    featured: false,
    homepageFeatured: true,
    visualVariant: "competition",
    posterLabel: "Diary frame / Post-round reset",
    frameCode: "CPD-02 / 12:18",
    chapters: [
      {
        timestamp: "00:00",
        timestampSeconds: 0,
        title: "The room after finals",
        description:
          "A static field graphic establishes the fictional event after its last round.",
      },
      {
        timestamp: "01:48",
        timestampSeconds: 108,
        title: "Preparation under pressure",
        description:
          "The athlete describes how a simple plan became crowded by expectation.",
      },
      {
        timestamp: "04:10",
        timestampSeconds: 250,
        title: "One measured review",
        description:
          "The imagined round is considered once for sequence and once for decisions.",
      },
      {
        timestamp: "07:32",
        timestampSeconds: 452,
        title: "Returning to practice",
        description:
          "The diary moves from the result toward familiar, low-pressure work.",
      },
      {
        timestamp: "10:44",
        timestampSeconds: 644,
        title: "What the round can keep",
        description:
          "The closing note separates one useful change from the full fictional result.",
      },
    ],
    transcript: [
      {
        speaker: "Jalen Reyes",
        timestamp: "01:52",
        text: "The round felt larger in memory than it did when I finally wrote each decision down.",
      },
      {
        speaker: "Cali Central Editorial",
        timestamp: "04:18",
        text: "This is a fictional prototype transcript tied to an invented event and athlete account.",
      },
      {
        speaker: "Jalen Reyes",
        timestamp: "10:51",
        text: "I kept one cue, changed one transition, and let the sample placement stay on the page.",
      },
    ],
    credits: [
      {
        role: "Editorial",
        name: "Cali Central Editorial",
        status: "Fictional prototype credit",
      },
      {
        role: "Athlete voice",
        name: "Jalen Reyes",
        status: "Fictional athlete contribution",
      },
      prototypeCredit,
    ],
    relatedAthleteSlugs: ["jalen-reyes", "tessa-marin"],
    relatedCompetitionSlugs: ["redline-freestyle-trials"],
    relatedStorySlugs: ["after-the-last-round", "judging-the-line"],
    relatedVideoSlugs: [
      "inside-the-pacific-motion-open",
      "maya-calder-between-hold-and-flight",
      "reading-a-freestyle-round",
    ],
    tags: ["competition", "reflection", "preparation", "athlete journal"],
    availabilityLabel: "Preview only / No playback",
  },
  {
    canonicalId: "sample.video.one-evening-at-harbor-park",
    slug: "one-evening-at-harbor-park",
    title: "One Evening at Harbor Park",
    shortTitle: "Harbor Park",
    episodeNumber: "03",
    seriesSlug: "local-motion",
    seriesTitle: "Local Motion",
    category: "Culture",
    format: "Field Report",
    status: "archive-sample",
    origin: "cali-central-original",
    source: {
      platform: "Cali Central",
      ownershipStatus: "cali-central-original",
    },
    duration: "06:35",
    durationSeconds: 395,
    publishedDate: "2026-07-15",
    publishedDateDisplay: "July 15, 2026",
    location: "Long Beach, California",
    summary:
      "A fictional field report about community energy and open-air training during one imagined evening session.",
    description: [
      "Harbor Park is an invented setting rendered here as a sequence of shared turns, quiet observations, and technical field marks. The feature considers how several separate training plans can occupy the same public session.",
      "No real park footage or participant photography appears in the prototype. Geometric frames stand in for movement while the editorial record stays focused on space, attention, and community practice.",
    ],
    featured: false,
    homepageFeatured: true,
    visualVariant: "field",
    posterLabel: "Field frame / Harbor evening",
    frameCode: "LMT-03 / 06:35",
    chapters: [
      {
        timestamp: "00:00",
        timestampSeconds: 0,
        title: "The session assembles",
        description:
          "An abstract field map introduces the fictional park and its shared stations.",
      },
      {
        timestamp: "01:12",
        timestampSeconds: 72,
        title: "Plans beside one another",
        description:
          "Separate practice rhythms are represented across a single technical grid.",
      },
      {
        timestamp: "03:08",
        timestampSeconds: 188,
        title: "An open exchange",
        description:
          "The field note follows one concise, consent-based conversation about space.",
      },
      {
        timestamp: "05:02",
        timestampSeconds: 302,
        title: "Leaving the park ready",
        description:
          "The final chapter records a shared reset rather than a featured performance.",
      },
    ],
    editorialNotes: [
      {
        heading: "A public space, not a set",
        text: "The fictional session is framed as a place people negotiate together, not as a backdrop owned by the archive.",
      },
      {
        heading: "What remains outside the frame",
        text: "The sample does not identify bystanders or imply permission to record real people in public training spaces.",
      },
    ],
    credits: [
      {
        role: "Field editorial",
        name: "Cali Central Editorial",
        status: "Fictional prototype credit",
      },
      {
        role: "Community record",
        name: "Harbor Session Collective",
        status: "Invented group",
      },
      prototypeCredit,
    ],
    relatedAthleteSlugs: ["amara-west", "tessa-marin", "jalen-reyes"],
    relatedCompetitionSlugs: [
      "coastline-team-cup",
      "harbor-frame-sessions",
    ],
    relatedStorySlugs: [
      "one-evening-at-harbor-park",
      "built-on-the-bars",
    ],
    relatedVideoSlugs: [
      "the-crew-builds-the-session",
      "maya-calder-between-hold-and-flight",
    ],
    tags: ["community", "open-air training", "field report", "Long Beach"],
    availabilityLabel: "Archive sample / No playback",
  },
  {
    canonicalId: "sample.video.building-the-first-clean-transition",
    slug: "building-the-first-clean-transition",
    title: "Building the First Clean Transition",
    shortTitle: "The First Clean Transition",
    episodeNumber: "04",
    seriesSlug: "frame-by-frame",
    seriesTitle: "Frame by Frame",
    category: "Training",
    format: "Technique Breakdown",
    status: "published-prototype",
    origin: "cali-central-original",
    source: {
      platform: "Cali Central",
      ownershipStatus: "cali-central-original",
    },
    duration: "09:14",
    durationSeconds: 554,
    publishedDate: "2026-07-08",
    publishedDateDisplay: "July 8, 2026",
    location: "Oakland, California",
    summary:
      "A fictional coaching study of controlled static-to-dynamic movement and the decisions that make a transition readable.",
    description: [
      "This technique breakdown follows an invented transition from a held shape into a moving sequence. It focuses on observation, pacing, and repeatability rather than offering a step-by-step training prescription.",
      "The prototype uses static diagrams and editorial language only. It does not assess readiness, replace qualified in-person coaching, or provide medical or injury guidance.",
    ],
    featured: false,
    homepageFeatured: false,
    visualVariant: "static",
    posterLabel: "Study frame / First transition",
    frameCode: "FBF-04 / 09:14",
    chapters: [
      {
        timestamp: "00:00",
        timestampSeconds: 0,
        title: "The two shapes",
        description:
          "The opening frame names the fictional start and finish without prescribing a drill.",
      },
      {
        timestamp: "01:26",
        timestampSeconds: 86,
        title: "Finding a repeatable pace",
        description:
          "Timing marks compare rushed and measured versions of the sample sequence.",
      },
      {
        timestamp: "03:44",
        timestampSeconds: 224,
        title: "Reading the midpoint",
        description:
          "The central frame makes the change of direction visible.",
      },
      {
        timestamp: "06:18",
        timestampSeconds: 378,
        title: "Keeping the exit clear",
        description:
          "The study records how the invented athlete leaves the combination.",
      },
      {
        timestamp: "08:20",
        timestampSeconds: 500,
        title: "One useful comparison",
        description:
          "The final note identifies a difference without declaring a universal solution.",
      },
    ],
    editorialNotes: [
      {
        heading: "Observation before instruction",
        text: "The breakdown describes what changes between fictional frames. It intentionally avoids prescribing progressions or readiness standards.",
      },
      {
        heading: "A prototype, not a coaching plan",
        text: "The sample should be read as editorial technique coverage and not as individualized training, safety, or medical advice.",
      },
    ],
    credits: [
      {
        role: "Technical editorial",
        name: "Cali Central Editorial",
        status: "Fictional prototype credit",
      },
      {
        role: "Movement reference",
        name: "Noa Bennett",
        status: "Fictional athlete contribution",
      },
      prototypeCredit,
    ],
    relatedAthleteSlugs: ["noa-bennett", "rowan-kim", "micah-vale"],
    relatedCompetitionSlugs: [
      "golden-state-strength-classic",
      "valley-control-meet",
    ],
    relatedStorySlugs: ["language-of-control"],
    relatedVideoSlugs: [
      "finding-control-through-the-handstand-line",
      "reading-a-freestyle-round",
    ],
    tags: ["transition", "training", "control", "technique breakdown"],
    availabilityLabel: "Published prototype / No playback",
  },
  {
    canonicalId: "sample.video.inside-the-pacific-motion-open",
    slug: "inside-the-pacific-motion-open",
    title: "Inside the Pacific Motion Open",
    shortTitle: "Inside Pacific Motion",
    episodeNumber: "05",
    seriesSlug: "competition-diary",
    seriesTitle: "Competition Diary",
    category: "Competition",
    format: "Event Preview",
    status: "preview",
    origin: "cali-central-original",
    source: {
      platform: "Cali Central",
      ownershipStatus: "cali-central-original",
    },
    duration: "11:06",
    durationSeconds: 666,
    publishedDate: "2026-07-01",
    publishedDateDisplay: "July 1, 2026",
    location: "Long Beach, California",
    summary:
      "A fictional field preview connected to the Pacific Motion Open, its sample format, and the information surrounding each round.",
    description: [
      "This prototype event preview opens the fictional Pacific Motion Open file before competition day. It maps the illustrative qualification structure, field labels, and audience information without claiming an official schedule or registration path.",
      "Every venue detail, participant reference, time, and production credit is invented. The static preview shows how event reporting and a media archive could share one transparent set of relationships.",
    ],
    featured: false,
    homepageFeatured: false,
    visualVariant: "competition",
    posterLabel: "Event frame / Pacific Motion",
    frameCode: "CPD-05 / 11:06",
    chapters: [
      {
        timestamp: "00:00",
        timestampSeconds: 0,
        title: "Opening the event file",
        description:
          "The fictional date, city, format, and prototype status are established.",
      },
      {
        timestamp: "02:05",
        timestampSeconds: 125,
        title: "How the sample rounds connect",
        description:
          "A field diagram distinguishes qualification from the invented final.",
      },
      {
        timestamp: "04:32",
        timestampSeconds: 272,
        title: "Making judging legible",
        description:
          "The preview identifies information an audience would need around a score.",
      },
      {
        timestamp: "07:14",
        timestampSeconds: 434,
        title: "Athletes in the field",
        description:
          "Related fictional profiles are introduced without forecasting results.",
      },
      {
        timestamp: "09:35",
        timestampSeconds: 575,
        title: "What remains provisional",
        description:
          "The closing record clearly separates sample information from confirmed operations.",
      },
    ],
    editorialNotes: [
      {
        heading: "Preview scope",
        text: "This feature describes an invented event file. It does not provide official registration, ticketing, venue, or schedule information.",
      },
      {
        heading: "Shared field language",
        text: "Event number, round status, and category labels mirror the competition directory so the relationship remains understandable across both prototypes.",
      },
    ],
    credits: [
      {
        role: "Competition editorial",
        name: "Cali Central Editorial",
        status: "Fictional prototype credit",
      },
      {
        role: "Field direction",
        name: "Pacific Motion Desk",
        status: "Invented event contribution",
      },
      prototypeCredit,
    ],
    relatedAthleteSlugs: [
      "maya-calder",
      "jalen-reyes",
      "elian-park",
      "amara-west",
    ],
    relatedCompetitionSlugs: ["pacific-motion-open"],
    relatedStorySlugs: [
      "judging-the-line",
      "building-a-stage-the-audience-can-understand",
    ],
    relatedVideoSlugs: [
      "after-the-last-round",
      "reading-a-freestyle-round",
    ],
    tags: ["event preview", "freestyle", "competition", "Long Beach"],
    availabilityLabel: "Preview only / No playback",
  },
  {
    canonicalId: "sample.video.maya-calder-between-hold-and-flight",
    slug: "maya-calder-between-hold-and-flight",
    title: "Maya Calder: Between Hold and Flight",
    shortTitle: "Between Hold and Flight",
    episodeNumber: "06",
    seriesSlug: "athlete-file",
    seriesTitle: "Athlete File",
    category: "Athlete Profile",
    format: "Interview/Profile Study",
    status: "archive-sample",
    origin: "cali-central-original",
    source: {
      platform: "Cali Central",
      ownershipStatus: "cali-central-original",
    },
    duration: "10:28",
    durationSeconds: 628,
    publishedDate: "2026-06-24",
    publishedDateDisplay: "June 24, 2026",
    location: "Sacramento, California",
    summary:
      "A fictional portrait of Maya Calder's contrast between static control and expressive freestyle.",
    description: [
      "This athlete file follows Maya Calder, a fictional multidisciplinary profile from the existing Cali Central directory. The conversation centers on how held positions and expressive movement can remain part of the same practice.",
      "The page uses an invented interview excerpt, abstract portrait frame, and prototype credits. It does not document a real person, gym, competition result, or filmed interview.",
    ],
    featured: false,
    homepageFeatured: false,
    visualVariant: "portrait",
    posterLabel: "Athlete frame / Maya Calder",
    frameCode: "ATF-06 / 10:28",
    chapters: [
      {
        timestamp: "00:00",
        timestampSeconds: 0,
        title: "Two movement languages",
        description:
          "Maya's fictional profile introduces the contrast between stillness and pace.",
      },
      {
        timestamp: "02:10",
        timestampSeconds: 130,
        title: "Building a composed opening",
        description:
          "The athlete voice describes why the first shape sets the sample sequence.",
      },
      {
        timestamp: "05:02",
        timestampSeconds: 302,
        title: "The pause between skills",
        description:
          "An abstract frame emphasizes transition space rather than a highlight moment.",
      },
      {
        timestamp: "07:44",
        timestampSeconds: 464,
        title: "Practice with the wider field",
        description:
          "The profile connects individual work to an imagined shared session.",
      },
      {
        timestamp: "09:38",
        timestampSeconds: 578,
        title: "A record still in motion",
        description:
          "The closing note returns the portrait to its fictional prototype status.",
      },
    ],
    transcript: [
      {
        speaker: "Cali Central Editorial",
        timestamp: "00:18",
        text: "The following excerpt is fictional prototype material created for this athlete file.",
      },
      {
        speaker: "Maya Calder",
        timestamp: "02:17",
        text: "A hold gives me a place to listen; movement shows me what I understood while I was there.",
      },
      {
        speaker: "Maya Calder",
        timestamp: "07:51",
        text: "The session feels complete when someone else's question changes how I see my own sequence.",
      },
    ],
    credits: [
      {
        role: "Interview editorial",
        name: "Cali Central Editorial",
        status: "Fictional prototype credit",
      },
      {
        role: "Athlete",
        name: "Maya Calder",
        status: "Fictional athlete profile",
      },
      prototypeCredit,
    ],
    relatedAthleteSlugs: ["maya-calder"],
    relatedCompetitionSlugs: ["golden-state-strength-classic"],
    relatedStorySlugs: [
      "after-the-last-round",
      "one-evening-at-harbor-park",
    ],
    relatedVideoSlugs: [
      "finding-control-through-the-handstand-line",
      "after-the-last-round",
      "one-evening-at-harbor-park",
    ],
    tags: ["athlete profile", "freestyle", "static strength", "Sacramento"],
    availabilityLabel: "Archive sample / No playback",
  },
  {
    canonicalId: "sample.video.the-crew-builds-the-session",
    slug: "the-crew-builds-the-session",
    title: "The Crew Builds the Session",
    shortTitle: "The Crew Builds",
    episodeNumber: "07",
    seriesSlug: "local-motion",
    seriesTitle: "Local Motion",
    category: "Culture",
    format: "Short Documentary",
    status: "published-prototype",
    origin: "cali-central-original",
    source: {
      platform: "Cali Central",
      ownershipStatus: "cali-central-original",
    },
    duration: "07:50",
    durationSeconds: 470,
    publishedDate: "2026-06-17",
    publishedDateDisplay: "June 17, 2026",
    location: "Los Angeles, California",
    summary:
      "A fictional short documentary about shared training structure, collective progress, and the work around each attempt.",
    description: [
      "This Local Motion record follows an invented crew as they prepare a shared training session. Equipment checks, turn-taking, and small exchanges receive the same editorial attention as the movements inside the frame.",
      "The crew, location, dialogue, and production record are fictional. Abstract geometry replaces footage so the prototype can demonstrate community storytelling without representing real participants.",
    ],
    featured: false,
    homepageFeatured: false,
    visualVariant: "team",
    posterLabel: "Crew frame / Shared session",
    frameCode: "LMT-07 / 07:50",
    chapters: [
      {
        timestamp: "00:00",
        timestampSeconds: 0,
        title: "Before the first attempt",
        description:
          "The fictional crew checks the shared space and names the session's needs.",
      },
      {
        timestamp: "01:20",
        timestampSeconds: 80,
        title: "Several plans, one field",
        description:
          "A technical map shows how the group organizes different practice goals.",
      },
      {
        timestamp: "03:25",
        timestampSeconds: 205,
        title: "Progress outside the spotlight",
        description:
          "The archive records counting, resetting, and making room between turns.",
      },
      {
        timestamp: "05:48",
        timestampSeconds: 348,
        title: "The shared final round",
        description:
          "The group chooses an illustrative closing action with broad participation.",
      },
      {
        timestamp: "07:12",
        timestampSeconds: 432,
        title: "Leaving a record",
        description:
          "The session ends with a concise fictional note for the next gathering.",
      },
    ],
    transcript: [
      {
        speaker: "Cali Central Editorial",
        timestamp: "00:12",
        text: "This transcript excerpt, crew, and training ground are fictional prototype material.",
      },
      {
        speaker: "Eastline session voice",
        timestamp: "01:34",
        text: "We start by making the space readable, then everyone can see where their work fits.",
      },
      {
        speaker: "Eastline session voice",
        timestamp: "06:02",
        text: "The last round is small enough to share and clear enough to remember.",
      },
    ],
    credits: [
      {
        role: "Field editorial",
        name: "Cali Central Editorial",
        status: "Fictional prototype credit",
      },
      {
        role: "Session voice",
        name: "Eastline Assembly",
        status: "Invented crew",
      },
      prototypeCredit,
    ],
    relatedAthleteSlugs: ["jalen-reyes", "amara-west", "tessa-marin"],
    relatedCompetitionSlugs: [
      "coastline-team-cup",
      "harbor-frame-sessions",
    ],
    relatedStorySlugs: [
      "built-on-the-bars",
      "one-evening-at-harbor-park",
    ],
    relatedVideoSlugs: [
      "one-evening-at-harbor-park",
      "inside-the-pacific-motion-open",
    ],
    tags: ["crew", "community", "training culture", "shared practice"],
    availabilityLabel: "Published prototype / No playback",
  },
  {
    canonicalId: "sample.video.reading-a-freestyle-round",
    slug: "reading-a-freestyle-round",
    title: "Reading a Freestyle Round",
    shortTitle: "Reading a Round",
    episodeNumber: "08",
    seriesSlug: "field-notes",
    seriesTitle: "Field Notes",
    category: "Competition",
    format: "Editorial Breakdown",
    status: "preview",
    origin: "cali-central-original",
    source: {
      platform: "Cali Central",
      ownershipStatus: "cali-central-original",
    },
    duration: "13:02",
    durationSeconds: 782,
    publishedDate: "2026-06-10",
    publishedDateDisplay: "June 10, 2026",
    location: "San Diego, California",
    summary:
      "A fictional editorial explanation of pacing, difficulty, execution, and composition across a sample freestyle round.",
    description: [
      "This field note treats a freestyle round as a sequence an audience can learn to follow. It separates intended structure, visible execution, pacing, and illustrative score context without claiming one universal judging formula.",
      "The round, athletes, marks, and score references are invented. The feature demonstrates editorial analysis and event literacy, not official judging guidance or verified competition footage.",
    ],
    featured: false,
    homepageFeatured: false,
    visualVariant: "motion",
    posterLabel: "Analysis frame / Freestyle round",
    frameCode: "FLN-08 / 13:02",
    chapters: [
      {
        timestamp: "00:00",
        timestampSeconds: 0,
        title: "The round as a structure",
        description:
          "The fictional sequence is introduced through opening, development, and close.",
      },
      {
        timestamp: "02:16",
        timestampSeconds: 136,
        title: "Difficulty and intent",
        description:
          "The note distinguishes attempted complexity from how a movement is completed.",
      },
      {
        timestamp: "05:04",
        timestampSeconds: 304,
        title: "Execution the audience can see",
        description:
          "Static labels identify observable changes without guessing at private judging.",
      },
      {
        timestamp: "08:18",
        timestampSeconds: 498,
        title: "Pacing and composition",
        description:
          "The sample map follows rhythm, pause, and transitions across the round.",
      },
      {
        timestamp: "11:24",
        timestampSeconds: 684,
        title: "Reading the result carefully",
        description:
          "The closing frame separates a fictional score from an official claim.",
      },
    ],
    editorialNotes: [
      {
        heading: "Describe what is visible",
        text: "The breakdown names observable changes in the fictional round and avoids inventing reasons for a judge's private decision.",
      },
      {
        heading: "No universal scorecard",
        text: "The sample categories are an editorial device for explaining a prototype event, not official rules or a proposed verified formula.",
      },
    ],
    credits: [
      {
        role: "Analysis",
        name: "Cali Central Editorial",
        status: "Fictional prototype credit",
      },
      {
        role: "Round design",
        name: "Field Notes Desk",
        status: "Invented editorial unit",
      },
      prototypeCredit,
    ],
    relatedAthleteSlugs: ["jalen-reyes", "elian-park", "tessa-marin"],
    relatedCompetitionSlugs: [
      "pacific-motion-open",
      "redline-freestyle-trials",
    ],
    relatedStorySlugs: [
      "judging-the-line",
      "building-a-stage-the-audience-can-understand",
    ],
    relatedVideoSlugs: [
      "inside-the-pacific-motion-open",
      "after-the-last-round",
      "building-the-first-clean-transition",
    ],
    tags: ["freestyle", "judging", "execution", "editorial analysis"],
    availabilityLabel: "Preview only / No playback",
  },
] as const satisfies readonly MediaFeature[];

export function getVideoBySlug(slug: string): MediaFeature | undefined {
  return videos.find((video) => video.slug === slug);
}

export function getFeaturedVideo(): MediaFeature | undefined {
  return videos.find((video) => video.featured) ?? videos[0];
}

export function getHomepageVideos(limit = 3): MediaFeature[] {
  return videos
    .filter((video) => video.homepageFeatured)
    .slice(0, limit);
}

export function getVideosBySeries(
  seriesSlug: VideoSeriesSlug,
): MediaFeature[] {
  return videos.filter((video) => video.seriesSlug === seriesSlug);
}

export function getRelatedVideos(
  slugs: readonly string[],
): MediaFeature[] {
  const seenSlugs = new Set<string>();

  return slugs.reduce<MediaFeature[]>((related, slug) => {
    const video = getVideoBySlug(slug);

    if (video && !seenSlugs.has(video.slug)) {
      seenSlugs.add(video.slug);
      related.push(video);
    }

    return related;
  }, []);
}

export function getVideosForCompetition(
  competitionSlug: string,
): MediaFeature[] {
  return videos.filter((video) => {
    const relatedCompetitionSlugs: readonly string[] =
      video.relatedCompetitionSlugs;

    return relatedCompetitionSlugs.includes(competitionSlug);
  });
}

export function getVideosForAthlete(
  athleteSlug: string,
): MediaFeature[] {
  return videos.filter((video) => {
    const relatedAthleteSlugs: readonly string[] =
      video.relatedAthleteSlugs;

    return relatedAthleteSlugs.includes(athleteSlug);
  });
}

export function getVideosForStory(storySlug: string): MediaFeature[] {
  return videos.filter((video) => {
    const relatedStorySlugs: readonly string[] = video.relatedStorySlugs;

    return relatedStorySlugs.includes(storySlug);
  });
}
