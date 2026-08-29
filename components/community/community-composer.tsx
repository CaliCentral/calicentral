import { ActionForm } from "@/components/operations/action-form";
import { createCommunityPostAction } from "@/lib/community/actions/posts";

export function CommunityComposer({
  returnTo = "/community",
}: {
  readonly returnTo?: string;
}) {
  return (
    <section
      aria-labelledby="community-composer-heading"
      className="border border-white/15 bg-surface p-5 sm:p-7"
    >
      <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-accent">
        Member signal / Public post
      </p>
      <h2
        id="community-composer-heading"
        className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.035em] text-ink"
      >
        Share from the movement
      </h2>
      <ActionForm
        action={createCommunityPostAction}
        submitLabel="Publish post"
        pendingLabel="Publishing…"
        onSuccess="redirect"
      >
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/55">
              Post type
            </span>
            <select name="postType" defaultValue="general" className="mt-2 min-h-12 w-full border border-white/15 bg-canvas px-3 text-sm text-ink focus:border-accent focus:outline-none">
              <option value="general">General</option>
              <option value="training">Training</option>
              <option value="pr">Personal record</option>
              <option value="skill">Skill</option>
              <option value="competition">Competition</option>
              <option value="photo">Photo</option>
              <option value="video">Video</option>
            </select>
          </label>
          <label className="block">
            <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/55">
              Audience
            </span>
            <select name="visibility" defaultValue="public" className="mt-2 min-h-12 w-full border border-white/15 bg-canvas px-3 text-sm text-ink focus:border-accent focus:outline-none">
              <option value="public">Public</option>
              <option value="followers">Followers</option>
              <option value="private">Only me</option>
            </select>
          </label>
        </div>
        <label className="mt-5 block">
          <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/55">
            Post
          </span>
          <textarea
            name="body"
            maxLength={4000}
            rows={5}
            placeholder="Share a training session, competition moment, creator note, or calisthenics story."
            className="mt-2 w-full resize-y border border-white/15 bg-canvas p-4 text-base leading-7 text-ink placeholder:text-white/35 focus:border-accent focus:outline-none"
          />
          <span className="mt-2 block text-xs leading-5 text-muted">
            Plain text only · 4,000 characters maximum
          </span>
        </label>

        <details className="mt-5 border-t border-white/10 pt-4">
          <summary className="cursor-pointer font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            Add media or a Cali Central reference
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white/55">
                Media type
              </span>
              <select
                name="externalMediaKind"
                defaultValue="external-embed"
                className="mt-2 min-h-12 w-full border border-white/15 bg-canvas px-3 text-sm text-ink focus:border-accent focus:outline-none"
              >
                <option value="external-embed">External link</option>
                <option value="image">Photo</option>
                <option value="video">Video</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white/55">Approved upload ID</span>
              <input name="mediaAssetId" maxLength={200} placeholder="Upload under Account / Media, then paste its approved ID" className="mt-2 min-h-12 w-full border border-white/15 bg-canvas px-3 text-sm text-ink placeholder:text-white/35 focus:border-accent focus:outline-none" />
              <span className="mt-2 block text-xs leading-5 text-muted">Only your approved Post image or Post video asset is accepted. Use this or an external URL, not both.</span>
            </label>
            <label className="block sm:col-span-2">
              <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white/55">
                External media URL
              </span>
              <input
                type="url"
                name="externalMediaUrl"
                maxLength={2000}
                placeholder="https://…"
                className="mt-2 min-h-12 w-full border border-white/15 bg-canvas px-3 text-sm text-ink placeholder:text-white/35 focus:border-accent focus:outline-none"
              />
              <span className="mt-2 block text-xs leading-5 text-muted">
                Cali Central stores the link only. It does not fetch or copy the
                remote page.
              </span>
            </label>
            <label className="block sm:col-span-2">
              <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white/55">
                Photo alt text
              </span>
              <input
                name="externalMediaAltText"
                maxLength={300}
                placeholder="Describe the visible action for screen-reader users"
                className="mt-2 min-h-12 w-full border border-white/15 bg-canvas px-3 text-sm text-ink placeholder:text-white/35 focus:border-accent focus:outline-none"
              />
              <span className="mt-2 block text-xs leading-5 text-muted">
                Required when the media type is Photo.
              </span>
            </label>
            <label className="block sm:col-span-2">
              <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white/55">
                Creator / credit
              </span>
              <input
                name="externalMediaCredit"
                maxLength={120}
                className="mt-2 min-h-12 w-full border border-white/15 bg-canvas px-3 text-sm text-ink focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex items-start gap-3 sm:col-span-2">
              <input
                type="checkbox"
                name="rightsConfirmed"
                className="mt-1 size-5 accent-[var(--color-accent)]"
              />
              <span className="text-sm leading-6 text-muted">
                I have permission to share or link this media and have supplied
                an accurate credit where needed.
              </span>
            </label>
            <label className="block">
              <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white/55">
                Record type
              </span>
              <select
                name="canonicalTargetType"
                defaultValue=""
                className="mt-2 min-h-12 w-full border border-white/15 bg-canvas px-3 text-sm text-ink focus:border-accent focus:outline-none"
              >
                <option value="">No reference</option>
                <option value="story">Story</option>
                <option value="video">Video</option>
                <option value="athlete">Athlete</option>
                <option value="team">Team</option>
                <option value="competition">Competition</option>
                <option value="organization">Organization</option>
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white/55">
                Stable ID or slug
              </span>
              <input
                name="canonicalTargetId"
                maxLength={200}
                placeholder="record-slug"
                className="mt-2 min-h-12 w-full border border-white/15 bg-canvas px-3 text-sm text-ink placeholder:text-white/35 focus:border-accent focus:outline-none"
              />
            </label>
          </div>
        </details>
      </ActionForm>
    </section>
  );
}
