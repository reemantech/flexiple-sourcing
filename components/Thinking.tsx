export default function Thinking({ label }: { label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-1.5 mb-4">
        <span className="w-2 h-2 rounded-full bg-[var(--primary)] thinking-dot" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-[var(--primary)] thinking-dot" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-[var(--primary)] thinking-dot" style={{ animationDelay: "300ms" }} />
      </div>
      <p className="text-sm text-[var(--ink-muted)]">{label}</p>
    </div>
  );
}
