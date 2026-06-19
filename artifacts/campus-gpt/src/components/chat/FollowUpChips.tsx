interface FollowUpChipsProps {
  chips: string[];
}

export function FollowUpChips({ chips }: FollowUpChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, index) => (
        <button
          key={index}
          className="px-3 py-1.5 rounded-full border border-border text-sm font-medium text-text-secondary hover:text-brand-600 hover:border-brand-500 hover:bg-brand-50/50 transition-colors bg-card/50"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
