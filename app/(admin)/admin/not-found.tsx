import Link from "next/link";

export default function AdminRecordNotFound() {
  return (
    <div className="technical-grid min-h-[calc(100vh-10rem)] px-4 py-12 sm:px-6">
      <section className="mx-auto max-w-2xl border border-white/15 bg-surface p-6 sm:p-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-accent">
          Editorial record / Not available
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-[-0.035em] text-ink">
          Operational record not found
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          The identifier is invalid, the record no longer exists, or it is not
          available to this operation.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex min-h-12 items-center bg-accent px-5 text-xs font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Return to editorial desk
        </Link>
      </section>
    </div>
  );
}
