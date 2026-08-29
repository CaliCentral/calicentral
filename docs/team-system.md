# Team system

Teams are canonical Sanity records, separate from private applications and
transactional membership state. Public routes are `/teams` and
`/teams/[slug]`; the protected intake workspace is `/account/teams`.

## Public records

The `team` document stores identity, global location, type, public status,
league-admission status, disciplines, approved public description, safe public
links, branding, and a reference to a versioned `teamSeason`. Public roster
queries select only active memberships with accepted consent and public
athlete references. They never select application email, phone, invitations,
eligibility documents, or review notes.

Statuses remain distinct:

- private application;
- approved prospective team;
- candidate franchise;
- official franchise;
- active season franchise;
- inactive/archived public record.

“Approved for editorial development” creates none of these public states.
Prospective records display the required disclaimer and are hidden unless
`PUBLIC_PROSPECTIVE_TEAMS_ENABLED=true`.

## Application workflow

`teamApplication` extends the existing submission discriminated union,
validation, Sanity document, contributor actions, editor queue, assignment,
feedback, approval/rejection/archive transitions, and server-authored audit
history. The form collects structured identity, worldwide location, branding,
crest/wordmark reference URLs, competition intent, and up to eight private
proposed roster entries. Branding colors require six-digit hex values,
team-mark rendering enforces at least 4.5:1 text contrast, and submission for
review requires an authority acknowledgement.

Team applications fail closed unless `TEAM_APPLICATIONS_ENABLED=true`.
Individual accounts retain control; no shared team password exists. Private D1
team invitations/memberships are schema foundations only until a database is
bound. A proposed roster entry never becomes a public membership without
consent and review.
