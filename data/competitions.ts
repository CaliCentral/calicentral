import type {
  Competition,
  CompetitionDiscipline,
  CompetitionResultsStatus,
  CompetitionScheduleStatus,
  CompetitionStatus,
  RegistrationStatus,
} from "@/types/competition";

export const competitionStatusLabels = {
  upcoming: "Upcoming",
  completed: "Completed",
  postponed: "Postponed",
  cancelled: "Cancelled",
  preview: "Preview",
} as const satisfies Record<CompetitionStatus, string>;

export const registrationStatusLabels = {
  "not-open": "Registration not open",
  open: "Registration open",
  "preview-only": "Preview listing only",
  closed: "Registration closed",
  "sold-out": "Registration sold out",
  unavailable: "Registration unavailable",
} as const satisfies Record<RegistrationStatus, string>;

export const competitionScheduleStatusLabels = {
  pending: "Schedule pending",
  provisional: "Provisional schedule",
  published: "Schedule published",
  completed: "Schedule complete",
} as const satisfies Record<CompetitionScheduleStatus, string>;

export const competitionResultsStatusLabels = {
  "not-available": "Not available",
  pending: "Pending",
  "verified-results": "Verified results",
  "sample-results": "Sample results",
} as const satisfies Record<CompetitionResultsStatus, string>;

export const competitionDisciplineLabels = {
  freestyle: "Freestyle",
  streetlifting: "Streetlifting",
  "weighted-calisthenics": "Weighted calisthenics",
  "static-strength": "Static strength",
  dynamic: "Dynamic",
  endurance: "Endurance",
  skills: "Skills",
  team: "Team",
  mixed: "Mixed",
} as const satisfies Record<CompetitionDiscipline, string>;

export const competitions: readonly Competition[] = [
  {
    canonicalId: "sample.competition.pacific-motion-open",
    slug: "pacific-motion-open",
    name: "Pacific Motion Open",
    shortName: "Pacific Motion",
    eventNumber: "EVT-001",
    status: "upcoming",
    contentStatus: "fictional-prototype",
    startDate: "2026-08-22",
    dateDisplay: "August 22, 2026",
    monthCode: "AUG",
    day: "22",
    year: "2026",
    city: "Long Beach",
    state: "California",
    country: "United States",
    region: "Southern California",
    venueName: "Pierline Field Hall",
    venueType: "Fictional indoor movement hall",
    summary:
      "An illustrative open-format event built around qualification rounds and a final movement showcase.",
    fullDescription: [
      "Pacific Motion Open is a fictional field test for how Cali Central could document a broad freestyle competition. Its sample format moves from short qualification runs into a smaller final focused on composition, control, and readable transitions.",
      "The event file prioritizes a clear public schedule and plain-language division notes. Every venue detail, participant, time, and competitive outcome on this page is invented for the prototype.",
    ],
    disciplines: ["freestyle", "dynamic", "mixed"],
    primaryDiscipline: "freestyle",
    divisions: [
      {
        slug: "open-freestyle",
        name: "Open Freestyle",
        discipline: "freestyle",
        level: "Open",
        format: "Qualification round and eight-athlete final",
        participantLimit: 32,
        description:
          "Two concise sample rounds balancing difficulty, execution, and composition.",
      },
      {
        slug: "emerging-motion",
        name: "Emerging Motion",
        discipline: "mixed",
        level: "Emerging",
        format: "Single qualification and showcase final",
        participantLimit: 16,
        description:
          "A fictional development division with reduced run length and the same published criteria.",
      },
    ],
    featured: true,
    registrationStatus: "preview-only",
    scheduleStatus: "provisional",
    resultsStatus: "pending",
    capacityLabel: "48 sample athlete places",
    organizerName: "Pacific Motion Assembly (fictional)",
    competitionFormat: "Freestyle open",
    visualVariant: "signal",
    schedule: [
      {
        time: "08:00",
        label: "Athlete check-in",
        description:
          "Illustrative arrival window and field orientation for sample participants.",
        stage: "Operations",
        status: "provisional",
      },
      {
        time: "09:00",
        label: "Technical briefing",
        description:
          "Prototype review of timing, boundaries, and judging language.",
        stage: "Briefing",
        status: "provisional",
      },
      {
        time: "10:00",
        label: "Emerging qualification",
        description: "Short-form sample runs in published order.",
        stage: "Field A",
        status: "provisional",
      },
      {
        time: "11:30",
        label: "Open qualification",
        description: "Fictional qualification round for the open field.",
        stage: "Field A",
        status: "provisional",
      },
      {
        time: "14:30",
        label: "Final movement showcase",
        description:
          "Illustrative finals sequence with a separate results review.",
        stage: "Final",
        status: "provisional",
      },
      {
        time: "16:30",
        label: "Results review",
        description:
          "Sample score clarification period before the closing session.",
        stage: "Operations",
        status: "provisional",
      },
    ],
    participants: [
      {
        athleteSlug: "jalen-reyes",
        athleteName: "Jalen Reyes",
        city: "Los Angeles",
        discipline: "freestyle",
        seed: "01",
        status: "sample-entry",
      },
      {
        athleteSlug: "elian-park",
        athleteName: "Elian Park",
        city: "San Jose",
        discipline: "freestyle",
        seed: "02",
        status: "sample-entry",
      },
      {
        athleteSlug: "amara-west",
        athleteName: "Amara West",
        city: "Long Beach",
        discipline: "dynamic",
        seed: "03",
        status: "sample-entry",
      },
      {
        athleteSlug: "maya-calder",
        athleteName: "Maya Calder",
        city: "Sacramento",
        discipline: "mixed",
        seed: "04",
        status: "invited",
      },
      {
        athleteName: "Sora Finch",
        city: "Ventura",
        discipline: "freestyle",
        seed: "05",
        status: "preview",
      },
    ],
    results: [],
    relatedStorySlugs: [
      "judging-the-line",
      "building-a-stage-the-audience-can-understand",
    ],
    relatedVideoSlugs: [
      "inside-the-pacific-motion-open",
      "reading-a-freestyle-round",
    ],
    relatedAthleteSlugs: [
      "jalen-reyes",
      "elian-park",
      "amara-west",
      "maya-calder",
    ],
    relatedCompetitionSlugs: [
      "redline-freestyle-trials",
      "coastline-team-cup",
    ],
    timeline: [
      {
        dateLabel: "May 2026",
        title: "Prototype event announced",
        description:
          "The fictional open was added to the Cali Central sample calendar.",
        status: "complete",
      },
      {
        dateLabel: "June 2026",
        title: "Division structure published",
        description:
          "Two illustrative divisions and participant limits were documented.",
        status: "complete",
      },
      {
        dateLabel: "July 2026",
        title: "Sample participant list added",
        description:
          "Fictional athlete entries were attached to the public preview.",
        status: "current",
      },
      {
        dateLabel: "August 2026",
        title: "Schedule review",
        description:
          "Provisional times remain subject to the prototype notice.",
        status: "pending",
      },
    ],
    notices: [
      {
        label: "Prototype listing",
        text: "No registration, ticketing, or athlete-entry workflow is available.",
        emphasis: "signal",
      },
      {
        label: "Illustrative schedule",
        text: "Every published time is fictional and remains provisional.",
        emphasis: "standard",
      },
    ],
  },
  {
    canonicalId: "sample.competition.golden-state-strength-classic",
    slug: "golden-state-strength-classic",
    name: "Golden State Strength Classic",
    shortName: "Strength Classic",
    eventNumber: "EVT-002",
    status: "upcoming",
    contentStatus: "fictional-prototype",
    startDate: "2026-09-12",
    dateDisplay: "September 12, 2026",
    monthCode: "SEP",
    day: "12",
    year: "2026",
    city: "Sacramento",
    state: "California",
    country: "United States",
    region: "Northern California",
    venueName: "Capitol Line Workshop",
    venueType: "Fictional strength studio",
    summary:
      "A fictional strength-focused meet emphasizing controlled holds and transparent judging criteria.",
    fullDescription: [
      "Golden State Strength Classic is an illustrative meet organized around static positions and a mixed-strength sequence. The sample program gives each hold a named window and keeps deductions separate from positive category totals.",
      "This event file demonstrates how technical criteria, participant context, and schedule notes might be presented without claiming an official federation or verified performance record.",
    ],
    disciplines: ["static-strength", "mixed"],
    primaryDiscipline: "static-strength",
    divisions: [
      {
        slug: "static-strength-open",
        name: "Static Strength Open",
        discipline: "static-strength",
        level: "Open",
        format: "Four-position controlled hold sequence",
        participantLimit: 20,
        description:
          "A sample division measuring recognizable entries, holds, and deliberate exits.",
      },
      {
        slug: "mixed-strength",
        name: "Mixed Strength",
        discipline: "mixed",
        level: "Open",
        format: "Static and repetition-based sequence",
        participantLimit: 16,
        description:
          "An illustrative combination of static control and repeatable strength work.",
      },
    ],
    featured: false,
    registrationStatus: "not-open",
    scheduleStatus: "published",
    resultsStatus: "pending",
    capacityLabel: "36 sample athlete places",
    organizerName: "North State Control Group (fictional)",
    competitionFormat: "Static and mixed strength",
    visualVariant: "frame",
    schedule: [
      {
        time: "08:30",
        label: "Field check",
        description:
          "Sample equipment inspection and athlete orientation period.",
        stage: "Operations",
        status: "planned",
      },
      {
        time: "09:30",
        label: "Criteria briefing",
        description:
          "Plain-language review of holds, exits, and named deductions.",
        stage: "Briefing",
        status: "planned",
      },
      {
        time: "10:30",
        label: "Static Strength Open",
        description: "Fictional four-position strength sequence.",
        stage: "Platform A",
        status: "planned",
      },
      {
        time: "13:30",
        label: "Mixed Strength",
        description: "Illustrative mixed sequence in seeded order.",
        stage: "Platform A",
        status: "planned",
      },
      {
        time: "16:00",
        label: "Sample results review",
        description:
          "Prototype review period before the field file is closed.",
        stage: "Operations",
        status: "planned",
      },
    ],
    participants: [
      {
        athleteSlug: "noa-bennett",
        athleteName: "Noa Bennett",
        city: "Oakland",
        discipline: "static-strength",
        seed: "01",
        status: "sample-entry",
      },
      {
        athleteSlug: "rowan-kim",
        athleteName: "Rowan Kim",
        city: "Pasadena",
        discipline: "static-strength",
        seed: "02",
        status: "sample-entry",
      },
      {
        athleteSlug: "micah-vale",
        athleteName: "Micah Vale",
        city: "Fresno",
        discipline: "mixed",
        seed: "03",
        status: "sample-entry",
      },
      {
        athleteSlug: "maya-calder",
        athleteName: "Maya Calder",
        city: "Sacramento",
        discipline: "mixed",
        seed: "04",
        status: "invited",
      },
    ],
    results: [],
    relatedStorySlugs: ["language-of-control", "judging-the-line"],
    relatedVideoSlugs: [
      "building-the-first-clean-transition",
      "maya-calder-between-hold-and-flight",
    ],
    relatedAthleteSlugs: [
      "noa-bennett",
      "rowan-kim",
      "micah-vale",
      "maya-calder",
    ],
    relatedCompetitionSlugs: [
      "valley-control-meet",
      "pacific-motion-open",
    ],
    timeline: [
      {
        dateLabel: "June 2026",
        title: "Strength file opened",
        description:
          "The fictional meet entered the prototype competition calendar.",
        status: "complete",
      },
      {
        dateLabel: "July 2026",
        title: "Criteria note published",
        description:
          "Illustrative hold and exit language was added for public review.",
        status: "complete",
      },
      {
        dateLabel: "August 2026",
        title: "Sample field review",
        description:
          "Participant and run-order details remain presentation-only.",
        status: "current",
      },
    ],
    notices: [
      {
        label: "Registration status",
        text: "Registration is not open; the participant field is illustrative.",
        emphasis: "signal",
      },
      {
        label: "Criteria status",
        text: "The displayed rules are a prototype and not an official judging standard.",
        emphasis: "standard",
      },
    ],
  },
  {
    canonicalId: "sample.competition.coastline-team-cup",
    slug: "coastline-team-cup",
    name: "Coastline Team Cup",
    shortName: "Coastline Cup",
    eventNumber: "EVT-003",
    status: "upcoming",
    contentStatus: "fictional-prototype",
    startDate: "2026-10-03",
    dateDisplay: "October 3, 2026",
    monthCode: "OCT",
    day: "03",
    year: "2026",
    city: "San Diego",
    state: "California",
    country: "United States",
    region: "Southern California",
    venueName: "South Bay Fieldhouse",
    venueType: "Fictional community fieldhouse",
    summary:
      "A fictional team event combining synchronized work, individual routines, and relay-style rounds.",
    fullDescription: [
      "Coastline Team Cup is a sample invitational built to show how a team format could remain legible across several kinds of movement. Each fictional crew moves through synchronized, individual, and relay-style stages.",
      "The public file centers round order and team responsibilities rather than ticketing or entry flows. Names, crews, venue details, and schedule items are invented.",
    ],
    disciplines: ["team", "freestyle", "endurance"],
    primaryDiscipline: "team",
    divisions: [
      {
        slug: "team-invitational",
        name: "Team Invitational",
        discipline: "team",
        level: "Invitational",
        format: "Three-person crews across three rounds",
        participantLimit: 8,
        description:
          "A fictional crew format combining shared composition and individual contributions.",
      },
      {
        slug: "movement-relay",
        name: "Movement Relay",
        discipline: "endurance",
        level: "Open showcase",
        format: "Timed three-stage relay",
        participantLimit: 8,
        description:
          "An illustrative relay focused on handoffs, pacing, and repeatable movement.",
      },
    ],
    featured: false,
    registrationStatus: "preview-only",
    scheduleStatus: "provisional",
    resultsStatus: "pending",
    capacityLabel: "Eight fictional crews",
    organizerName: "Coastline Movement Table (fictional)",
    competitionFormat: "Team invitational",
    visualVariant: "field",
    schedule: [
      {
        time: "09:00",
        label: "Crew arrival",
        description: "Illustrative check-in and shared field walk.",
        stage: "Operations",
        status: "provisional",
      },
      {
        time: "10:00",
        label: "Synchronized round",
        description:
          "Fictional crew compositions presented in sample order.",
        stage: "Round 01",
        status: "provisional",
      },
      {
        time: "12:00",
        label: "Individual round",
        description:
          "One designated athlete presents a short routine for each crew.",
        stage: "Round 02",
        status: "provisional",
      },
      {
        time: "14:30",
        label: "Movement relay",
        description: "Three-stage illustrative relay sequence.",
        stage: "Round 03",
        status: "provisional",
      },
      {
        time: "16:00",
        label: "Field close",
        description: "Sample totals review and closing session.",
        stage: "Operations",
        status: "provisional",
      },
    ],
    participants: [
      {
        athleteSlug: "tessa-marin",
        athleteName: "Tessa Marín",
        city: "San Diego",
        discipline: "team",
        seed: "A1",
        status: "invited",
      },
      {
        athleteSlug: "amara-west",
        athleteName: "Amara West",
        city: "Long Beach",
        discipline: "freestyle",
        seed: "A2",
        status: "invited",
      },
      {
        athleteSlug: "jalen-reyes",
        athleteName: "Jalen Reyes",
        city: "Los Angeles",
        discipline: "freestyle",
        seed: "B1",
        status: "sample-entry",
      },
      {
        athleteName: "Niko Ames",
        city: "Chula Vista",
        discipline: "endurance",
        seed: "B2",
        status: "preview",
      },
    ],
    results: [],
    relatedStorySlugs: [
      "built-on-the-bars",
      "one-evening-at-harbor-park",
    ],
    relatedVideoSlugs: [
      "the-crew-builds-the-session",
      "one-evening-at-harbor-park",
    ],
    relatedAthleteSlugs: [
      "tessa-marin",
      "amara-west",
      "jalen-reyes",
    ],
    relatedCompetitionSlugs: [
      "harbor-frame-sessions",
      "pacific-motion-open",
    ],
    timeline: [
      {
        dateLabel: "June 2026",
        title: "Team concept published",
        description:
          "The fictional three-round structure entered the public preview.",
        status: "complete",
      },
      {
        dateLabel: "August 2026",
        title: "Crew roles documented",
        description:
          "Sample responsibilities were added for each round.",
        status: "current",
      },
      {
        dateLabel: "September 2026",
        title: "Provisional order review",
        description:
          "The illustrative run order remains subject to revision.",
        status: "pending",
      },
    ],
    notices: [
      {
        label: "Crew preview",
        text: "Crew names and athlete assignments are fictional sample content.",
        emphasis: "signal",
      },
      {
        label: "Schedule status",
        text: "Round times are provisional and do not describe a real event.",
        emphasis: "standard",
      },
    ],
  },
  {
    canonicalId: "sample.competition.harbor-frame-sessions",
    slug: "harbor-frame-sessions",
    name: "Harbor Frame Sessions",
    shortName: "Harbor Frames",
    eventNumber: "EVT-004",
    status: "completed",
    contentStatus: "fictional-prototype",
    startDate: "2026-06-20",
    dateDisplay: "June 20, 2026",
    monthCode: "JUN",
    day: "20",
    year: "2026",
    city: "Oakland",
    state: "California",
    country: "United States",
    region: "Bay Area",
    venueName: "Harbor Frame Yard",
    venueType: "Fictional outdoor community space",
    summary:
      "A completed fictional community showcase focused on local crews and exhibition rounds.",
    fullDescription: [
      "Harbor Frame Sessions imagines a smaller community format in which exhibition rounds and shared practice sit beside a concise judged showcase. The archived file demonstrates a completed event state without presenting the sample outcomes as official.",
      "The fictional day moved from an open field briefing into crew exhibitions and a final individual frame. Results below exist only to test placement, athlete links, and archival language.",
    ],
    disciplines: ["freestyle", "team", "dynamic"],
    primaryDiscipline: "freestyle",
    divisions: [
      {
        slug: "community-showcase",
        name: "Community Showcase",
        discipline: "team",
        level: "Open exhibition",
        format: "Crew-led non-elimination sessions",
        participantLimit: 24,
        description:
          "A sample exhibition field centered on shared composition and clear transitions.",
      },
      {
        slug: "harbor-frame-final",
        name: "Harbor Frame Final",
        discipline: "freestyle",
        level: "Open",
        format: "Single judged final",
        participantLimit: 8,
        description:
          "A fictional closing round scored for composition, execution, and control.",
      },
    ],
    featured: false,
    registrationStatus: "closed",
    scheduleStatus: "completed",
    resultsStatus: "sample-results",
    capacityLabel: "32 fictional participants",
    organizerName: "Harbor Frame Collective (fictional)",
    competitionFormat: "Community showcase",
    visualVariant: "frame",
    schedule: [
      {
        time: "09:30",
        label: "Field briefing",
        description: "Archived sample orientation and space review.",
        stage: "Operations",
        status: "complete",
      },
      {
        time: "10:30",
        label: "Community sessions",
        description: "Fictional crew exhibitions across the open field.",
        stage: "Showcase",
        status: "complete",
      },
      {
        time: "13:00",
        label: "Frame qualification",
        description: "Illustrative individual qualification sequence.",
        stage: "Qualification",
        status: "complete",
      },
      {
        time: "15:00",
        label: "Harbor Frame Final",
        description: "Eight-athlete fictional closing round.",
        stage: "Final",
        status: "complete",
      },
      {
        time: "16:30",
        label: "Archive close",
        description: "Sample results recorded and field returned to session use.",
        stage: "Operations",
        status: "complete",
      },
    ],
    participants: [],
    results: [
      {
        placement: 1,
        athleteSlug: "amara-west",
        athleteName: "Amara West",
        region: "Southern California",
        scoreDisplay: "88.6 pts",
        resultLabel: "Sample winner",
        movementNote: "Clear tempo changes and a controlled final line.",
      },
      {
        placement: 2,
        athleteSlug: "tessa-marin",
        athleteName: "Tessa Marín",
        region: "Southern California",
        scoreDisplay: "86.2 pts",
        resultLabel: "Sample runner-up",
        movementNote: "Consistent execution through the full fictional round.",
      },
      {
        placement: 3,
        athleteSlug: "jalen-reyes",
        athleteName: "Jalen Reyes",
        region: "Southern California",
        scoreDisplay: "84.9 pts",
        resultLabel: "Sample third",
        movementNote: "Direct composition with a deliberate exit.",
      },
      {
        placement: 4,
        athleteName: "Iris Sol",
        region: "Bay Area",
        scoreDisplay: "82.4 pts",
        resultLabel: "Sample finalist",
        movementNote: "Measured pacing across the illustrative field.",
      },
    ],
    relatedStorySlugs: [
      "one-evening-at-harbor-park",
      "built-on-the-bars",
    ],
    relatedVideoSlugs: [
      "one-evening-at-harbor-park",
      "the-crew-builds-the-session",
    ],
    relatedAthleteSlugs: [
      "amara-west",
      "tessa-marin",
      "jalen-reyes",
    ],
    relatedCompetitionSlugs: [
      "coastline-team-cup",
      "redline-freestyle-trials",
    ],
    timeline: [
      {
        dateLabel: "April 2026",
        title: "Showcase announced",
        description:
          "The fictional community format was added to the sample field.",
        status: "complete",
      },
      {
        dateLabel: "May 2026",
        title: "Exhibition order published",
        description:
          "Illustrative crew and individual stages were documented.",
        status: "complete",
      },
      {
        dateLabel: "June 20, 2026",
        title: "Sample event completed",
        description:
          "The fictional field moved through every archived schedule item.",
        status: "complete",
      },
      {
        dateLabel: "June 23, 2026",
        title: "Results archived",
        description:
          "Presentation-only placements were added to the prototype record.",
        status: "complete",
      },
    ],
    notices: [
      {
        label: "Sample results",
        text: "Placements and scores are invented and are not official records.",
        emphasis: "signal",
      },
      {
        label: "Archive status",
        text: "This completed state demonstrates presentation only; no real event occurred.",
        emphasis: "standard",
      },
    ],
  },
  {
    canonicalId: "sample.competition.redline-freestyle-trials",
    slug: "redline-freestyle-trials",
    name: "Redline Freestyle Trials",
    shortName: "Redline Trials",
    eventNumber: "EVT-005",
    status: "completed",
    contentStatus: "fictional-prototype",
    startDate: "2026-05-16",
    dateDisplay: "May 16, 2026",
    monthCode: "MAY",
    day: "16",
    year: "2026",
    city: "Los Angeles",
    state: "California",
    country: "United States",
    region: "Southern California",
    venueName: "Redline Movement Room",
    venueType: "Fictional indoor field",
    summary:
      "A completed fictional qualification event emphasizing composition, control, and execution.",
    fullDescription: [
      "Redline Freestyle Trials is an invented qualification file built around short rounds and visible category totals. It demonstrates how a completed competition might preserve format notes alongside concise sample results.",
      "The archive separates execution, composition, and named deductions in its fictional framing, while avoiding any claim that the scores came from a recognized event or federation.",
    ],
    disciplines: ["freestyle", "dynamic"],
    primaryDiscipline: "freestyle",
    divisions: [
      {
        slug: "freestyle-qualification",
        name: "Freestyle Qualification",
        discipline: "freestyle",
        level: "Open",
        format: "Two short qualification rounds",
        participantLimit: 24,
        description:
          "A prototype trial focused on readable composition and completed movement.",
      },
      {
        slug: "dynamic-line",
        name: "Dynamic Line",
        discipline: "dynamic",
        level: "Open",
        format: "Single controlled dynamic sequence",
        participantLimit: 12,
        description:
          "An illustrative secondary field emphasizing setup, flight, and landing control.",
      },
    ],
    featured: false,
    registrationStatus: "closed",
    scheduleStatus: "completed",
    resultsStatus: "sample-results",
    capacityLabel: "36 fictional participants",
    organizerName: "Redline Field Office (fictional)",
    competitionFormat: "Freestyle qualification",
    visualVariant: "signal",
    schedule: [
      {
        time: "08:00",
        label: "Athlete arrival",
        description: "Archived sample check-in window.",
        stage: "Operations",
        status: "complete",
      },
      {
        time: "09:00",
        label: "Judging briefing",
        description: "Illustrative category and deduction review.",
        stage: "Briefing",
        status: "complete",
      },
      {
        time: "10:00",
        label: "Qualification round one",
        description: "First fictional short-form trial.",
        stage: "Round 01",
        status: "complete",
      },
      {
        time: "13:00",
        label: "Qualification round two",
        description: "Second fictional short-form trial.",
        stage: "Round 02",
        status: "complete",
      },
      {
        time: "15:30",
        label: "Results review",
        description: "Sample category totals and placements archived.",
        stage: "Operations",
        status: "complete",
      },
    ],
    participants: [],
    results: [
      {
        placement: 1,
        athleteSlug: "jalen-reyes",
        athleteName: "Jalen Reyes",
        region: "Southern California",
        scoreDisplay: "91.8 pts",
        resultLabel: "Sample qualifier",
        movementNote: "Direct structure and consistent completion across both rounds.",
      },
      {
        placement: 2,
        athleteSlug: "elian-park",
        athleteName: "Elian Park",
        region: "Bay Area",
        scoreDisplay: "89.7 pts",
        resultLabel: "Sample qualifier",
        movementNote: "Clear tempo variation with one named deduction.",
      },
      {
        placement: 3,
        athleteSlug: "tessa-marin",
        athleteName: "Tessa Marín",
        region: "Southern California",
        scoreDisplay: "87.5 pts",
        resultLabel: "Sample qualifier",
        movementNote: "Controlled pacing and a readable final transition.",
      },
      {
        placement: 4,
        athleteName: "Devon Hale",
        region: "Central Coast",
        scoreDisplay: "84.1 pts",
        resultLabel: "Sample finalist",
        movementNote: "Balanced fictional scores across the two trial rounds.",
      },
    ],
    relatedStorySlugs: [
      "after-the-last-round",
      "judging-the-line",
      "building-a-stage-the-audience-can-understand",
    ],
    relatedVideoSlugs: [
      "after-the-last-round",
      "reading-a-freestyle-round",
    ],
    relatedAthleteSlugs: [
      "jalen-reyes",
      "elian-park",
      "tessa-marin",
    ],
    relatedCompetitionSlugs: [
      "pacific-motion-open",
      "harbor-frame-sessions",
    ],
    timeline: [
      {
        dateLabel: "March 2026",
        title: "Trial format posted",
        description:
          "Two fictional qualification rounds were added to the prototype.",
        status: "complete",
      },
      {
        dateLabel: "April 2026",
        title: "Sample field added",
        description:
          "Illustrative athlete names and run order were documented.",
        status: "complete",
      },
      {
        dateLabel: "May 16, 2026",
        title: "Trials completed",
        description:
          "The fictional schedule was marked complete for archive testing.",
        status: "complete",
      },
      {
        dateLabel: "May 18, 2026",
        title: "Sample results posted",
        description:
          "Invented placements and scores entered the public record.",
        status: "complete",
      },
    ],
    notices: [
      {
        label: "Not official",
        text: "The qualification labels do not grant entry to any real competition.",
        emphasis: "signal",
      },
      {
        label: "Fictional scores",
        text: "All totals, deductions, and placements are illustrative.",
        emphasis: "standard",
      },
    ],
  },
  {
    canonicalId: "sample.competition.valley-control-meet",
    slug: "valley-control-meet",
    name: "Valley Control Meet",
    shortName: "Valley Control",
    eventNumber: "EVT-006",
    status: "postponed",
    contentStatus: "fictional-prototype",
    startDate: "2026-11-07",
    dateDisplay: "Date under review",
    monthCode: "TBD",
    day: "--",
    year: "2026",
    city: "Fresno",
    state: "California",
    country: "United States",
    region: "Central California",
    venueName: "Valley Line Studio",
    venueType: "Fictional local training room",
    summary:
      "A postponed fictional static-strength meet demonstrating how alternate event states remain clear.",
    fullDescription: [
      "Valley Control Meet is an illustrative local strength event whose sample date has been placed under review. The page demonstrates a postponed state without implying urgency, accepting registration, or publishing times that are no longer dependable.",
      "Division descriptions remain visible as editorial context, while the schedule and participant field stay withheld until the fictional planning record changes.",
    ],
    disciplines: ["static-strength", "endurance"],
    primaryDiscipline: "static-strength",
    divisions: [
      {
        slug: "valley-static-open",
        name: "Valley Static Open",
        discipline: "static-strength",
        level: "Open",
        format: "Three-position controlled hold sequence",
        participantLimit: 16,
        description:
          "A proposed sample division emphasizing clear entries and deliberate exits.",
      },
      {
        slug: "control-endurance",
        name: "Control Endurance",
        discipline: "endurance",
        level: "Open",
        format: "Measured repetition sequence",
        participantLimit: 16,
        description:
          "An illustrative secondary division focused on pace and repeatable form.",
      },
    ],
    featured: false,
    registrationStatus: "unavailable",
    scheduleStatus: "pending",
    resultsStatus: "not-available",
    capacityLabel: "Capacity not published",
    organizerName: "Valley Control Desk (fictional)",
    competitionFormat: "Static strength meet",
    visualVariant: "field",
    schedule: [],
    participants: [],
    results: [],
    relatedStorySlugs: ["language-of-control", "judging-the-line"],
    relatedVideoSlugs: ["building-the-first-clean-transition"],
    relatedAthleteSlugs: ["micah-vale", "noa-bennett", "rowan-kim"],
    relatedCompetitionSlugs: [
      "golden-state-strength-classic",
      "harbor-frame-sessions",
    ],
    timeline: [
      {
        dateLabel: "July 2026",
        title: "Preview listing opened",
        description:
          "The fictional meet was added without registration or final times.",
        status: "complete",
      },
      {
        dateLabel: "August 2026",
        title: "Division outline drafted",
        description:
          "Two proposed sample divisions were documented.",
        status: "complete",
      },
      {
        dateLabel: "September 2026",
        title: "Date review started",
        description:
          "The illustrative event date was placed under review.",
        status: "paused",
      },
      {
        dateLabel: "Pending",
        title: "Schedule publication",
        description:
          "No times will appear until the fictional event status changes.",
        status: "pending",
      },
    ],
    notices: [
      {
        label: "Event postponed",
        text: "The sample date is under review and no replacement date is promised.",
        emphasis: "signal",
      },
      {
        label: "No schedule",
        text: "Times, participants, registration, and results are intentionally unavailable.",
        emphasis: "standard",
      },
    ],
  },
];

export function getCompetitionBySlug(
  slug: string,
): Competition | undefined {
  return competitions.find((competition) => competition.slug === slug);
}

export function getFeaturedCompetition(): Competition | undefined {
  return (
    competitions.find(
      (competition) =>
        competition.featured && competition.status === "upcoming",
    ) ?? getUpcomingCompetitions()[0]
  );
}

export function getUpcomingCompetitions(): Competition[] {
  return competitions
    .filter((competition) => competition.status === "upcoming")
    .slice()
    .sort((first, second) => first.startDate.localeCompare(second.startDate));
}

export function getCompletedCompetitions(): Competition[] {
  return competitions
    .filter((competition) => competition.status === "completed")
    .slice()
    .sort((first, second) => second.startDate.localeCompare(first.startDate));
}

export function getRelatedCompetitions(
  slugs: readonly string[],
): Competition[] {
  const seenSlugs = new Set<string>();

  return slugs.reduce<Competition[]>((related, slug) => {
    const competition = getCompetitionBySlug(slug);

    if (competition && !seenSlugs.has(competition.slug)) {
      seenSlugs.add(competition.slug);
      related.push(competition);
    }

    return related;
  }, []);
}

export function getCompetitionsForAthlete(
  athleteSlug: string,
): Competition[] {
  return competitions.filter(
    (competition) =>
      competition.relatedAthleteSlugs.includes(athleteSlug) ||
      competition.participants.some(
        (participant) => participant.athleteSlug === athleteSlug,
      ) ||
      competition.results.some(
        (result) => result.athleteSlug === athleteSlug,
      ),
  );
}

export function getCompetitionsForStory(
  storySlug: string,
): Competition[] {
  return competitions.filter((competition) =>
    competition.relatedStorySlugs.includes(storySlug),
  );
}

export function getCompetitionsForVideo(
  videoSlug: string,
): Competition[] {
  return competitions.filter((competition) =>
    competition.relatedVideoSlugs.includes(videoSlug),
  );
}
