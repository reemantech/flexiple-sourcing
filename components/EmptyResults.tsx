export default function EmptyResults() {
  return (
    <div className="border border-dashed border-[var(--border)] rounded-md p-8 text-center">
      <p className="font-medium mb-1">No profiles match these filters.</p>
      <p className="text-sm text-[var(--ink-muted)]">
        Loosen a filter on the left — years of experience and location are usually the
        tightest constraints — or tell the model what to relax below.
      </p>
    </div>
  );
}
