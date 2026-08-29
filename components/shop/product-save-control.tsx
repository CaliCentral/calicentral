import Link from "next/link";

import { SaveDialog } from "@/components/community/save-dialog";
import { getCurrentUser } from "@/lib/auth";
import { getCommunityRepository } from "@/lib/community/runtime";

const controlClass =
  "inline-flex min-h-11 items-center justify-center border border-white/20 px-4 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export async function ProductSaveControl({
  productId,
  returnTo,
}: {
  readonly productId: string;
  readonly returnTo: string;
}) {
  const repository = await getCommunityRepository();
  if (!repository.availability.writable) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex min-h-11 items-center justify-center border border-white/10 px-4 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] text-white/40"
      >
        Save unavailable
      </span>
    );
  }

  const data = await (async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return { viewer: "logged-out" as const };
      }

      const member = await repository.getMemberProfileByPrincipalId(user.id);
      if (!member) {
        return { viewer: "profile-required" as const };
      }

      const canSave =
        !["suspended", "archived"].includes(user.accessStatus) &&
        member.status === "active" &&
        member.profilePublic;
      if (!canSave) {
        return { viewer: "restricted" as const };
      }

      const [state, collections] = await Promise.all([
        repository.getSaveState(member.id, "product", productId),
        repository.listCollections(member.id),
      ]);
      return { viewer: "member" as const, state, collections };
    } catch {
      return null;
    }
  })();

  if (!data) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex min-h-11 items-center justify-center border border-white/10 px-4 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] text-white/40"
      >
        Save unavailable
      </span>
    );
  }

  if (data.viewer === "logged-out") {
    return (
      <Link
        href={`/sign-in?callbackUrl=${encodeURIComponent(returnTo)}`}
        className={controlClass}
      >
        Sign in to save
      </Link>
    );
  }

  if (data.viewer === "profile-required") {
    return (
      <Link
        href="/account/profile#public-member-profile"
        className={controlClass}
      >
        Create profile to save
      </Link>
    );
  }

  if (data.viewer === "restricted") {
    return (
      <span
        aria-disabled="true"
        className="inline-flex min-h-11 items-center justify-center border border-white/10 px-4 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] text-white/40"
      >
        Save restricted
      </span>
    );
  }

  return (
    <SaveDialog
      targetType="product"
      targetId={productId}
      saved={data.state.saved}
      collections={data.collections}
      collectionIds={data.state.collectionIds}
      returnTo={returnTo}
    />
  );
}
