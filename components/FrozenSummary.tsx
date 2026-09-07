import type { Filters, Rubric } from "@/lib/schemas";
import type { ResultItem } from "@/lib/types";
import ResultCard from "./ResultCard";

export default function FrozenSummary({
  query,
  filters,
  rubric,
  results,
  round,
  onNewSearch,
}: {
  query: string;
  filters: Filters;
  rubric: Rubric;
  results: ResultItem[];
  round: number;
  onNewSearch: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto min-h-0 px-6 py-8 print:overflow-visible print:h-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--primary)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>
              Search frozen after {round} refinement round{round === 1 ? "" : "s"}
            </p>
          </div>
          <div className="print:hidden flex items-center gap-2 shrink-0">
            <button
              onClick={onNewSearch}
              className="flex items-center gap-2 text-sm font-medium border border-[var(--border)] rounded px-4 py-2 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Start a new search
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 text-sm font-medium bg-[var(--ink)] text-white rounded px-4 py-2 hover:opacity-90 transition-opacity"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Save as PDF
            </button>
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-6">"{query}"</h1>

        <div className="grid sm:grid-cols-2 gap-6 mb-8 border border-[var(--border)] rounded-md p-5 bg-[var(--surface)]">
          <div>
            <h2 className="text-sm font-semibold mb-2">Frozen filters</h2>
            <ul className="text-sm text-[var(--ink-muted)] space-y-1">
              {filters.skills_any.length > 0 && <li>Skills (any): {filters.skills_any.join(", ")}</li>}
              {filters.skills_all.length > 0 && <li>Skills (all): {filters.skills_all.join(", ")}</li>}
              {(filters.min_years_experience !== null || filters.max_years_experience !== null) && (
                <li>
                  Experience: {filters.min_years_experience ?? "0"}–{filters.max_years_experience ?? "∞"} yrs
                </li>
              )}
              {filters.locations.length > 0 && <li>Location: {filters.locations.join(", ")}</li>}
              {filters.company_types.length > 0 && (
                <li>Company type: {filters.company_types.join(", ")}</li>
              )}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold mb-2">Frozen rubric</h2>
            <p className="text-sm text-[var(--ink-muted)] mb-2">{rubric.summary}</p>
            <ul className="text-sm space-y-1">
              {rubric.criteria.map((c, i) => (
                <li key={i}>
                  <span className="font-medium">{c.label}</span>{" "}
                  <span className="text-[var(--ink-muted)]">(weight {c.weight})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <h2 className="text-sm font-semibold mb-3">
          Final shortlist — {results.length} candidate{results.length === 1 ? "" : "s"}
        </h2>
        <div className="space-y-3 mb-8">
          {results.map((r, i) => (
            <ResultCard key={r.profile.id} item={r} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}