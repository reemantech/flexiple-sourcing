"use client";

import { useState } from "react";
import type { LoopState, ResultItem, RoundLogEntry } from "@/lib/types";
import type { Filters, Rubric } from "@/lib/schemas";
import SearchLanding from "@/components/SearchLanding";
import Thinking from "@/components/Thinking";
import SpecPanel from "@/components/SpecPanel";
import ResultCard from "@/components/ResultCard";
import EmptyResults from "@/components/EmptyResults";
import RefinementFeed from "@/components/RefinementFeed";
import SearchHistoryPanel from "@/components/SearchHistoryPanel";
import ErrorState from "@/components/ErrorState";
import FrozenSummary from "@/components/FrozenSummary";

export default function Page() {
  const [state, setState] = useState<LoopState>({ status: "landing" });

  async function runSearch(query: string) {
    setState({ status: "thinking", label: "Reading the brief, drafting filters and a fit rubric…" });
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({
          status: "error",
          error: data.error,
          previous: { kind: "landing" },
          retryQuery: query,
        });
        return;
      }
      setState({
        status: "results",
        query,
        filters: data.filters,
        rubric: data.rubric,
        results: data.results,
        totalMatched: data.totalMatched,
        round: 0,
        log: [],
      });
    } catch (e: any) {
      setState({
        status: "error",
        error: { kind: "unknown", message: e?.message ?? "Network error" },
        previous: { kind: "landing" },
        retryQuery: query,
      });
    }
  }

  async function runRefine(
    base: Extract<LoopState, { status: "results" }>,
    feedback: string
  ) {
    // Keep filters/rubric/results visible and frozen; only the center panel
    // shows a loading state while this round processes.
    setState({ ...base, pendingFeedback: feedback });
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalQuery: base.query,
          currentFilters: base.filters,
          currentRubric: base.rubric,
          shownResults: base.results,
          feedback,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({
          status: "error",
          error: data.error,
          previous: { kind: "results", ...base },
          retryFeedback: feedback,
        });
        return;
      }
      const newRound = base.round + 1;
      const newLog: RoundLogEntry[] = [
        ...base.log,
        { round: newRound, feedback, changeSummary: data.changeSummary },
      ];
      setState({
        status: "results",
        query: base.query,
        filters: data.filters,
        rubric: data.rubric,
        results: data.results,
        totalMatched: data.totalMatched,
        round: newRound,
        log: newLog,
      });
    } catch (e: any) {
      setState({
        status: "error",
        error: { kind: "unknown", message: e?.message ?? "Network error" },
        previous: { kind: "results", ...base },
        retryFeedback: feedback,
      });
    }
  }

  function updateFilters(base: Extract<LoopState, { status: "results" }>, filters: Filters) {
    setState({ ...base, filters });
  }
  function updateRubric(base: Extract<LoopState, { status: "results" }>, rubric: Rubric) {
    setState({ ...base, rubric });
  }

  async function runApplyFilters(base: Extract<LoopState, { status: "results" }>) {
    setState({ ...base, pendingApply: true });
    try {
      const res = await fetch("/api/rescore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: base.filters, rubric: base.rubric }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({
          status: "error",
          error: data.error,
          previous: { kind: "results", ...base },
        });
        return;
      }
      setState({
        ...base,
        results: data.results,
        totalMatched: data.totalMatched,
      });
    } catch (e: any) {
      setState({
        status: "error",
        error: { kind: "unknown", message: e?.message ?? "Network error" },
        previous: { kind: "results", ...base },
      });
    }
  }

  function freeze(base: Extract<LoopState, { status: "results" }>) {
    setState({ ...base, status: "frozen" });
  }

  // ---- render ----

  if (state.status === "landing") {
    return (
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        <SearchLanding onSearch={runSearch} />
      </main>
    );
  }

  if (state.status === "thinking") {
    return (
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        <Thinking label={state.label} />
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        <ErrorState
          error={state.error}
          onRetry={() => {
            if (state.previous.kind === "landing" && state.retryQuery) {
              runSearch(state.retryQuery);
            } else if (state.previous.kind === "results" && state.retryFeedback) {
              const { kind, ...base } = state.previous;
              runRefine(base as Extract<LoopState, { status: "results" }>, state.retryFeedback);
            } else if (state.previous.kind === "results") {
              const { kind, ...base } = state.previous;
              setState(base as Extract<LoopState, { status: "results" }>);
            } else {
              setState({ status: "landing" });
            }
          }}
          onDismiss={() => {
            if (state.previous.kind === "landing") {
              setState({ status: "landing" });
            } else {
              const { kind, ...base } = state.previous;
              setState(base as Extract<LoopState, { status: "results" }>);
            }
          }}
        />
      </main>
    );
  }

  if (state.status === "frozen") {
    return (
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        <FrozenSummary
          query={state.query}
          filters={state.filters}
          rubric={state.rubric}
          results={state.results}
          round={state.round}
          onNewSearch={() => setState({ status: "landing" })}
        />
      </main>
    );
  }

  // status === "results"
  const isRefining = !!state.pendingFeedback || !!state.pendingApply;
  return (
    <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
      <aside className="md:w-[300px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--surface)] px-5 py-6 md:overflow-y-auto md:min-h-0">
        <p className="text-xs text-[var(--ink-muted)] mb-4 leading-snug">&ldquo;{state.query}&rdquo;</p>
        <div className={isRefining ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
          <SpecPanel
            filters={state.filters}
            rubric={state.rubric}
            totalMatched={state.totalMatched}
            onChangeFilters={(f) => updateFilters(state, f)}
            onChangeRubric={(r) => updateRubric(state, r)}
          />
        </div>
        <button
          onClick={() => runApplyFilters(state)}
          disabled={isRefining}
          className="mt-5 w-full text-sm font-medium px-3 py-2 rounded border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-30 transition-colors"
        >
          Apply filter changes
        </button>
      </aside>

      <section className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-6">
          <div className="max-w-2xl w-full mx-auto">
            <h2 className="text-sm font-semibold mb-3">
              Top matches {state.round > 0 && `— round ${state.round}`}
            </h2>
            {isRefining ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)] mb-4">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] thinking-dot" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] thinking-dot" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] thinking-dot" style={{ animationDelay: "300ms" }} />
                  </span>
                  {state.pendingApply
                    ? "Re-scoring candidates against your updated filters…"
                    : "Reading your feedback, adjusting filters and rubric…"}
                </div>
                <div className="opacity-40 pointer-events-none space-y-3">
                  {state.results.map((r: ResultItem, i: number) => (
                    <ResultCard key={r.profile.id} item={r} index={i} />
                  ))}
                </div>
              </div>
            ) : state.results.length === 0 ? (
              <EmptyResults />
            ) : (
              <div className="space-y-3">
                {state.results.map((r: ResultItem, i: number) => (
                  <ResultCard key={r.profile.id} item={r} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
        <RefinementFeed
          disabled={isRefining}
          onSubmitFeedback={(feedback) => runRefine(state, feedback)}
          onFreeze={() => freeze(state)}
        />
      </section>

      <aside className="md:w-[300px] shrink-0 border-t md:border-t-0 md:border-l border-[var(--border)] bg-[var(--surface)] md:overflow-hidden md:min-h-0">
        <SearchHistoryPanel
          originalQuery={state.query}
          log={state.log}
          pendingFeedback={state.pendingFeedback}
        />
      </aside>
    </main>
  );
}