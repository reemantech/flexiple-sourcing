import type { ResultItem } from "@/lib/types";

function scoreColor(score: number) {
  if (score >= 70) return { text: "var(--primary)", bg: "var(--primary-soft)" };
  if (score >= 45) return { text: "var(--attention)", bg: "var(--attention-soft)" };
  return { text: "var(--low)", bg: "var(--low-soft)" };
}

export default function ResultCard({ item, index }: { item: ResultItem; index: number }) {
  const { profile, score, explanation } = item;
  const c = scoreColor(score);

  return (
    <div className="border border-[var(--border)] rounded-md p-4 bg-[var(--surface)]">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <span className="text-xs text-[var(--ink-muted)] mr-1.5">{index + 1}.</span>
          <span className="font-semibold">{profile.name}</span>
          <span className="text-[var(--ink-muted)]"> — {profile.current_title}</span>
        </div>
        <span
          className="text-xs font-medium px-2 py-1 rounded shrink-0"
          style={{ color: c.text, background: c.bg }}
        >
          {score}/100
        </span>
      </div>
      <p className="text-xs text-[var(--ink-muted)] mb-2">
        {profile.years_experience} yrs · {profile.current_company} ({profile.current_company_type}) ·{" "}
        {profile.location}
      </p>
      <p className="text-sm leading-snug">{explanation}</p>
    </div>
  );
}
