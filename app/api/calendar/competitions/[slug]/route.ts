import { getCompetitionPage } from "@/lib/content";
import { isPublicSlug } from "@/lib/content/public-slug";
import { absoluteSiteUrl } from "@/lib/site/config";

function escapeIcs(value: string): string { return value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;"); }
function compactDate(value: string): string { return value.slice(0, 10).replaceAll("-", ""); }
function nextDate(value: string): string { const date = new Date(`${value.slice(0, 10)}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + 1); return date.toISOString().slice(0, 10).replaceAll("-", ""); }

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!isPublicSlug(slug)) return new Response("Not found", { status: 404 });
  const page = await getCompetitionPage(slug, { stega: false });
  if (!page || !isPublicSlug(page.competition.slug)) return new Response("Not found", { status: 404 });
  const competition = page.competition;
  const location = [competition.venueName, competition.city, competition.administrativeArea ?? competition.state, competition.country].filter(Boolean).join(", ");
  const start = compactDate(competition.startDate);
  const end = nextDate(competition.endDate ?? competition.startDate);
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cali Central//Competition Calendar//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:${escapeIcs(competition.canonicalId)}@calicentral.com`, `DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`, `SUMMARY:${escapeIcs(competition.name)}`, `DESCRIPTION:${escapeIcs(competition.summary)}`, `LOCATION:${escapeIcs(location)}`, `URL:${absoluteSiteUrl(`/competitions/${competition.slug}`)}`, "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
  return new Response(body, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${competition.slug}.ics"`, "Cache-Control": "public, max-age=900" } });
}
