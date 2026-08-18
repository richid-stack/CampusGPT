interface SourceCardProps {
  citation: any;
}

export function SourceCard({ citation }: SourceCardProps) {
  const hostname = citation.domain || (() => {
    try { return new URL(citation.url).hostname.replace(/^www\./, ''); } catch { return 'UG source'; }
  })();
  return (
    <a 
      href={citation.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex flex-col gap-1 w-[200px] p-3 rounded-lg border border-border bg-card hover:bg-background hover:border-brand-500 transition-all group"
    >
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-background border border-border rounded flex items-center justify-center text-[10px] font-bold text-text-secondary group-hover:text-brand-500 transition-colors">
           {citation.index ?? '↗'}
        </div>
         <span className="text-xs font-medium text-text-secondary truncate">{hostname}</span>
      </div>
       <div className="text-sm font-semibold text-text-primary line-clamp-2 leading-tight">
        {citation.title}
      </div>
       {citation.snippet && (
         <p className="text-[11px] text-text-tertiary line-clamp-2 mt-1 leading-snug">{citation.snippet}</p>
       )}
    </a>
  );
}
