import type { RoundLogEntry } from "@/lib/types";

export default function SearchHistoryPanel({
  originalQuery,
  log,
  pendingFeedback,
}: {
  originalQuery: string;
  log: RoundLogEntry[];
  pendingFeedback?: string;
}) {
  return (
    <div className="h-full overflow-y-auto px-5 py-6">
      <h3 className="text-sm font-semibold mb-4">Search history</h3>
      <ol>
        <li className="relative pl-5 pb-5 border-l border-[var(--border)] last:border-transparent last:pb-0">
          <span
            className="absolute -left-[3.5px] top-1 w-[7px] h-[7px] rounded-full"
            style={{ background: "var(--primary)" }}
          />
          <p className="text-xs text-[var(--ink-muted)] mb-0.5">Original search</p>
          <p className="text-sm">&ldquo;{originalQuery}&rdquo;</p>
        </li>
        {log.map((entry) => (
          <li
            key={entry.round}
            className="relative pl-5 pb-5 border-l border-[var(--border)] last:border-transparent last:pb-0"
          >
            <span
              className="absolute -left-[3.5px] top-1 w-[7px] h-[7px] rounded-full"
              style={{ background: "var(--attention)" }}
            />
            <p className="text-xs text-[var(--ink-muted)] mb-0.5">
              Round {entry.round} feedback
            </p>
            <p className="text-sm mb-1">&ldquo;{entry.feedback}&rdquo;</p>
            <p className="text-sm text-[var(--ink-muted)]">&rarr; {entry.changeSummary}</p>
          </li>
        ))}
        {pendingFeedback && (
          <li className="relative pl-5 pb-5 border-l border-transparent">
            <span
              className="absolute -left-[3.5px] top-1 w-[7px] h-[7px] rounded-full animate-pulse"
              style={{ background: "var(--attention)" }}
            />
            <p className="text-xs text-[var(--ink-muted)] mb-0.5">
              Round {log.length + 1} feedback
            </p>
            <p className="text-sm mb-1">&ldquo;{pendingFeedback}&rdquo;</p>
            <p className="text-sm text-[var(--ink-muted)] italic">Updating filters and rubric…</p>
          </li>
        )}
      </ol>
    </div>
  );
}