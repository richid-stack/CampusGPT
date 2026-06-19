interface ToolChipProps {
  text: string;
}

export function ToolChip({ text }: ToolChipProps) {
  return (
    <div className="flex items-center gap-2 py-2 px-4 animate-in">
      <div className="w-5 h-5 rounded-full bg-transparent shrink-0" />
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-card overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent animate-shimmer" />
        <span className="text-xs font-medium text-text-secondary relative z-10">{text}</span>
      </div>
    </div>
  );
}
