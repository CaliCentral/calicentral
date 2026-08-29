import Link from "next/link";

export type MemberProfileTab = "posts" | "media" | "reposts";

export function MemberProfileTabs({
  handle,
  active,
}: {
  readonly handle: string;
  readonly active: MemberProfileTab;
}) {
  const tabs: readonly [MemberProfileTab, string][] = [
    ["posts", "Posts"],
    ["media", "Media"],
    ["reposts", "Reposts"],
  ];
  return (
    <nav aria-label="Member activity" className="border-b border-white/15">
      <ul className="flex flex-wrap gap-1">
        {tabs.map(([value, label]) => (
          <li key={value}>
            <Link
              href={`/members/${handle}${value === "posts" ? "" : `?tab=${value}`}`}
              aria-current={active === value ? "page" : undefined}
              className={`inline-flex min-h-12 items-center border-b-2 px-4 font-mono text-xs font-bold uppercase tracking-[0.12em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                active === value
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
