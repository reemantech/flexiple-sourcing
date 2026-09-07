"use client";

import type { Filters, Rubric } from "@/lib/schemas";

function TagList({
  values,
  onChange,
}: {
  values: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <input
      type="text"
      value={values.join(", ")}
      onChange={(e) =>
        onChange(
          e.target.value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        )
      }
      placeholder="none"
      className="w-full bg-transparent text-sm outline-none border-b border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] py-0.5 placeholder:text-[var(--ink-muted)]/60"
    />
  );
}

const COMPANY_TYPES = ["startup", "scaleup", "enterprise", "agency"] as const;

export default function SpecPanel({
  filters,
  rubric,
  totalMatched,
  onChangeFilters,
  onChangeRubric,
  onApplyFilters,
  applyDisabled,
}: {
  filters: Filters;
  rubric: Rubric;
  totalMatched: number;
  onChangeFilters: (f: Filters) => void;
  onChangeRubric: (r: Rubric) => void;
  onApplyFilters: () => void;
  applyDisabled: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold">Filters</h2>
          <span className="text-xs text-[var(--ink-muted)]">
            {totalMatched} matched
          </span>
        </div>
        <dl className="space-y-2.5 text-sm">
          <div className="grid grid-cols-[100px_1fr] items-start gap-2">
            <dt className="text-[var(--ink-muted)]">Skills (any)</dt>
            <dd>
              <TagList
                values={filters.skills_any}
                onChange={(v) => onChangeFilters({ ...filters, skills_any: v })}
              />
            </dd>
          </div>
          <div className="grid grid-cols-[100px_1fr] items-start gap-2">
            <dt className="text-[var(--ink-muted)]">Skills (all)</dt>
            <dd>
              <TagList
                values={filters.skills_all}
                onChange={(v) => onChangeFilters({ ...filters, skills_all: v })}
              />
            </dd>
          </div>
          <div className="grid grid-cols-[100px_1fr] items-start gap-2">
            <dt className="text-[var(--ink-muted)]">Experience</dt>
            <dd className="flex items-center gap-1.5">
              <input
                type="number"
                value={filters.min_years_experience ?? ""}
                onChange={(e) =>
                  onChangeFilters({
                    ...filters,
                    min_years_experience: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="min"
                className="w-14 bg-transparent text-sm outline-none border-b border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] py-0.5"
              />
              <span className="text-[var(--ink-muted)]">–</span>
              <input
                type="number"
                value={filters.max_years_experience ?? ""}
                onChange={(e) =>
                  onChangeFilters({
                    ...filters,
                    max_years_experience: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="max"
                className="w-14 bg-transparent text-sm outline-none border-b border-transparent hover:border-[var(--primary)] py-0.5"
              />
              <span className="text-[var(--ink-muted)] text-xs">years</span>
            </dd>
          </div>
          <div className="grid grid-cols-[100px_1fr] items-start gap-2">
            <dt className="text-[var(--ink-muted)]">Location</dt>
            <dd>
              <TagList
                values={filters.locations}
                onChange={(v) => onChangeFilters({ ...filters, locations: v })}
              />
            </dd>
          </div>
          <div className="grid grid-cols-[100px_1fr] items-start gap-2">
            <dt className="text-[var(--ink-muted)] pt-1">Company type</dt>
            <dd className="flex flex-wrap gap-1.5">
              {COMPANY_TYPES.map((t) => {
                const active = filters.company_types.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() =>
                      onChangeFilters({
                        ...filters,
                        company_types: active
                          ? filters.company_types.filter((x) => x !== t)
                          : [...filters.company_types, t],
                      })
                    }
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      active
                        ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                        : "border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--primary)]"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </dd>
          </div>
        </dl>
      </div>

      <button
        onClick={onApplyFilters}
        disabled={applyDisabled}
        className="w-full text-sm font-medium px-3 py-2 rounded border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-30 transition-colors"
      >
        Apply filter changes
      </button>

      <div className="border-t border-[var(--border)] pt-5">
        <h2 className="text-sm font-semibold mb-2">Fit rubric</h2>
        <p className="text-sm text-[var(--ink-muted)] mb-3 leading-snug">{rubric.summary}</p>
        <ul className="space-y-3">
          {rubric.criteria.map((c, i) => (
            <li key={i} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{c.label}</span>
                <span className="flex gap-0.5 shrink-0" aria-label={`weight ${c.weight} of 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: n <= c.weight ? "var(--attention)" : "var(--border)",
                      }}
                    />
                  ))}
                </span>
              </div>
              <p className="text-[var(--ink-muted)] leading-snug mt-0.5">{c.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}