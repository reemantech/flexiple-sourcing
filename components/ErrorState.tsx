import type { LoopError } from "@/lib/types";

const COPY: Record<LoopError["kind"], { title: string; body: string }> = {
  auth: {
    title: "The model rejected the API key.",
    body: "Check that your GROQ_API_KEY is set correctly and restart the server.",
  },
  rate_limit: {
    title: "Hit a rate limit.",
    body: "The free tier is briefly over capacity. Wait a few seconds and try again.",
  },
  timeout: {
    title: "The model took too long to respond.",
    body: "This can happen under load. Try again — it usually succeeds on retry.",
  },
  invalid_output: {
    title: "The model's response didn't match the expected format.",
    body: "We retried once automatically and it still came back malformed. Try rephrasing, or try again.",
  },
  bad_request: {
    title: "Missing a bit more detail.",
    body: "Add a little more to go on and try again.",
  },
  unknown: {
    title: "Something went wrong.",
    body: "An unexpected error occurred. Try again.",
  },
};

export default function ErrorState({
  error,
  onRetry,
  onDismiss,
}: {
  error: LoopError;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const copy = COPY[error.kind] ?? COPY.unknown;
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <span
          className="inline-block w-2 h-2 rounded-full mb-4"
          style={{ background: "var(--low)" }}
        />
        <h2 className="font-semibold mb-1.5">{copy.title}</h2>
        <p className="text-sm text-[var(--ink-muted)] mb-1">{copy.body}</p>
        <p className="text-xs text-[var(--ink-muted)]/70 mb-6 font-mono">{error.message}</p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded text-sm font-medium bg-[var(--ink)] text-white hover:opacity-90"
          >
            Try again
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 rounded text-sm font-medium border border-[var(--border)] hover:border-[var(--primary)]"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
