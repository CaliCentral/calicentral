type MetricCardProps = {
  readonly label: string;
  readonly value: number | string;
  readonly detail?: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <div className="border border-white/12 bg-surface p-5">
      <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-3 font-display text-4xl font-black tracking-[-0.05em] text-ink">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-xs leading-5 text-muted">{detail}</p>
      ) : null}
    </div>
  );
}
