"use client";

import { useState } from "react";

export default function RefinementFeed({
  onSubmitFeedback,
  onFreeze,
  disabled,
}: {
  onSubmitFeedback: (feedback: string) => void;
  onFreeze: () => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");

  function submit() {
    if (value.trim().length < 2 || disabled) return;
    onSubmitFeedback(value.trim());
    setValue("");
  }

  return (
    <div className="border-t border-[var(--border)] bg-[var(--paper)] px-6 py-4 sticky bottom-0">
      <div className="max-w-2xl mx-auto flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          disabled={disabled}
          placeholder='e.g. "1 is too junior, 2 and 4 are right"'
          className="flex-1 border border-[var(--border)] bg-[var(--surface)] rounded px-3 py-2 text-sm outline-none focus:border-[var(--primary)] disabled:opacity-50"
        />
        <button
          onClick={submit}
          disabled={disabled || value.trim().length < 2}
          className="px-3 py-2 rounded text-sm font-medium border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-30 transition-colors shrink-0"
        >
          Send
        </button>
        <button
          onClick={onFreeze}
          disabled={disabled}
          className="px-3 py-2 rounded text-sm font-medium bg-[var(--ink)] text-white hover:opacity-90 disabled:opacity-30 transition-opacity shrink-0"
        >
          Freeze search
        </button>
      </div>
    </div>
  );
}