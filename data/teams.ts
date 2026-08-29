import type { Team } from "@/types/team";

/** Fictional development records. No record represents a real organization. */
export const teams = [
  {
    canonicalId: "prototype-team-northstar-bar-collective",
    slug: "northstar-bar-collective",
    name: "Northstar Bar Collective",
    shortName: "Northstar",
    code: "NBC",
    teamType: "crew",
    publicStatus: "active",
    leagueAdmissionStatus: "not-applicable",
    country: "CA",
    administrativeArea: "Ontario",
    city: "Toronto",
    trainingBase: "Northstar Yard (fictional)",
    foundingYear: 2024,
    description:
      "A fictional Toronto training crew used to demonstrate the global Cali Central team directory. It is not a real club or WCL franchise.",
    disciplines: ["Strength", "Freestyle", "Endurance"],
    branding: {
      primaryColor: "#141A22",
      secondaryColor: "#F2F0E9",
      accentColor: "#D62E2E",
      approvalStatus: "not-reviewed",
    },
    socialLinks: [],
    roster: [],
    featured: true,
    seasonLabel: "Fictional 2027 file",
    prototypeStatus: "fictional-prototype",
  },
  {
    canonicalId: "prototype-team-redwood-motion-crew",
    slug: "redwood-motion-crew",
    name: "Redwood Motion Crew",
    shortName: "Redwood Motion",
    code: "RMC",
    teamType: "prospective-wcl-team",
    publicStatus: "approved-prospective",
    leagueAdmissionStatus: "prospective",
    country: "AU",
    administrativeArea: "Victoria",
    city: "Melbourne",
    trainingBase: "Redwood Movement Hall (fictional)",
    foundingYear: 2025,
    description:
      "A fictional prospective-team record for testing status disclosures and international team filters. It has no league admission or guaranteed competition slot.",
    disciplines: ["Control", "Freestyle", "Strength", "Endurance"],
    branding: {
      primaryColor: "#262019",
      secondaryColor: "#F4EDE2",
      accentColor: "#B33A2F",
      approvalStatus: "not-reviewed",
    },
    socialLinks: [],
    roster: [],
    featured: false,
    seasonLabel: "Fictional 2027 file",
    prototypeStatus: "fictional-prototype",
  },
] as const satisfies readonly Team[];

