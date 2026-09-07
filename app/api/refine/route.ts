import { NextRequest, NextResponse } from "next/server";
import { callStructured, LLMError } from "@/lib/llm";
import { RefineResultSchema, ScoreBatchSchema, type Profile } from "@/lib/schemas";
import {
  REFINE_SYSTEM_PROMPT,
  refineUserPrompt,
  SCORE_SYSTEM_PROMPT,
  scoreUserPrompt,
} from "@/lib/prompts";
import { applyFilters } from "@/lib/filter";

const MAX_PROFILES_TO_SCORE = 24;
const TOP_N = 5;

export async function POST(req: NextRequest) {
  try {
    const { originalQuery, currentFilters, currentRubric, shownResults, feedback } =
      await req.json();

    if (!feedback || typeof feedback !== "string" || feedback.trim().length < 2) {
      return NextResponse.json(
        { error: { kind: "bad_request", message: "Tell me what to change, e.g. \"1 and 3 are too junior\"." } },
        { status: 400 }
      );
    }

    const shownProfiles = (shownResults ?? []).map((r: any) => r.profile);

    const refined = await callStructured(
      REFINE_SYSTEM_PROMPT,
      refineUserPrompt(originalQuery, currentFilters, currentRubric, shownProfiles, feedback),
      RefineResultSchema
    );

    const matched = applyFilters(refined.filters);

    if (matched.length === 0) {
      return NextResponse.json({
        filters: refined.filters,
        rubric: refined.rubric,
        changeSummary: refined.change_summary,
        results: [],
        totalMatched: 0,
      });
    }

    const pool = matched.slice(0, MAX_PROFILES_TO_SCORE);

    const scored = await callStructured(
      SCORE_SYSTEM_PROMPT,
      scoreUserPrompt(refined.rubric, pool),
      ScoreBatchSchema
    );

    const byId = new Map(pool.map((p: Profile) => [p.id, p]));
    const results = scored.scores
      .filter((s) => byId.has(s.id))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N)
      .map((s) => ({ profile: byId.get(s.id), score: s.score, explanation: s.explanation }));

    return NextResponse.json({
      filters: refined.filters,
      rubric: refined.rubric,
      changeSummary: refined.change_summary,
      results,
      totalMatched: matched.length,
    });
  } catch (err) {
    if (err instanceof LLMError) {
      return NextResponse.json({ error: { kind: err.kind, message: err.message } }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json(
      { error: { kind: "unknown", message: "Something went wrong on our end." } },
      { status: 500 }
    );
  }
}
