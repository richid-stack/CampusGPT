export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-6 px-4 animate-in">
      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 shrink-0 opacity-50" />
      <div className="text-sm font-medium text-text-tertiary flex items-center gap-1">
        Thinking
        <span className="flex gap-0.5">
          <span className="w-1 h-1 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-1 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-1 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      </div>
    </div>
  );
}
