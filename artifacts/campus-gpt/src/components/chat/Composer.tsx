import { ArrowUp, Mic, Plus, Square } from 'lucide-react';
import { useState, useRef } from 'react';

interface ComposerProps {
  onSend: (content: string) => void;
  isStreaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
}

export function Composer({ onSend, isStreaming, onStop, placeholder }: ComposerProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (content.trim() && !isStreaming) {
        submit();
      }
    }
  };

  const submit = () => {
    if (!content.trim() || isStreaming) return;
    onSend(content.trim());
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleActionButton = () => {
    if (isStreaming) {
      onStop?.();
    } else {
      submit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 md:px-4 pb-4 md:pb-6 pt-2">
      <div className="relative flex items-end gap-1 bg-background border border-border rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-brand-500/50 transition-shadow">
        <button className="p-2.5 md:p-3 text-text-tertiary hover:text-text-primary transition-colors shrink-0">
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Ask CampusGPT..."}
          rows={1}
          className="flex-1 max-h-[160px] min-h-[42px] md:min-h-[44px] py-2.5 md:py-3 bg-transparent border-none outline-none resize-none text-text-primary placeholder:text-text-tertiary leading-relaxed text-[15px]"
        />

        <div className="flex items-center gap-1 p-1.5 md:p-2 shrink-0">
          <button className="p-1.5 md:p-2 text-text-tertiary hover:text-text-primary transition-colors hidden sm:block">
            <Mic className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          <button
            disabled={!content.trim() && !isStreaming}
            onClick={handleActionButton}
            className={`p-1.5 md:p-2 rounded-lg transition-colors flex items-center justify-center
              ${isStreaming
                ? 'bg-red-500 text-white hover:bg-red-600'
                : content.trim()
                  ? 'bg-brand-500 text-white hover:bg-brand-600'
                  : 'bg-card text-text-tertiary cursor-not-allowed'}`}
          >
            {isStreaming
              ? <Square className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" />
              : <ArrowUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
            }
          </button>
        </div>
      </div>
      <p className="text-center mt-2 text-[10px] md:text-[11px] text-text-tertiary">
        CampusGPT can make mistakes. Always verify important information with official UG sources.
      </p>
    </div>
  );
}
