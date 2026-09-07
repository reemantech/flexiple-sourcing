import type { Filters, Rubric, Profile } from "./schemas";

export type ResultItem = {
  profile: Profile;
  score: number;
  explanation: string;
};

export type LoopError = {
  kind: "auth" | "rate_limit" | "timeout" | "invalid_output" | "unknown" | "bad_request";
  message: string;
};

export type RoundLogEntry = {
  round: number;
  feedback: string;
  changeSummary: string;
};

export type LoopState =
  | { status: "landing" }
  | { status: "thinking"; label: string }
  | {
      status: "results";
      query: string;
      filters: Filters;
      rubric: Rubric;
      results: ResultItem[];
      totalMatched: number;
      round: number;
      log: RoundLogEntry[];
      // set while a refinement round is in flight - filters/rubric/results
      // stay visible and frozen, only the center panel shows a loading state
      pendingFeedback?: string;
      pendingApply?: boolean;
    }
  | {
      status: "frozen";
      query: string;
      filters: Filters;
      rubric: Rubric;
      results: ResultItem[];
      totalMatched: number;
      round: number;
      log: RoundLogEntry[];
    }
  | {
      status: "error";
      error: LoopError;
      // what to return to on retry/dismiss
      previous:
        | { kind: "landing" }
        | {
            kind: "results";
            query: string;
            filters: Filters;
            rubric: Rubric;
            results: ResultItem[];
            totalMatched: number;
            round: number;
            log: RoundLogEntry[];
          };
      retryQuery?: string;
      retryFeedback?: string;
    };