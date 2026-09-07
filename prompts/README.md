# Prompts

The single source of truth for prompts is `lib/prompts.ts` (they're template
functions, not static strings, since user query / current state get interpolated in).
This file is a readable mirror of the three prompts used, for review.

## 1. Generate — free text → filters + rubric
System prompt: see `GENERATE_SYSTEM_PROMPT` in `lib/prompts.ts`.
User message: the recruiter's raw query.

## 2. Score — rubric + profiles → per-profile score & explanation
System prompt: see `SCORE_SYSTEM_PROMPT` in `lib/prompts.ts`.
User message: the current rubric + the batch of candidate profiles (after objective
filters have already narrowed the pool locally).

## 3. Refine — feedback → updated filters + rubric
System prompt: see `REFINE_SYSTEM_PROMPT` in `lib/prompts.ts`.
User message: original query, current filters, current rubric, the profiles just
shown, and the recruiter's free-text (and/or per-profile yes/no) feedback.

All three enforce strict JSON-only output (no markdown fences) and are validated
against Zod schemas in `lib/schemas.ts` server-side before use. On a validation
failure the server retries once with a stricter reminder, then surfaces a designed
error state to the recruiter rather than crashing.
