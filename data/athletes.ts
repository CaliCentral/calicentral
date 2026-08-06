import type { Athlete } from "@/types/athlete";

export const athletes = [
  {
    slug: "maya-calder",
    name: "Maya Calder",
    initials: "MC",
    profileNumber: "001",
    status: "Fictional athlete profile",
    city: "Sacramento",
    state: "California",
    country: "United States",
    region: "Northern California",
    administrativeArea: "California",
    disciplines: ["Freestyle", "Static strength"],
    primaryDiscipline: "Freestyle",
    secondaryDiscipline: "Static strength",
    primaryCategory: "freestyle",
    specialties: ["statics"],
    profileLabel: "Field record / composed movement",
    shortBio:
      "Maya is a fictional multidisciplinary athlete whose measured combinations connect patient holds with clean changes of pace.",
    fullBio: [
      "This prototype profile follows an imagined training practice built around repeatable shapes. Maya treats a freestyle line as a sequence of decisions: establish control, change direction with purpose, and leave enough space to make the next attempt legible.",
      "At the fictional Northline Park, she divides sessions between quiet static-strength preparation and collaborative combination work. Her record is designed to show how Cali Central can document an athlete's process without presenting sample statistics as official results.",
    ],
    quote:
      "The strongest sessions are the ones where the whole park moves forward.",
    trainingBase: "Northline Park (fictional)",
    yearsActive: "5 sample seasons",
    style: "Static entries, measured tempo, and composed transitions",
    featured: true,
    verification: {
      identityStatus: "unverified",
      profileStatus: "not-reviewed",
    },
    socialLinks: [],
    rankingEligible: false,
    statistics: [
      {
        label: "Training rhythm",
        value: "4 / week",
        detail: "Fictional average sessions",
      },
      {
        label: "Primary focus",
        value: "Freestyle",
        detail: "Static-to-dynamic composition",
      },
      {
        label: "Sample seasons",
        value: "05",
        detail: "Illustrative years active",
      },
    ],
    achievements: [
      {
        year: "2026",
        title: "Northline movement study",
        description:
          "Selected for a fictional technical session focused on transitions between held and moving shapes.",
        status: "Sample recognition",
      },
      {
        year: "2025",
        title: "Capital field showcase finalist",
        description:
          "Recorded a composed final-round sequence in an invented regional showcase.",
        status: "Prototype result",
      },
      {
        year: "2024",
        title: "Shared-session consistency mark",
        description:
          "Recognized in the sample archive for a full season of steady community sessions.",
        status: "Fictional record",
      },
    ],
    timeline: [
      {
        dateLabel: "2022 / Foundation",
        title: "Built a structured base",
        description:
          "Began logging fundamental pulling, support, and landing work in the fictional Northline training group.",
        type: "Training",
      },
      {
        dateLabel: "2024 / Development",
        title: "Connected strength to movement",
        description:
          "Shifted from isolated holds toward short combinations with deliberate entries and exits.",
        type: "Discipline",
      },
      {
        dateLabel: "2025 / Sample season",
        title: "Entered the prototype field",
        description:
          "Appeared in two invented showcases used to demonstrate a public athlete record.",
        type: "Competition",
      },
      {
        dateLabel: "2026 / Current file",
        title: "Refined the pause between skills",
        description:
          "Made control between movements the central theme of the current fictional season.",
        type: "Development",
      },
    ],
    competitionHistory: [],
    relatedStorySlugs: [
      "after-the-last-round",
      "one-evening-at-harbor-park",
    ],
    relatedAthleteSlugs: ["jalen-reyes", "tessa-marin", "amara-west"],
    visualVariant: "signal",
    disciplineCode: "FRS / STC",
  },
  {
    slug: "jalen-reyes",
    name: "Jalen Reyes",
    initials: "JR",
    profileNumber: "002",
    status: "Fictional athlete profile",
    city: "Los Angeles",
    state: "California",
    country: "United States",
    region: "Southern California",
    administrativeArea: "California",
    disciplines: ["Freestyle"],
    primaryDiscipline: "Freestyle",
    primaryCategory: "freestyle",
    specialties: [],
    profileLabel: "Competition file / controlled transitions",
    shortBio:
      "Jalen is a fictional freestyle athlete known in this prototype record for controlled transitions and consistent sample-round construction.",
    fullBio: [
      "Jalen's imagined practice starts with a fixed opening line and ends with one carefully changed detail. That narrow focus gives each session a clear comparison point while leaving room for invention later in the week.",
      "He trains at the fictional Eastline Yard, where shared turn-taking and precise resets shape the pace of the group. His sample competition record emphasizes repeatability rather than a single high-risk attempt.",
    ],
    quote:
      "A round feels complete when every transition explains why the next one belongs.",
    trainingBase: "Eastline Yard (fictional)",
    yearsActive: "6 sample seasons",
    style: "Controlled transitions, compact lines, and repeatable rounds",
    featured: false,
    verification: {
      identityStatus: "unverified",
      profileStatus: "not-reviewed",
    },
    socialLinks: [],
    rankingEligible: false,
    statistics: [
      {
        label: "Round studies",
        value: "12",
        detail: "Fictional season archive",
      },
      {
        label: "Training rhythm",
        value: "5 / week",
        detail: "Fictional average sessions",
      },
    ],
    achievements: [
      {
        year: "2026",
        title: "Open field consistency mark",
        description:
          "Placed first in a fictional sample table built around repeatable round execution.",
        status: "Prototype result",
      },
      {
        year: "2025",
        title: "Eastline sequence study",
        description:
          "Contributed a controlled-transition demonstration to an invented community session.",
        status: "Sample recognition",
      },
      {
        year: "2024",
        title: "Neighborhood round archive",
        description:
          "Completed a fictional season record with every scheduled sample round logged.",
        status: "Fictional record",
      },
    ],
    timeline: [
      {
        dateLabel: "2021 / Foundation",
        title: "Started structured freestyle work",
        description:
          "Organized basic swings, releases, and safe exits into a repeatable weekly practice.",
        type: "Training",
      },
      {
        dateLabel: "2023 / Development",
        title: "Made transitions the focus",
        description:
          "Began judging combinations by the control between skills rather than skill count.",
        type: "Discipline",
      },
      {
        dateLabel: "2025 / Community file",
        title: "Joined the Eastline rotation",
        description:
          "Entered an invented neighborhood training rotation with shared feedback rounds.",
        type: "Community",
      },
      {
        dateLabel: "2026 / Current file",
        title: "Held the sample lead",
        description:
          "Opened the prototype season at the top of the illustrative freestyle table.",
        type: "Competition",
      },
    ],
    competitionHistory: [],
    relatedStorySlugs: ["built-on-the-bars", "after-the-last-round"],
    relatedAthleteSlugs: ["maya-calder", "elian-park", "amara-west"],
    visualVariant: "frame",
    disciplineCode: "FRS / 01",
  },
  {
    slug: "noa-bennett",
    name: "Noa Bennett",
    initials: "NB",
    profileNumber: "003",
    status: "Fictional athlete profile",
    city: "Oakland",
    state: "California",
    country: "United States",
    region: "Bay Area",
    administrativeArea: "California",
    disciplines: ["Static strength"],
    primaryDiscipline: "Static strength",
    primaryCategory: "skills-static",
    specialties: ["statics"],
    profileLabel: "Technical file / patient strength",
    shortBio:
      "Noa is a fictional static-strength athlete whose sample practice centers on alignment, patient progressions, and useful technical cues.",
    fullBio: [
      "In this fictional record, Noa works backward from a stable exit. Every progression must leave enough control to step down deliberately, making the end of an attempt part of the skill rather than an afterthought.",
      "Sessions at the invented East Bay Movement Lab are quiet and methodical: one shape, one observation, one adjustment. The profile illustrates a technical athlete story without presenting the recorded holds as certified performances.",
    ],
    quote:
      "Control is easier to study when the exit receives the same attention as the hold.",
    trainingBase: "East Bay Movement Lab (fictional)",
    yearsActive: "5 sample seasons",
    style: "Patient progressions, clean alignment, and deliberate exits",
    featured: false,
    verification: {
      identityStatus: "unverified",
      profileStatus: "not-reviewed",
    },
    socialLinks: [],
    rankingEligible: false,
    statistics: [
      {
        label: "Technical blocks",
        value: "3 / week",
        detail: "Fictional focused sessions",
      },
      {
        label: "Logged progressions",
        value: "18",
        detail: "Sample season record",
      },
    ],
    achievements: [
      {
        year: "2025",
        title: "Technical clarity citation",
        description:
          "Received fictional recognition for making progression notes readable to training partners.",
        status: "Sample recognition",
      },
      {
        year: "2024",
        title: "Controlled-exit study",
        description:
          "Completed an illustrative training block centered on repeatable exits from held shapes.",
        status: "Fictional record",
      },
    ],
    timeline: [
      {
        dateLabel: "2022 / Foundation",
        title: "Established a patient progression system",
        description:
          "Started recording one technical cue and one clear exit for every sample hold.",
        type: "Training",
      },
      {
        dateLabel: "2024 / Technical file",
        title: "Centered alignment work",
        description:
          "Shifted the fictional program toward position quality and longer recovery between efforts.",
        type: "Development",
      },
      {
        dateLabel: "2025 / Shared practice",
        title: "Led a cue-writing session",
        description:
          "Helped an invented training group compare simple, athlete-specific coaching language.",
        type: "Community",
      },
      {
        dateLabel: "2026 / Current file",
        title: "Moved into the sample lead",
        description:
          "Advanced one place in the illustrative static-strength standings.",
        type: "Competition",
      },
    ],
    competitionHistory: [],
    relatedStorySlugs: ["language-of-control", "judging-the-line"],
    relatedAthleteSlugs: ["rowan-kim", "micah-vale", "maya-calder"],
    visualVariant: "frame",
    disciplineCode: "STC / 01",
  },
  {
    slug: "elian-park",
    name: "Elian Park",
    initials: "EP",
    profileNumber: "004",
    status: "Fictional athlete profile",
    city: "San Jose",
    state: "California",
    country: "United States",
    region: "Bay Area",
    administrativeArea: "California",
    disciplines: ["Freestyle"],
    primaryDiscipline: "Freestyle",
    primaryCategory: "freestyle",
    specialties: [],
    profileLabel: "Motion file / tempo study",
    shortBio:
      "Elian is a fictional freestyle athlete whose combinations use tempo changes and disciplined repetition to make creative lines readable.",
    fullBio: [
      "Elian builds fictional combinations in layers. A simple route establishes direction, a pause creates contrast, and only then does a faster movement enter the sequence. The process keeps creativity tied to an observable structure.",
      "At the invented South Bay Frame, identical opening attempts are recorded from week to week. That repetition gives the sample profile a grounded measure of development without suggesting an official judging record.",
    ],
    quote:
      "Tempo gives a combination punctuation; repetition shows whether it can be read twice.",
    trainingBase: "South Bay Frame (fictional)",
    yearsActive: "4 sample seasons",
    style: "Creative combinations, tempo shifts, and disciplined repetition",
    featured: false,
    verification: {
      identityStatus: "unverified",
      profileStatus: "not-reviewed",
    },
    socialLinks: [],
    rankingEligible: false,
    statistics: [
      {
        label: "Combination studies",
        value: "09",
        detail: "Fictional current-season files",
      },
      {
        label: "Training rhythm",
        value: "4 / week",
        detail: "Fictional average sessions",
      },
    ],
    achievements: [
      {
        year: "2026",
        title: "Tempo composition distinction",
        description:
          "Received a fictional technical note for clear pace changes in a sample final.",
        status: "Sample recognition",
      },
      {
        year: "2025",
        title: "South Bay motion finalist",
        description:
          "Placed in an invented showcase used for this prototype athlete archive.",
        status: "Prototype result",
      },
      {
        year: "2024",
        title: "Repeatable-line record",
        description:
          "Logged six consistent versions of one fictional competition sequence.",
        status: "Fictional record",
      },
    ],
    timeline: [
      {
        dateLabel: "2023 / Foundation",
        title: "Started combination notebooks",
        description:
          "Mapped simple direction changes before testing them in the fictional training space.",
        type: "Training",
      },
      {
        dateLabel: "2024 / Development",
        title: "Introduced deliberate tempo shifts",
        description:
          "Used pauses and slower entries to clarify the faster parts of each sequence.",
        type: "Discipline",
      },
      {
        dateLabel: "2025 / Sample season",
        title: "Tested a repeatable round",
        description:
          "Presented the same opening line across three invented showcase settings.",
        type: "Competition",
      },
      {
        dateLabel: "2026 / Current file",
        title: "Advanced in the prototype table",
        description:
          "Moved one place in the illustrative open-freestyle standings.",
        type: "Competition",
      },
    ],
    competitionHistory: [],
    relatedStorySlugs: [
      "after-the-last-round",
      "building-a-stage-the-audience-can-understand",
    ],
    relatedAthleteSlugs: ["jalen-reyes", "amara-west", "tessa-marin"],
    visualVariant: "motion",
    disciplineCode: "FRS / TMP",
  },
  {
    slug: "tessa-marin",
    name: "Tessa Marín",
    initials: "TM",
    profileNumber: "005",
    status: "Fictional athlete profile",
    city: "San Diego",
    state: "California",
    country: "United States",
    region: "Southern California",
    administrativeArea: "California",
    disciplines: ["Freestyle", "Endurance"],
    primaryDiscipline: "Freestyle",
    secondaryDiscipline: "Endurance",
    primaryCategory: "freestyle",
    specialties: ["endurance"],
    profileLabel: "Season file / fluid endurance",
    shortBio:
      "Tessa is a fictional freestyle athlete whose sample program pairs fluid movement with steady endurance preparation for complete rounds.",
    fullBio: [
      "This imagined profile treats event preparation as an exercise in pacing. Tessa rehearses full sequences at manageable intensity, then isolates the moment where form first begins to fade.",
      "Her fictional sessions at Coastline Rail House move between low-intensity flow work and carefully timed rounds. The record emphasizes how endurance can support expression without turning the profile into a medical or biometric file.",
    ],
    quote:
      "The last movement should still carry the intention of the first.",
    trainingBase: "Coastline Rail House (fictional)",
    yearsActive: "5 sample seasons",
    style: "Fluid lines, even pacing, and complete-round preparation",
    featured: false,
    verification: {
      identityStatus: "unverified",
      profileStatus: "not-reviewed",
    },
    socialLinks: [],
    rankingEligible: false,
    statistics: [
      {
        label: "Full-round studies",
        value: "10",
        detail: "Fictional season archive",
      },
      {
        label: "Training rhythm",
        value: "4 / week",
        detail: "Fictional average sessions",
      },
    ],
    achievements: [
      {
        year: "2026",
        title: "Coastline pacing study",
        description:
          "Completed an invented full-round series with consistent opening and closing shapes.",
        status: "Fictional record",
      },
      {
        year: "2025",
        title: "Sample execution finalist",
        description:
          "Reached the final of a fictional showcase emphasizing clarity through the entire round.",
        status: "Prototype result",
      },
      {
        year: "2024",
        title: "Flow record selection",
        description:
          "Featured in an illustrative local archive for measured, continuous movement.",
        status: "Sample recognition",
      },
    ],
    timeline: [
      {
        dateLabel: "2022 / Foundation",
        title: "Connected flow work to conditioning",
        description:
          "Started alternating technique rounds with controlled fictional endurance blocks.",
        type: "Training",
      },
      {
        dateLabel: "2024 / Development",
        title: "Made pacing visible",
        description:
          "Began marking where tempo changed across each sample combination.",
        type: "Discipline",
      },
      {
        dateLabel: "2025 / Sample season",
        title: "Prepared complete rounds",
        description:
          "Shifted the invented event plan from individual skills to full sequence rehearsals.",
        type: "Competition",
      },
      {
        dateLabel: "2026 / Current file",
        title: "Rebuilt the closing sequence",
        description:
          "Used the current prototype cycle to preserve clarity at the end of each round.",
        type: "Development",
      },
    ],
    competitionHistory: [],
    relatedStorySlugs: [
      "judging-the-line",
      "one-evening-at-harbor-park",
    ],
    relatedAthleteSlugs: ["maya-calder", "elian-park", "amara-west"],
    visualVariant: "motion",
    disciplineCode: "FRS / END",
  },
  {
    slug: "micah-vale",
    name: "Micah Vale",
    initials: "MV",
    profileNumber: "006",
    status: "Fictional athlete profile",
    city: "Fresno",
    state: "California",
    country: "United States",
    region: "Central California",
    administrativeArea: "California",
    disciplines: ["Strength"],
    primaryDiscipline: "Strength",
    primaryCategory: "power-strength",
    specialties: [],
    profileLabel: "Foundation file / structured strength",
    shortBio:
      "Micah is a fictional strength athlete whose sample record is built around foundational pulling work, structured programming, and consistency.",
    fullBio: [
      "Micah's invented program favors modest changes that can be traced across a season. The same core pulling patterns return each week, while volume and tempo move in small, documented steps.",
      "Training at the fictional Valley Motion Yard, Micah keeps the shared session straightforward and leaves difficult variations for focused blocks. This profile shows a durable developmental record rather than a collection of extraordinary claims.",
    ],
    quote:
      "A useful program makes the next week understandable before it makes it harder.",
    trainingBase: "Valley Motion Yard (fictional)",
    yearsActive: "3 sample seasons",
    style: "Foundational pulling, structured blocks, and steady repetition",
    featured: false,
    verification: {
      identityStatus: "unverified",
      profileStatus: "not-reviewed",
    },
    socialLinks: [],
    rankingEligible: false,
    statistics: [
      {
        label: "Program blocks",
        value: "04",
        detail: "Fictional season plan",
      },
      {
        label: "Training rhythm",
        value: "4 / week",
        detail: "Fictional average sessions",
      },
    ],
    achievements: [
      {
        year: "2026",
        title: "Emerging field consistency mark",
        description:
          "Held third place in an invented standings table across two sample updates.",
        status: "Prototype result",
      },
      {
        year: "2025",
        title: "Valley foundation record",
        description:
          "Completed a fictional four-block strength cycle with every session documented.",
        status: "Fictional record",
      },
      {
        year: "2024",
        title: "Structured-practice selection",
        description:
          "Included in an illustrative group study about clear, repeatable programming.",
        status: "Sample recognition",
      },
    ],
    timeline: [
      {
        dateLabel: "2023 / Foundation",
        title: "Started a written strength plan",
        description:
          "Moved from informal sets to a simple fictional schedule of repeatable pulling work.",
        type: "Training",
      },
      {
        dateLabel: "2024 / Development",
        title: "Organized training into blocks",
        description:
          "Introduced measured changes in tempo and total work across the sample season.",
        type: "Development",
      },
      {
        dateLabel: "2025 / Shared practice",
        title: "Opened a weekly foundation session",
        description:
          "Helped maintain an invented low-pressure session for athletes learning basic patterns.",
        type: "Community",
      },
      {
        dateLabel: "2026 / Current file",
        title: "Held a steady sample position",
        description:
          "Maintained third place in the illustrative emerging-athlete category.",
        type: "Competition",
      },
    ],
    competitionHistory: [],
    relatedStorySlugs: ["language-of-control", "built-on-the-bars"],
    relatedAthleteSlugs: ["noa-bennett", "rowan-kim", "jalen-reyes"],
    visualVariant: "frame",
    disciplineCode: "STR / FDN",
  },
  {
    slug: "amara-west",
    name: "Amara West",
    initials: "AW",
    profileNumber: "007",
    status: "Fictional athlete profile",
    city: "Long Beach",
    state: "California",
    country: "United States",
    region: "Southern California",
    administrativeArea: "California",
    disciplines: ["Dynamic freestyle"],
    primaryDiscipline: "Dynamic freestyle",
    primaryCategory: "freestyle",
    specialties: ["dynamic-freestyle"],
    profileLabel: "Signal file / dynamic expression",
    shortBio:
      "Amara is a fictional dynamic-freestyle athlete whose fast combinations are shaped by community sessions and expressive performance choices.",
    fullBio: [
      "In this prototype record, Amara develops speed only after mapping the space around every movement. Approaches and landings are rehearsed separately before they are connected, keeping fast combinations readable to training partners.",
      "The fictional Harbor Frame serves as both training base and shared workshop. One session each week is reserved for athletes to trade sequence ideas, making performance expression a collective practice rather than an isolated reveal.",
    ],
    quote:
      "Speed works best when everyone in the session can still see the route.",
    trainingBase: "Harbor Frame (fictional)",
    yearsActive: "4 sample seasons",
    style: "Fast combinations, clear routes, and expressive direction changes",
    featured: false,
    verification: {
      identityStatus: "unverified",
      profileStatus: "not-reviewed",
    },
    socialLinks: [],
    rankingEligible: false,
    statistics: [
      {
        label: "Route studies",
        value: "11",
        detail: "Fictional season archive",
      },
      {
        label: "Shared sessions",
        value: "1 / week",
        detail: "Prototype community rhythm",
      },
    ],
    achievements: [
      {
        year: "2026",
        title: "Dynamic sample entry",
        description:
          "Entered the invented category at first place in its current prototype update.",
        status: "Prototype result",
      },
      {
        year: "2025",
        title: "Harbor route distinction",
        description:
          "Received fictional recognition for making a fast sequence clear from entry to exit.",
        status: "Sample recognition",
      },
      {
        year: "2024",
        title: "Community combination archive",
        description:
          "Contributed four imagined movement studies to a shared local record.",
        status: "Fictional record",
      },
    ],
    timeline: [
      {
        dateLabel: "2023 / Foundation",
        title: "Mapped movement routes",
        description:
          "Started drawing approach and landing zones before practicing faster sample skills.",
        type: "Training",
      },
      {
        dateLabel: "2024 / Shared practice",
        title: "Built a weekly combination exchange",
        description:
          "Joined an invented session where athletes traded and adapted short movement ideas.",
        type: "Community",
      },
      {
        dateLabel: "2025 / Development",
        title: "Connected speed to expression",
        description:
          "Used direction changes to give each fictional combination a distinct visual rhythm.",
        type: "Discipline",
      },
      {
        dateLabel: "2026 / Current file",
        title: "Entered the prototype standings",
        description:
          "Opened a new illustrative dynamic-freestyle category in the sample lead.",
        type: "Competition",
      },
    ],
    competitionHistory: [],
    relatedStorySlugs: [
      "one-evening-at-harbor-park",
      "building-a-stage-the-audience-can-understand",
    ],
    relatedAthleteSlugs: ["elian-park", "tessa-marin", "maya-calder"],
    visualVariant: "signal",
    disciplineCode: "DYN / SIG",
  },
  {
    slug: "rowan-kim",
    name: "Rowan Kim",
    initials: "RK",
    profileNumber: "008",
    status: "Fictional athlete profile",
    city: "Pasadena",
    state: "California",
    country: "United States",
    region: "Southern California",
    administrativeArea: "California",
    disciplines: ["Static strength", "Hand balancing"],
    primaryDiscipline: "Static strength",
    secondaryDiscipline: "Hand balancing",
    primaryCategory: "skills-static",
    specialties: ["statics", "hand-balancing"],
    profileLabel: "Alignment file / controlled holds",
    shortBio:
      "Rowan is a fictional static-strength and hand-balancing athlete whose sample practice studies alignment through controlled holds.",
    fullBio: [
      "Rowan's imagined training record is organized around reference lines. Hands, shoulders, and hips are checked against simple marks, not to force a universal shape but to make small changes easier to discuss.",
      "At the fictional Arroyo Balance Room, holds are followed by short written observations and long resets. This technical pace supports a profile about attention and craft while keeping every result clearly illustrative.",
    ],
    quote:
      "A line becomes useful when it helps you notice what changed, not when it hides the effort.",
    trainingBase: "Arroyo Balance Room (fictional)",
    yearsActive: "6 sample seasons",
    style: "Alignment study, controlled holds, and precise balance entries",
    featured: false,
    verification: {
      identityStatus: "unverified",
      profileStatus: "not-reviewed",
    },
    socialLinks: [],
    rankingEligible: false,
    statistics: [
      {
        label: "Alignment studies",
        value: "16",
        detail: "Fictional current archive",
      },
      {
        label: "Training rhythm",
        value: "5 / week",
        detail: "Fictional average sessions",
      },
      {
        label: "Sample seasons",
        value: "06",
        detail: "Illustrative years active",
      },
    ],
    achievements: [
      {
        year: "2025",
        title: "Alignment study citation",
        description:
          "Received fictional recognition for clear notes connecting reference lines to sensation.",
        status: "Sample recognition",
      },
      {
        year: "2024",
        title: "Controlled-entry archive",
        description:
          "Completed an illustrative set of hand-balance entries with documented resets.",
        status: "Fictional record",
      },
    ],
    timeline: [
      {
        dateLabel: "2021 / Foundation",
        title: "Started structured balance study",
        description:
          "Added simple reference lines and written observations to each fictional session.",
        type: "Training",
      },
      {
        dateLabel: "2023 / Development",
        title: "Connected hand balance and statics",
        description:
          "Began using shared alignment cues across two sample disciplines.",
        type: "Discipline",
      },
      {
        dateLabel: "2025 / Technical file",
        title: "Created a controlled-entry archive",
        description:
          "Recorded imagined entry patterns to compare setup consistency over time.",
        type: "Development",
      },
      {
        dateLabel: "2026 / Current file",
        title: "Held second in the sample table",
        description:
          "Maintained position through the current illustrative standings update.",
        type: "Competition",
      },
    ],
    competitionHistory: [],
    relatedStorySlugs: [
      "language-of-control",
      "building-a-stage-the-audience-can-understand",
    ],
    relatedAthleteSlugs: ["noa-bennett", "micah-vale", "maya-calder"],
    visualVariant: "signal",
    disciplineCode: "STC / HBL",
  },
] as const satisfies readonly Athlete[];

export function getAthleteBySlug(slug: string): Athlete | undefined {
  return athletes.find((athlete) => athlete.slug === slug);
}

export function getFeaturedAthlete(): Athlete | undefined {
  return athletes.find((athlete) => athlete.featured);
}

export function getRelatedAthletes(slugs: readonly string[]): Athlete[] {
  const seenSlugs = new Set<string>();

  return slugs.reduce<Athlete[]>((relatedAthletes, slug) => {
    const athlete = getAthleteBySlug(slug);

    if (athlete && !seenSlugs.has(athlete.slug)) {
      seenSlugs.add(athlete.slug);
      relatedAthletes.push(athlete);
    }

    return relatedAthletes;
  }, []);
}
