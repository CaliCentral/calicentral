import {
  accessStatusLabel,
  priorityLabel,
  roleLabel,
  submissionStatusLabel,
} from "@/lib/presentation/operations";

type StatusLabelProps = {
  readonly kind: "submission" | "access" | "role" | "priority";
  readonly value: string;
  readonly className?: string;
};

const toneByValue: Record<string, string> = {
  approved: "border-sky-300/40 bg-sky-300/10 text-sky-100",
  active: "border-sky-300/40 bg-sky-300/10 text-sky-100",
  inReview: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  submitted: "border-violet-300/40 bg-violet-300/10 text-violet-100",
  revisionRequested:
    "border-orange-300/40 bg-orange-300/10 text-orange-100",
  rejected: "border-rose-300/40 bg-rose-300/10 text-rose-100",
  suspended: "border-rose-300/40 bg-rose-300/10 text-rose-100",
  urgent: "border-rose-300/40 bg-rose-300/10 text-rose-100",
  elevated: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  admin: "border-accent/50 bg-accent/10 text-accent",
  editor: "border-violet-300/40 bg-violet-300/10 text-violet-100",
};

export function StatusLabel({
  kind,
  value,
  className = "",
}: StatusLabelProps) {
  const label =
    kind === "submission"
      ? submissionStatusLabel(value)
      : kind === "access"
        ? accessStatusLabel(value)
        : kind === "role"
          ? roleLabel(value)
          : priorityLabel(value);

  return (
    <span
      className={`inline-flex min-h-7 items-center border px-2.5 py-1 font-mono text-[0.65rem] font-bold uppercase leading-4 tracking-[0.11em] ${
        toneByValue[value] ??
        "border-white/20 bg-white/[0.04] text-white/75"
      } ${className}`}
    >
      <span aria-hidden="true" className="mr-2 size-1.5 bg-current" />
      {label}
    </span>
  );
}
