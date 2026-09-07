# Flexiple Sourcing — The Refinement Loop

A full-stack app that runs the sourcing refinement loop end to end for a single
search session: free text -> structured filters + a fit rubric -> filter the local
sample dataset -> LLM scoring/ranking -> recruiter feedback -> refine -> freeze.

## Setup

Requires Node 18+.

```bash
npm install
cp .env.local.example .env.local
# edit .env.local and paste your key:
#   GROQ_API_KEY=gsk_...
npm run dev
```

Open http://localhost:3000.

**Environment variable:** `GROQ_API_KEY` (get a free one at https://console.groq.com/keys).
Optional: `GROQ_MODEL` (defaults to `openai/gpt-oss-120b` - Groq's recommended
replacement after `llama-3.3-70b-versatile` was decommissioned in Aug 2026).

The app makes real, server-side calls to the Groq API on every generate/score/refine
step - nothing is mocked or canned. No login, no persistence: refresh and the session
is gone, by design (out of scope per the brief).

## How the loop works

1. **Generate** (`app/api/search/route.ts`) - the recruiter's free text goes to the LLM
   once to produce structured `filters` and a `rubric` (Zod-validated).
2. **Filter** (`lib/filter.ts`) - filters are applied locally against `data/profiles.json`
   (48 fictional profiles supplied with the assignment). No LLM involved in this step.
3. **Score & rank** - the filtered pool (capped at 24 profiles, to keep prompt size sane
   on a free-tier model) is sent to the LLM in one call against the rubric; it returns a
   0-100 score and a profile-specific explanation per candidate. Top 5 are shown.
4. **Refine** (`app/api/refine/route.ts`) - recruiter feedback (free text, e.g. "1 is too
   junior, 2 and 4 are right"), plus the current filters/rubric and the profiles just
   shown, go back to the LLM, which returns *updated* filters/rubric and a one-line
   `change_summary` explaining what it changed and why. This repeats - each round's
   feedback and change summary is kept in a visible, always-on history panel. The
   filters/rubric panel and previous results stay visible (dimmed, locked) while a
   round is processing - no full-page reload or loading-screen takeover.
5. **Apply filter changes** (`app/api/rescore/route.ts`) - the recruiter can also edit
   filters (skills, years, location, company type) directly in the panel and click
   "Apply filter changes" to re-run local filtering and LLM scoring immediately against
   their exact edits. This skips the LLM's own interpretation entirely - useful when the
   recruiter knows precisely what they want changed rather than describing it as
   feedback. The feedback box and this button are two distinct actions: feedback goes
   through the LLM (which can also revise the rubric, not just filters); direct edits
   are applied verbatim.
6. **Freeze** - a client-side state transition (no API call): locks in the current
   filters, rubric, and ranked shortlist as the final state, with a "Save as PDF" export
   (via the browser's native print-to-PDF) and a "Start a new search" reset.

All state (query, filters, rubric, results, round history) lives in React state on the
client and is passed back to the API on each request - there's no database and no
server-side session.

## Prompts

Kept in `lib/prompts.ts` (as template functions, since query/state get interpolated in)
with a plain-English mirror in `prompts/README.md`. All three prompts require strict
JSON output, validated against Zod schemas (`lib/schemas.ts`) before use.

## Failure handling

`lib/llm.ts` wraps every LLM call: 20s timeout per attempt, JSON-mode requested from the
API, and one automatic retry with a stricter reminder on either kind of malformed output
we've seen in practice - a response that fails our own Zod validation, or Groq's own
JSON-mode decoder rejecting the request outright with a `json_validate_failed` error
before we even see a completion (hit this for real during testing; the fix treats both
cases identically rather than only catching the one we anticipated up front). Typed
errors (`auth` / `rate_limit` / `timeout` / `invalid_output` /