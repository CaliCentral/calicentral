# Community system

Community data is separate from Sanity editorial and sporting truth. Sanity
continues to own stories, athlete files, teams, competitions, videos, rankings,
and verified records. D1 stores member profiles and high-volume interaction
state while referring to canonical content by stable type and ID.

## Visible experience

When `COMMUNITY_FEATURES_ENABLED=true` and a `COMMUNITY_DB` D1 binding is
available, the application exposes:

- `/community` with bounded Discover, Following, Latest, and Editorial feeds; All, Posts,
  Videos, Photos, and Stories filters; a plain-text composer; external-media
  references; and deliberate empty/error states;
- `/community/posts/[id]` with a shareable post record and paginated comments;
- `/members/[handle]` with safe public profile, follower counts, approved
  athlete linkage, and Posts, Media, and Reposts tabs;
- private `/account/saved`, `/account/collections`, and
  `/account/collections/[id]` library routes;
- private `/account/following` and `/account/notifications` routes, including
  in-app notification preferences;
- explicit public-member editing inside `/account/profile`;
- post/story/video likes, shallow comments/replies, reposts, browser share,
  saves, and collection assignment;
- athlete/team/competition save, follow, and share controls plus organization
  follows; and
- a role-protected `/admin/community` report queue with audited hide/restore
  and report disposition repository methods.

The initial feed is limited to 25 activities. Member activity is limited to 20
per page. Comment pages load at most 10 roots and 20 visible replies per root.
For You uses a deterministic recent-content mix rather than engagement
scoring. The Following feed selects posts by followed members and activity
that directly references followed athletes, teams, or competitions; it does
not use recommendations or popularity scoring.

## Runtime and disabled behavior

Production and staging D1, R2, and distributed rate-limit bindings are
declared in `wrangler.jsonc` with separate resources and namespaces. Both
production community flags remain `false`; staging enables them only for the
approved synthetic QA lifecycle. `lib/community/runtime.ts` obtains the
request-bound Cloudflare environment and injects `env.COMMUNITY_DB` only when
it has the D1 shape expected by `CommunityRepository`.

With the feature flag off, community navigation and interaction controls are
hidden and `/community` renders an explicit disabled state. With the flag on
but D1 missing, community routes say persistence is unavailable; existing
editorial routes continue without social controls. Writes never fall back to
memory or report success without persistence.

Staging direct media upload uses the private preview R2 binding and keeps each
object pending/private until moderation. The current buffered Server Action
path accepts only allowlisted, signature-verified image/video files up to 900
KiB; larger limits are deferred until a reviewed streaming/direct R2 protocol
exists. Members may also store a validated public HTTP(S) media reference plus
credit and rights acknowledgement. Supported YouTube links render a
browser-loaded poster linked to the canonical video; no remote page is
server-fetched and no arbitrary iframe is accepted. Other external references
remain outbound link cards.

An authenticated owner may soft-remove only an upload owned by the member
record resolved from that owner's server session. Active editors and
administrators have a separate moderation removal path. Removal atomically
sets the D1 asset to `removed` and `private`, appends an immutable audit event,
and makes guarded delivery return not found before any R2 read. Application
removal does not physically delete R2 bytes; exact synthetic preview-object
cleanup and any future retention purge remain separate reviewed operations.

## Identity, authorization, and privacy

Auth.js owns the private stable principal. D1 assigns a separate member ID and
case-insensitively unique handle. Every mutation derives the principal from the
server session, resolves the D1 member, checks account/member state, validates
the target, and uses prepared statements. Client-supplied member IDs, roles,
ownership, and moderator flags are not accepted.

Creating a public member profile is opt-in. Contributor biography, email,
OAuth identifiers, access lists, submissions, claim evidence, moderation data,
and team-application intake are never copied into or queried by the public
projection. Location, social links, media, and discoverability each have an
explicit visibility choice. Likes, saves, and collections are private. Public,
followers-only, and private post audiences are enforced in repository queries.
Blocks are mutual visibility barriers; mutes remove the muted member from the
viewer's feed and notifications without changing the muted member's access.

Post and comment bodies are bounded plain text and render through React; the
community UI contains no `dangerouslySetInnerHTML`. External URLs allow public
HTTP(S) destinations without credentials and reject local/private/metadata
hosts. Direct messages, email or push notifications, arbitrary embeds, social scraping,
hashtags, and mentions are not implemented.

`lib/community/rate-limit.ts` routes posts, comments, likes, saves, reposts,
follows, profiles, collections, notifications, reports, and uploads to the
configured distributed bindings. No process-memory limiter is presented as
production protection; production activation still requires separate review.
