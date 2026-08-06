import type {
  AthleteCompetitionCategory,
  AthleteDiscipline,
  AthleteSpecialty,
} from "../types/athlete";

export const athleteCompetitionCategories = [
  { value: "freestyle", label: "Freestyle" },
  { value: "power-strength", label: "Power / Strength" },
  { value: "endurance", label: "Endurance" },
  { value: "skills-static", label: "Skills / Static" },
  { value: "hybrid-all-around", label: "Hybrid / All-around" },
] as const satisfies readonly {
  readonly value: AthleteCompetitionCategory;
  readonly label: string;
}[];

export const athleteCompetitionCategoryValues = athleteCompetitionCategories.map(
  ({ value }) => value,
) as unknown as readonly [
  AthleteCompetitionCategory,
  ...AthleteCompetitionCategory[],
];

export const athleteSpecialties = [
  { value: "dynamic-freestyle", label: "Dynamic freestyle" },
  { value: "static-combinations", label: "Static combinations" },
  { value: "hand-balancing", label: "Hand balancing" },
  { value: "weighted-calisthenics", label: "Weighted calisthenics" },
  { value: "pull-strength", label: "Pull strength" },
  { value: "dip-strength", label: "Dip strength" },
  { value: "muscle-ups", label: "Muscle-ups" },
  { value: "endurance", label: "Endurance" },
  { value: "statics", label: "Statics" },
  { value: "team-competition", label: "Team competition" },
  { value: "coaching", label: "Coaching" },
  { value: "content-creation", label: "Content creation" },
] as const satisfies readonly {
  readonly value: AthleteSpecialty;
  readonly label: string;
}[];

export const athleteSpecialtyValues = athleteSpecialties.map(
  ({ value }) => value,
) as unknown as readonly [AthleteSpecialty, ...AthleteSpecialty[]];

export function athleteCategoryLabel(
  category: AthleteCompetitionCategory,
): string {
  return (
    athleteCompetitionCategories.find((option) => option.value === category)
      ?.label ?? category
  );
}

export function athleteSpecialtyLabel(specialty: AthleteSpecialty): string {
  return (
    athleteSpecialties.find((option) => option.value === specialty)?.label ??
    specialty
  );
}

export function categoryFromLegacyDiscipline(
  discipline: AthleteDiscipline,
): AthleteCompetitionCategory {
  switch (discipline) {
    case "Dynamic freestyle":
    case "Freestyle":
      return "freestyle";
    case "Strength":
      return "power-strength";
    case "Endurance":
      return "endurance";
    case "Hand balancing":
    case "Static strength":
      return "skills-static";
  }
}

export function specialtiesFromLegacyDisciplines(
  disciplines: readonly AthleteDiscipline[],
): AthleteSpecialty[] {
  return [
    ...(disciplines.includes("Dynamic freestyle")
      ? (["dynamic-freestyle"] as const)
      : []),
    ...(disciplines.includes("Static strength")
      ? (["statics"] as const)
      : []),
    ...(disciplines.includes("Hand balancing")
      ? (["hand-balancing"] as const)
      : []),
    ...(disciplines.includes("Endurance")
      ? (["endurance"] as const)
      : []),
  ];
}
