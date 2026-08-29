import { studioUrl } from "@/lib/site/studio";

export type NavigationDestination = {
  readonly label: string;
  readonly href: string;
  readonly description?: string;
};

export const primaryNavigationItems = [
  { label: "Community", href: "/community" },
  { label: "Athletes", href: "/athletes" },
  { label: "Competitions", href: "/competitions" },
  { label: "Rankings", href: "/rankings" },
] as const satisfies readonly NavigationDestination[];

export const moreNavigationItems = [
  {
    label: "Stories",
    href: "/stories",
    description: "Reporting, interviews, analysis, and culture.",
  },
  {
    label: "Videos",
    href: "/videos",
    description: "Curated motion, field reports, and athlete films.",
  },
  {
    label: "Teams",
    href: "/teams",
    description: "Public team files and competition relationships.",
  },
  {
    label: "Shop / Gear",
    href: "/shop",
    description: "Cali Central products and clearly marked partner links.",
  },
  {
    label: "WCL",
    href: "/wcl",
    description: "World Calisthenics League records and rules.",
  },
  {
    label: "Submit",
    href: "/account/submissions/new",
    description: "Send structured material to the editorial desk.",
  },
  {
    label: "Help & Contact",
    href: "/help",
    description: "Get help, report an issue, or contact Cali Central.",
  },
  {
    label: "About",
    href: "/about",
    description: "Mission, editorial independence, and platform scope.",
  },
] as const satisfies readonly NavigationDestination[];

export const memberCreateItems = [
  {
    label: "Create community post",
    href: "/community",
    description: "Share a public update from your member identity.",
  },
] as const satisfies readonly NavigationDestination[];

export const contributorCreateItems = [
  {
    label: "Submit video / photo",
    href: "/account/submissions/new?type=mediaPitch",
    description: "Send visual media for editorial review.",
  },
  {
    label: "Submit competition",
    href: "/account/submissions/new?type=competitionListing",
    description: "Propose an event record with public sources.",
  },
  {
    label: "Apply / manage team",
    href: "/account/teams",
    description: "Open the private team workspace.",
  },
  {
    label: "Pitch story",
    href: "/account/submissions/new?type=storyPitch",
    description: "Pitch reporting, an interview, or analysis.",
  },
] as const satisfies readonly NavigationDestination[];

export const baseProfileItems = [
  {
    label: "Account overview",
    href: "/account",
    description: "Your private Cali Central workspace.",
  },
  {
    label: "Profile",
    href: "/account/profile",
    description: "Manage private details and your public member profile.",
  },
  {
    label: "Notifications",
    href: "/account/notifications",
    description: "Review account and community updates.",
  },
  {
    label: "Saved",
    href: "/account/saved",
    description: "Private bookmarks across Cali Central.",
  },
  {
    label: "Collections",
    href: "/account/collections",
    description: "Organize saved records into private collections.",
  },
] as const satisfies readonly NavigationDestination[];

export const contributorProfileItems = [
  {
    label: "Submissions",
    href: "/account/submissions",
    description: "Drafts, reviews, revisions, and decisions.",
  },
  {
    label: "Team workspace",
    href: "/account/teams",
    description: "Team applications and management boundaries.",
  },
] as const satisfies readonly NavigationDestination[];

export const editorialProfileItems = [
  {
    label: "Editorial desk",
    href: "/admin",
    description: "Protected review and moderation tools.",
  },
  {
    label: "Sanity Studio",
    href: studioUrl,
    description: "Authorized canonical editorial publishing.",
  },
] as const satisfies readonly NavigationDestination[];
