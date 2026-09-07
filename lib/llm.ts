import Groq from "groq-sdk";
import { z } from "zod";

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

export class LLMError extends Error {
  kind: "auth" | "rate_limit" | "timeout" | "invalid_output" | "unknown";
  constructor(kind: LLMError["kind"], message: string) {
    super(message);
    this.kind = kind;
    this.name = "LLMError";
  }
}

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new LLMError(
      "auth",
      "GROQ_API_KEY is not set. Add it to your environment before starting the server."
    );
  }
  return new Groq({ apiKey });
}

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

// Groq's own JSON-mode decoder can occasionally fail to produce parseable JSON
// and rejects the request itself with a 400 before we ever see a completion.
// We treat that the same as "the model gave us bad JSON" - retryable, not fatal.
function isRetryableGenerationFailure(err: any): boolean {
  return (
    err?.status === 400 &&
    (err?.error?.code === "json_validate_failed" ||
      err?.code === "json_validate_failed" ||
      /json_validate_failed|failed to generate json/i.test(err?.message ?? ""))
  );
}

/**
 * Calls the LLM expecting JSON output validated against `schema`.
 * Retries once (with a stricter reminder) on invalid/malformed JSON -
 * whether the malformed JSON came back to us, or Groq's own decoder
 * rejected the request outright. Times out after 20s per attempt.
 */
export async function callStructured<T extends z.ZodTypeAny>(
  systemPrompt: string,
  userPrompt: string,
  schema: T
): Promise<z.infer<T>> {
  const client = getClient();
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const messages = [
      { role: "system" as const, content: systemPrompt },
      {
        role: "user" as const,
        content:
          attempt === 0
            ? userPrompt
            : `${userPrompt}\n\nYour previous response was invalid: ${lastError}\nReturn ONLY valid JSON, no markdown fences, no commentary, matching the required shape exactly. Use plain ASCII punctuation only (a regular hyphen "-", not a special dash character).`,
      },
    ];

    let raw: string;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const completion = await client.chat.completions.create(
        {
          model: MODEL,
          messages,
          temperature: 0.3,
          response_format: { type: "json_object" },
        },
        { signal: controller.signal as any }
      );
      clearTimeout(timeout);
      raw = completion.choices[0]?.message?.content ?? "";
    } catch (err: any) {
      if (err?.name === "AbortError") {
        throw new LLMError("timeout", "The model took too long to respond.");
      }
      if (err?.status === 429) {
        throw new LLMError("rate_limit", "Rate limit hit. Please wait a moment and try again.");
      }
      if (err?.status === 401 || err?.status === 403) {
        throw new LLMError("auth", "The LLM API key was rejected.");
      }
      if (isRetryableGenerationFailure(err)) {
        // Don't throw yet - let the loop retry with a stricter prompt, same
        // as a malformed-JSON response we parsed ourselves.
        lastError = "the model's own JSON decoder rejected the output as malformed";
        continue;
      }
      throw new LLMError("unknown", err?.message || "Unknown LLM error.");
    }

    try {
      const parsed = JSON.parse(stripFences(raw));
      const result = schema.safeParse(parsed);
      if (result.success) return result.data;
      lastError = result.error.issues.map((i) => i.message).join("; ");
    } catch (e: any) {
      lastError = `could not parse JSON (${e?.message ?? "parse error"})`;
    }
  }

  throw new LLMError(
    "invalid_output",
    `Model did not return valid structured output after retrying: ${lastError}`
  );
}