import { useState } from 'react';

interface CitationPillProps {
  index: number;
  url: string;
}

export function CitationPill({ index, url }: CitationPillProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span 
      className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded text-[10px] font-bold bg-accent/20 text-accent cursor-pointer hover:bg-accent hover:text-white transition-colors relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {index}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-card border border-border rounded-lg shadow-lg z-50 animate-in">
          <p className="text-xs text-text-primary line-clamp-2">Preview of {url}</p>
        </div>
      )}
    </span>
  );
}
