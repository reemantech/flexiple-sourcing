import { NextRequest, NextResponse } from "next/server";
import { callStructured, LLMError } from "@/lib/llm";
import { ScoreBatchSchema, FiltersSchema, RubricSchema, type Profile } from "@/lib/schemas";
import { SCORE_SYSTEM_PROMPT, scoreUserPrompt } from "@/lib/prompts";
import { applyFilters } from "@/lib/filter";

const MAX_PROFILES_TO_SCORE = 24;
const TOP_N = 5;

// Used when the recruiter edits filters/rubric directly in the panel rather
// than giving feedback. Skips the LLM "generate/refine" step entirely - just
// re-runs local filtering and LLM scoring against whatever they set.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const filters = FiltersSchema.parse(body.filters);
    const rubric = RubricSchema.parse(body.rubric);

    const matched = applyFilters(filters);

    if (matched.length === 0) {
      return NextResponse.json({ results: [], totalMatched: 0 });
    }

    const pool = matched.slice(0, MAX_PROFILES_TO_SCORE);

    const scored = await callStructured(
      SCORE_SYSTEM_PROMPT,
      scoreUserPrompt(rubric, pool),
      ScoreBatchSchema
    );

    const byId = new Map(pool.map((p: Profile) => [p.id, p]));
    const results = scored.scores
      .filter((s) => byId.has(s.id))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N)
      .map((s) => ({ profile: byId.get(s.id), score: s.score, explanation: s.explanation }));

    return NextResponse.json({ results, totalMatched: matched.length });
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