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
Optional: `GROQ_MODEL` (defaults to `llama-3.3-70b-versatile`).

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
   feedback and change summary is kept in a visible log.
5. **Freeze** - a client-side state transition (no API call): locks in the current
   filters, rubric, and ranked shortlist as the final state.

All state (query, filters, rubric, results, round history) lives in React state on the
client and is passed back to the API on each request - there's no database and no
server-side session.

## Prompts

Kept in `lib/prompts.ts` (as template functions, since query/state get interpolated in)
with a plain-English mirror in `prompts/README.md`. All three prompts require strict
JSON output, validated against Zod schemas (`lib/schemas.ts`) before use.

## Failure handling

`lib/llm.ts` wraps every LLM call: 20s timeout per attempt, JSON-mode requested from the
API, one automatic retry with a stricter reminder if the response fails Zod validation,
and typed errors (`auth` / `rate_limit` / `timeout` / `invalid_output` / `unknown`) that
map to a designed error screen (`components/ErrorState.tsx`) with a retry button -
never a raw crash or stack trace. Empty result sets (filters match nobody) get their own
designed empty state rather than a blank list.

## Decisions - what I prioritized, what I cut, and why

**Prioritized:**
- Getting the full loop working end-to-end with real LLM calls over polishing any single
  step - a recruiter needs to see the whole flow trusted, not one perfect screen.
- Explanations that cite real profile fields (company, title, skill, years) rather than
  generic praise - this was called out explicitly as a trust signal in the brief, and is
  enforced in the scoring prompt.
- A visible, plain-language change log on refinement ("Round 2: raised min years to 5
  because...") so the recruiter can trust why results changed, not just that they did.
- Designed failure and empty states, since the brief explicitly grades this - a missing
  API key or a malformed LLM response shows a clear message and retry, not a crash.
- An editable filters/rubric panel, always visible, matching the brief's described flow.

**Cut / simplified, given the 3-hour box:**
- Per-profile yes/no buttons - free-text feedback in a single input covers the required
  flow (the brief explicitly allows either) and was faster to build well than a second
  parallel interaction pattern.
- Streaming responses - a single "thinking" state with a staged label was enough to make
  waiting feel intentional without adding streaming complexity to every route.
- Manually editing filters/rubric in the side panel doesn't auto-re-run the search on
  every keystroke - you refine via the feedback box, which re-scores. Live re-filtering
  on manual edits was judged lower value than the refinement loop itself for the time
  available.
- Multi-provider LLM fallback - the brief allows any single free-tier provider; used
  Groq for low latency (matters when demoing a "thinking" loop live) and didn't build a
  second provider as a fallback.
