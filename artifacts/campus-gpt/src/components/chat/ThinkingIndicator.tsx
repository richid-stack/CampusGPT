interface ThinkingIndicatorProps {
  modelLabel?: string | null;
}

export function ThinkingIndicator({ modelLabel }: ThinkingIndicatorProps) {
  const label = modelLabel ?? 'CampusGPT';
  return (
    <div className="flex items-start gap-3 py-4 px-2 md:px-4 animate-in">
      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 shrink-0 mt-0.5 animate-pulse" />
      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-medium text-text-tertiary">
          {label} · Thinking
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 150, 300].map(delay => (
              <span
                key={delay}
                className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"
                style={{ animationDelay: `${delay}ms`, animationDuration: '1s' }}
              />
            ))}
          </div>
          <span className="text-sm text-text-tertiary italic">Reading campus knowledge…</span>
        </div>
      </div>
    </div>
  );
}
