import type { Metadata } from "next";
import Link from "next/link";

import {
  OperationsPage,
  OperationsPanel,
} from "@/components/operations/page-shell";
import { requireAuthenticatedUser } from "@/lib/auth";
import {
  markCommunityNotificationsReadAction,
  updateCommunityNotificationPreferencesAction,
} from "@/lib/community/actions/notifications";
import { getCommunityRepository } from "@/lib/community/runtime";
import { resolveCommunityTargets } from "@/lib/community/targets";
import type {
  CommunityNotification,
  ResolvedCommunityTarget,
} from "@/lib/community/types";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireAuthenticatedUser("/account/notifications");
  const repository = await getCommunityRepository();
  const member = repository.availability.writable
    ? await repository.getMemberProfileByPrincipalId(user.id)
    : null;
  const [notifications, preferences] = member
    ? await Promise.all([
        repository.listNotifications(member.id),
        repository.getNotificationPreferences(member.id),
      ])
    : [[], null];
  const resolvedTargets = await resolveCommunityTargets(
    notifications.flatMap((notification) =>
      notification.targetId &&
      (notification.targetType === "story" ||
        notification.targetType === "video" ||
        notification.targetType === "athlete" ||
        notification.targetType === "competition" ||
        notification.targetType === "team" ||
        notification.targetType === "organization")
        ? [{ type: notification.targetType, id: notification.targetId }]
        : [],
    ),
  );
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  return (
    <OperationsPage
      eyebrow="Account / Notifications"
      title="Community notifications"
      description="Replies, comments, reposts, and follows appear here. Cali Central does not claim to deliver email or push notifications."
      actions={
        unreadCount ? (
          <form action={markCommunityNotificationsReadAction}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center border border-white/20 px-4 font-mono text-xs font-bold uppercase tracking-[0.11em] text-ink hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Mark all read
            </button>
          </form>
        ) : undefined
      }
    >
      {member && preferences ? (
        <OperationsPanel
          title="Notification preferences"
          description="Choose which private in-app notifications appear. Email delivery is not configured."
        >
          <form action={updateCommunityNotificationPreferencesAction} className="grid gap-4 sm:grid-cols-3">
            <PreferenceCheckbox name="social" label="Social activity" defaultChecked={preferences.social} />
            <PreferenceCheckbox name="competitions" label="Competition updates" defaultChecked={preferences.competitions} />
            <PreferenceCheckbox name="claimsAndSubmissions" label="Claims and submissions" defaultChecked={preferences.claimsAndSubmissions} />
            <button type="submit" className="sm:col-span-3 inline-flex min-h-11 w-fit items-center border border-accent px-4 font-mono text-xs font-bold uppercase tracking-[0.11em] text-accent hover:bg-accent hover:text-canvas">
              Save preferences
            </button>
          </form>
        </OperationsPanel>
      ) : null}
      <OperationsPanel
        title={`${unreadCount} unread`}
        description="Notifications are private to your authenticated account and never affect sporting rankings or verification."
      >
        {!repository.availability.writable ? (
          <NotificationState text="Community persistence is unavailable, so notifications cannot be loaded." />
        ) : !member ? (
          <NotificationState
            text="Create an active public member profile to receive community notifications."
            href="/account/profile#public-member-profile"
            linkLabel="Open profile settings"
          />
        ) : notifications.length ? (
          <ol className="divide-y divide-white/10 border-y border-white/10">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`py-5 ${notification.readAt ? "opacity-70" : ""}`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm leading-6 text-ink">
                      {notificationText(notification)}
                    </p>
                    <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-muted">
                      {formatNotificationDate(notification.createdAt)} ·{" "}
                      {notification.readAt ? "Read" : "Unread"}
                    </p>
                    {notificationHref(notification, resolvedTargets) ? (
                      <Link
                        href={notificationHref(notification, resolvedTargets)!}
                        className="mt-3 inline-flex min-h-10 items-center text-xs font-bold uppercase tracking-[0.1em] text-accent underline decoration-accent/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        Open activity
                      </Link>
                    ) : null}
                  </div>
                  {!notification.readAt ? (
                    <form action={markCommunityNotificationsReadAction}>
                      <input
                        type="hidden"
                        name="notificationId"
                        value={notification.id}
                      />
                      <button
                        type="submit"
                        className="inline-flex min-h-10 items-center border border-white/15 px-3 font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        Mark read
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <NotificationState text="No community notifications yet." />
        )}
      </OperationsPanel>
    </OperationsPage>
  );
}

function notificationText(notification: CommunityNotification): string {
  const actor = notification.actor?.displayName ?? "A community member";
  switch (notification.notificationType) {
    case "follow":
      return `${actor} followed your member profile.`;
    case "like":
      return `${actor} liked your community post.`;
    case "comment":
      return `${actor} commented on your community post.`;
    case "reply":
      return `${actor} replied to your comment.`;
    case "repost":
      return `${actor} reposted your community post.`;
    case "athlete-claim":
      return "Your athlete claim has an update.";
    case "submission":
      return "Your submission has an update.";
    case "competition-update":
      return "A competition you follow has an update.";
    case "athlete-update":
      return "An athlete you follow has a published update.";
    case "team-update":
      return "A team you follow has a published update.";
    case "team-invite":
      return "You received a team invitation.";
  }
}

function PreferenceCheckbox({
  name,
  label,
  defaultChecked,
}: {
  readonly name: string;
  readonly label: string;
  readonly defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-3 border border-white/12 p-4 text-sm text-ink">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-5 accent-[var(--color-accent)]" />
      {label}
    </label>
  );
}

function notificationHref(
  notification: CommunityNotification,
  targets: ReadonlyMap<string, ResolvedCommunityTarget>,
): string | undefined {
  if (notification.notificationType === "follow" && notification.actor) {
    return `/members/${notification.actor.handle}`;
  }
  if (!notification.targetId || !notification.targetType) return undefined;
  if (notification.targetType === "post")
    return `/community/posts/${notification.targetId}`;
  if (notification.targetType === "submission")
    return `/account/submissions/${notification.targetId}`;
  if (["story", "video", "athlete", "competition", "team", "organization"].includes(notification.targetType)) {
    return targets.get(`${notification.targetType}:${notification.targetId}`)
      ?.href;
  }
  return undefined;
}

function formatNotificationDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function NotificationState({
  text,
  href,
  linkLabel,
}: {
  readonly text: string;
  readonly href?: string;
  readonly linkLabel?: string;
}) {
  return (
    <div className="border border-dashed border-white/20 p-6 text-sm leading-6 text-muted">
      <p>{text}</p>
      {href && linkLabel ? (
        <Link
          href={href}
          className="mt-3 inline-flex min-h-10 items-center font-bold text-accent underline underline-offset-4"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
