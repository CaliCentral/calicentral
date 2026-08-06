# Media architecture

Cali Central exposes two complementary public media views backed by the same
Sanity `video` documents:

- `/videos` is the mobile-friendly discovery feed.
- `/videos/archive` is the structured, searchable archive.
- `/videos/[slug]` is the canonical editorial record.

No third-party embed is loaded automatically. A static poster is rendered
first, and an original-post link is shown only when an editor has stored a
valid HTTP(S) URL.

## Attribution and ownership

Editors choose one ownership state for every media record:

- `cali-central-original`
- `third-party-attributed`
- `source-unavailable`

Third-party records retain the source platform, account, and original post
URL. Editorial context does not transfer ownership to Cali Central. Submitted
media links continue through the existing moderated submission workflow before
an editor associates or publishes a public media record.

## Platform metrics

`platformMetrics` stores one source platform, metric label, numeric value,
observation time, and optional source URL per entry. The public UI presents
entries individually, for example “views on YouTube.” It never sums values
from different services. When an external API or reviewed value is absent, the
UI displays an unavailable state rather than estimating a count.

## Owner workflow

In Sanity Studio, open a Video and use **Source and attribution** to:

1. select the ownership status;
2. identify the source platform and account;
3. add the original public post for third-party media;
4. add optional feed context;
5. record only reviewed, platform-specific metrics with observation dates.

Playback hosting, automated social ingestion, and external platform API access
are not configured by this repository. They require separate owner-approved
credentials and policy review.
