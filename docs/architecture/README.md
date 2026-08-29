# Architecture Documentation

The current application runtime is a full-stack Next.js App Router Worker. The
accepted target is native Vercel plus Supabase, with R2 retained for media. See
[ADR 0003](../decisions/0003-use-vercel-supabase-and-r2.md) and the
[local migration workflow](../supabase-migration.md). ADR 0002 remains the
rollback/runtime record until equivalence and cutover gates pass.

Architecture subjects:

- Next.js application structure
- Cloudflare Workers/OpenNext deployment
- Sanity CMS integration
- Authentication and authorization
- Affiliate-link tracking
- Competition directory
- Athlete profiles and rankings
- Admin and moderation systems

Sanity currently owns editorial, canonical sporting, and existing operational
records. Environment-isolated D1, private R2, and four rate-limit bindings
support the feature-gated community layer. Production community/media flags
remain off. Supabase equivalents must pass the documented gates before these
legacy application-runtime paths are removed; the R2 object store remains.
