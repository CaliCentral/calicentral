import type {
  AthleteRanking,
  RankingCategory,
  RankingCategorySlug,
} from "@/types/ranking";

const prototypeDisclaimer =
  "Fictional sample standings for interface demonstration only. These positions and points are not official or verified.";

export const rankingCategories = [
  {
    slug: "open-freestyle-california",
    title: "Open Freestyle",
    subtitle: "California field",
    discipline: "Freestyle",
    division: "Open",
    region: "California",
    status: "Prototype standings",
    updatedLabel: "Sample update / July 2026",
    description:
      "An illustrative open field built around control, composition, and consistency across fictional freestyle records.",
    disclaimer: prototypeDisclaimer,
    entries: [
      {
        rank: 1,
        athleteSlug: "jalen-reyes",
        athleteName: "Jalen Reyes",
        region: "Southern California",
        points: 1024,
        movement: { direction: "hold", amount: 0, label: "Hold" },
        previousRank: 1,
        statusLabel: "Prototype record",
      },
      {
        rank: 2,
        athleteSlug: "elian-park",
        athleteName: "Elian Park",
        region: "Bay Area",
        points: 972,
        movement: { direction: "up", amount: 1, label: "Up 1" },
        previousRank: 3,
        statusLabel: "Prototype record",
      },
      {
        rank: 3,
        athleteSlug: "tessa-marin",
        athleteName: "Tessa Marín",
        region: "Southern California",
        points: 934,
        movement: { direction: "down", amount: 1, label: "Down 1" },
        previousRank: 2,
        statusLabel: "Prototype record",
      },
      {
        rank: 4,
        athleteSlug: "maya-calder",
        athleteName: "Maya Calder",
        region: "Northern California",
        points: 884,
        movement: { direction: "up", amount: 1, label: "Up 1" },
        previousRank: 5,
        statusLabel: "Prototype record",
      },
      {
        rank: 5,
        athleteSlug: "amara-west",
        athleteName: "Amara West",
        region: "Southern California",
        points: 847,
        movement: { direction: "new", amount: 0, label: "New" },
        statusLabel: "Prototype record",
      },
    ],
  },
  {
    slug: "static-strength-california",
    title: "Static Strength",
    subtitle: "California field",
    discipline: "Static strength",
    division: "Open",
    region: "California",
    status: "Prototype standings",
    updatedLabel: "Sample update / July 2026",
    description:
      "A fictional comparison of patient holds, repeatable positions, and technical control within an open static-strength field.",
    disclaimer: prototypeDisclaimer,
    entries: [
      {
        rank: 1,
        athleteSlug: "noa-bennett",
        athleteName: "Noa Bennett",
        region: "Bay Area",
        points: 998,
        movement: { direction: "up", amount: 1, label: "Up 1" },
        previousRank: 2,
        statusLabel: "Prototype record",
      },
      {
        rank: 2,
        athleteSlug: "rowan-kim",
        athleteName: "Rowan Kim",
        region: "Southern California",
        points: 952,
        movement: { direction: "hold", amount: 0, label: "Hold" },
        previousRank: 2,
        statusLabel: "Prototype record",
      },
      {
        rank: 3,
        athleteSlug: "maya-calder",
        athleteName: "Maya Calder",
        region: "Northern California",
        points: 908,
        movement: { direction: "down", amount: 1, label: "Down 1" },
        previousRank: 2,
        statusLabel: "Prototype record",
      },
      {
        rank: 4,
        athleteSlug: "micah-vale",
        athleteName: "Micah Vale",
        region: "Central California",
        points: 861,
        movement: { direction: "up", amount: 2, label: "Up 2" },
        previousRank: 6,
        statusLabel: "Prototype record",
      },
    ],
  },
  {
    slug: "dynamic-freestyle-california",
    title: "Dynamic Freestyle",
    subtitle: "California field",
    discipline: "Dynamic freestyle",
    division: "Open",
    region: "California",
    status: "Prototype standings",
    updatedLabel: "Sample update / July 2026",
    description:
      "A sample board for pace, connection, and composed landings across fictional dynamic-freestyle profiles.",
    disclaimer: prototypeDisclaimer,
    entries: [
      {
        rank: 1,
        athleteSlug: "amara-west",
        athleteName: "Amara West",
        region: "Southern California",
        points: 1011,
        movement: { direction: "new", amount: 0, label: "New" },
        statusLabel: "Prototype record",
      },
      {
        rank: 2,
        athleteSlug: "jalen-reyes",
        athleteName: "Jalen Reyes",
        region: "Southern California",
        points: 986,
        movement: { direction: "hold", amount: 0, label: "Hold" },
        previousRank: 2,
        statusLabel: "Prototype record",
      },
      {
        rank: 3,
        athleteSlug: "elian-park",
        athleteName: "Elian Park",
        region: "Bay Area",
        points: 954,
        movement: { direction: "down", amount: 1, label: "Down 1" },
        previousRank: 2,
        statusLabel: "Prototype record",
      },
      {
        rank: 4,
        athleteSlug: "tessa-marin",
        athleteName: "Tessa Marín",
        region: "Southern California",
        points: 921,
        movement: { direction: "up", amount: 1, label: "Up 1" },
        previousRank: 5,
        statusLabel: "Prototype record",
      },
      {
        rank: 5,
        athleteSlug: "maya-calder",
        athleteName: "Maya Calder",
        region: "Northern California",
        points: 887,
        movement: { direction: "hold", amount: 0, label: "Hold" },
        previousRank: 5,
        statusLabel: "Prototype record",
      },
    ],
  },
  {
    slug: "emerging-athletes-california",
    title: "Emerging Athletes",
    subtitle: "California field",
    discipline: "Cross-discipline",
    division: "Emerging",
    region: "California",
    status: "Prototype standings",
    updatedLabel: "Sample update / July 2026",
    description:
      "A cross-discipline sample view of developing public profiles; the label does not represent an official age or eligibility class.",
    disclaimer: prototypeDisclaimer,
    entries: [
      {
        rank: 1,
        athleteSlug: "rowan-kim",
        athleteName: "Rowan Kim",
        region: "Southern California",
        points: 852,
        movement: { direction: "up", amount: 1, label: "Up 1" },
        previousRank: 2,
        statusLabel: "Prototype record",
      },
      {
        rank: 2,
        athleteSlug: "amara-west",
        athleteName: "Amara West",
        region: "Southern California",
        points: 829,
        movement: { direction: "new", amount: 0, label: "New" },
        statusLabel: "Prototype record",
      },
      {
        rank: 3,
        athleteSlug: "micah-vale",
        athleteName: "Micah Vale",
        region: "Central California",
        points: 808,
        movement: { direction: "hold", amount: 0, label: "Hold" },
        previousRank: 3,
        statusLabel: "Prototype record",
      },
      {
        rank: 4,
        athleteSlug: "tessa-marin",
        athleteName: "Tessa Marín",
        region: "Southern California",
        points: 791,
        movement: { direction: "down", amount: 1, label: "Down 1" },
        previousRank: 3,
        statusLabel: "Prototype record",
      },
    ],
  },
] as const satisfies readonly RankingCategory[];

const primaryCategoryByAthleteSlug = {
  "jalen-reyes": "open-freestyle-california",
  "elian-park": "open-freestyle-california",
  "tessa-marin": "open-freestyle-california",
  "maya-calder": "open-freestyle-california",
  "noa-bennett": "static-strength-california",
  "rowan-kim": "static-strength-california",
  "amara-west": "dynamic-freestyle-california",
  "micah-vale": "emerging-athletes-california",
} as const satisfies Readonly<Record<string, RankingCategorySlug>>;

export function getRankingCategoryBySlug(slug: string) {
  return rankingCategories.find((category) => category.slug === slug);
}

export function getRankingsForAthlete(
  athleteSlug: string,
): readonly AthleteRanking[] {
  const rankings: AthleteRanking[] = [];

  for (const category of rankingCategories) {
    const entry = category.entries.find(
      (candidate) => candidate.athleteSlug === athleteSlug,
    );

    if (entry) {
      rankings.push({ category, entry });
    }
  }

  return rankings;
}

export function getPrimaryRankingForAthlete(
  athleteSlug: string,
): AthleteRanking | undefined {
  const categorySlug =
    primaryCategoryByAthleteSlug[
      athleteSlug as keyof typeof primaryCategoryByAthleteSlug
    ];

  if (!categorySlug) {
    return undefined;
  }

  const category = getRankingCategoryBySlug(categorySlug);
  const entry = category?.entries.find(
    (candidate) => candidate.athleteSlug === athleteSlug,
  );

  return category && entry ? { category, entry } : undefined;
}
