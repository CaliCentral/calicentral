import { getCurrentUser } from "@/lib/auth";
import { getCommunityMediaRepository } from "@/lib/community/media-runtime";
import { getCommunityRepository } from "@/lib/community/runtime";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const [user, media, community] = await Promise.all([getCurrentUser(), getCommunityMediaRepository(), getCommunityRepository()]);
  const member = user && community.availability.writable ? await community.getMemberProfileByPrincipalId(user.id) : null;
  const result = await media.objectForViewer(
    id,
    member?.id,
    user?.accessStatus === "active" && (user.role === "editor" || user.role === "admin"),
  );
  if (!result) return new Response("Not found", { status: 404 });
  return new Response(result.object.body, {
    headers: {
      "Content-Type": result.asset.mimeType,
      "Content-Length": String(result.asset.byteSize),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
