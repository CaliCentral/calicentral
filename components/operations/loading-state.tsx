export function OperationsLoadingState({
  label = "Loading secure account data…",
}: {
  readonly label?: string;
}) {
  return (
    <div className="technical-grid min-h-[calc(100vh-10rem)]">
      <div className="mx-auto w-full max-w-[96rem] px-4 py-12 sm:px-6 lg:px-8">
        <div
          role="status"
          className="border border-white/15 bg-surface p-6 text-sm text-muted"
        >
          <span
            aria-hidden="true"
            className="mr-3 inline-block size-2 animate-pulse bg-accent motion-reduce:animate-none"
          />
          {label}
        </div>
      </div>
    </div>
  );
}
