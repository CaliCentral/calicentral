# Community media operations policy (pre-production draft)

This is an operational baseline, not legal advice or a promise to users. The
owner and qualified legal/privacy reviewers must approve retention periods,
notice text, jurisdiction-specific obligations, and escalation contacts before
community uploads are enabled.

## Intake and rights

- Upload UI must require the member to attest that they own the file or have
  permission to submit it and that publication will not violate another
  person's privacy or publicity rights.
- Prohibit illegal content, exploitation, threats, non-consensual intimate
  imagery, doxxing, impersonation, malware, rights-infringing material, and
  content that violates the community guidelines.
- Keep uploads private and pending until automated file checks and the required
  human moderation decision complete. Submission is not publication.

## Current upload-size boundary

- The P4.6 application upload path uses a Next.js Server Action with an explicit
  1 MiB raw-request ceiling. Accepted files are capped at 900 KiB so the
  multipart envelope remains below that boundary.
- The same temporary 900 KiB cap applies to supported images and videos. The UI,
  action validation, and file-signature validation share this contract; the
  application does not advertise the earlier unsupported 10 MB / 100 MB limits.
- Avatar, cover, and post-image purposes accept only image MIME types;
  `post-video` accepts only video MIME types. Skill proof may use either allowed
  image or video media, but remains subject to ownership and moderation checks.
- Restoring larger limits requires a separately reviewed authenticated streaming
  or direct-to-R2 protocol. A Next Route Handler alone is insufficient with the
  current OpenNext adapter because that adapter buffers request bodies before
  application routing.

## Moderation and access

- Serve only assets whose D1 metadata is `uploaded`, `approved`, `public`, and
  not deleted. R2 remains private; delivery runs through the server boundary.
- Record approve, reject, and remove decisions in the application audit trail.
  Rejected or removed files fail closed and are not restored through a public
  URL merely because their bytes still exist during a retention window.
- Owners may remove only media associated with their server-resolved member
  record. Active editors and administrators may remove media through the
  separately authorized moderation action. Both paths atomically mark D1
  metadata `removed` and `private` and append a `mediaRemoved` audit event;
  neither accepts a client-supplied owner or moderator role.
- Removed media returns not found to every viewer, including its former owner
  and moderators, before the application attempts an R2 read. Guarded media
  responses use `no-store` so a previously public response cannot remain
  cacheable after a removal decision.
- Reports enter the moderation queue. Safety threats receive immediate access
  restriction and escalation; ordinary disputes preserve evidence while the
  review is open.

## Copyright and deletion

- Publish a monitored copyright contact and collect the work, disputed URL,
  claimant authority, contact information, good-faith statement, and signature.
- Restrict access promptly when a credible complaint requires review; notify
  the uploader and support a documented counter-notice process only after legal
  review defines it.
- A user deletion request first revokes public delivery and marks metadata
  deleted. Physical R2 deletion, backup expiry, legal hold, and audit retention
  follow owner-approved schedules; operators must not promise immediate purge
  from every recovery copy.
- Application removal is therefore a D1 soft-removal and never issues an R2
  delete. Staging QA cleanup is a separate operator action: delete only each
  recorded synthetic preview object key after lifecycle evidence is captured.
  Never empty a bucket or use a broad prefix deletion for that cleanup, and
  never target the production bucket.

## Retention and incidents

- Define separate reviewed periods for pending, rejected, removed, deleted,
  reported, and approved media. Minimize original files and metadata once the
  operational/legal purpose ends.
- On suspected unauthorized exposure, disable media uploads and delivery,
  preserve relevant logs and audit records, identify affected objects and
  members, rotate any compromised credential, and follow the incident and
  notification runbook. Never delete evidence ad hoc.
