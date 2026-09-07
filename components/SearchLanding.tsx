"use client";

import { useState } from "react";

const EXAMPLES = [
  "RDS developers with 4-7 years of experience who have worked at startups, for a role based in Bangalore.",
  "Senior React engineers in Delhi with 5+ years, ideally from scaleups, strong ownership mindset.",
  "Early-career data engineers who've touched Kafka, open to enterprise backgrounds.",
];

export default function SearchLanding({
  onSearch,
}: {
  onSearch: (query: string) => void;
}) {
  const [value, setValue] = useState("");

  function submit() {
    if (value.trim().length < 3) return;
    onSearch(value.trim());
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl">
        <p className="text-sm text-[var(--ink-muted)] mb-3">Flexiple sourcing</p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-8">
          Describe who you need.
        </h1>

        <div className="border border-[var(--border)] bg-[var(--surface)] rounded-md p-1.5 flex gap-2 focus-within:border-[var(--primary)] transition-colors">
          <textarea
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="RDS developers with 4-7 years of experience who have worked at startups, for a role based in Bangalore."
            rows={2}
            className="flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] leading-snug placeholder:text-[var(--ink-muted)] outline-none"
          />
          <button
            onClick={submit}
            disabled={value.trim().length < 3}
            className="self-end mb-1 mr-1 px-4 py-2 rounded text-sm font-medium bg-[var(--primary)] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setValue(ex)}
              className="text-left text-xs text-[var(--ink-muted)] border border-[var(--border)] rounded-full px-3 py-1.5 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
            >
              {ex.length > 56 ? ex.slice(0, 56) + "…" : ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
