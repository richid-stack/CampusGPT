import { Globe } from 'lucide-react';

interface SourceCardProps {
  url: string;
  title?: string;
  snippet?: string;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'source';
  }
}

/** A link to an official page the answer relies on. */
export function SourceCard({ url, title, snippet }: SourceCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex w-full flex-col gap-1 rounded-xl border border-border bg-card/60 p-3 transition-colors hover:bg-card sm:w-[220px]"
    >
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">{hostOf(url)}</span>
      </span>
      <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{title || hostOf(url)}</span>
      {snippet && <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">{snippet}</span>}
    </a>
  );
}
