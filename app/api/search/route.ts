import { NextRequest, NextResponse } from "next/server";
import { callStructured, LLMError } from "@/lib/llm";
import {
  GenerateResultSchema,
  ScoreBatchSchema,
  type Profile,
} from "@/lib/schemas";
import { GENERATE_SYSTEM_PROMPT, generateUserPrompt, SCORE_SYSTEM_PROMPT, scoreUserPrompt } from "@/lib/prompts";
import { applyFilters } from "@/lib/filter";

const MAX_PROFILES_TO_SCORE = 24; // keep prompt size sane on the free tier
const TOP_N = 5;

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return NextResponse.json(
        { error: { kind: "bad_request", message: "Please describe who you're looking for." } },
        { status: 400 }
      );
    }

    // Step 1: free text -> filters + rubric
    const generated = await callStructured(
      GENERATE_SYSTEM_PROMPT,
      generateUserPrompt(query),
      GenerateResultSchema
    );

    // Step 2: apply objective filters locally
    const matched = applyFilters(generated.filters);

    if (matched.length === 0) {
      return NextResponse.json({
        query,
        filters: generated.filters,
        rubric: generated.rubric,
        results: [],
        totalMatched: 0,
      });
    }

    const pool = matched.slice(0, MAX_PROFILES_TO_SCORE);

    // Step 3: score + rank with LLM
    const scored = await callStructured(
      SCORE_SYSTEM_PROMPT,
      scoreUserPrompt(generated.rubric, pool),
      ScoreBatchSchema
    );

    const byId = new Map(pool.map((p: Profile) => [p.id, p]));
    const results = scored.scores
      .filter((s) => byId.has(s.id))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N)
      .map((s) => ({ profile: byId.get(s.id), score: s.score, explanation: s.explanation }));

    return NextResponse.json({
      query,
      filters: generated.filters,
      rubric: generated.rubric,
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
