import { ArrowUp, Mic, Plus, Square } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ComposerProps {
  onSend: (content: string) => void;
  isStreaming?: boolean;
}

export function Composer({ onSend, isStreaming }: ComposerProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (content.trim() && !isStreaming) {
        onSend(content);
        setContent('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto px-4 pb-6 pt-2">
      <div className="relative flex items-end gap-2 bg-background border border-border rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-brand-500 transition-shadow">
        
        <button className="p-3 text-text-tertiary hover:text-text-primary transition-colors shrink-0">
          <Plus className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask CampusGPT..."
          className="flex-1 max-h-[200px] min-h-[44px] py-3 bg-transparent border-none outline-none resize-none text-text-primary placeholder:text-text-tertiary leading-relaxed"
          rows={1}
        />

        <div className="flex items-center gap-1 p-2 shrink-0">
          <button className="p-2 text-text-tertiary hover:text-text-primary transition-colors">
            <Mic className="w-5 h-5" />
          </button>
          
          <button 
            disabled={(!content.trim() && !isStreaming)}
            onClick={() => {
              if (isStreaming) {
                // handle stop (not fully implemented in simulation hook yet, but visually supported)
              } else if (content.trim()) {
                onSend(content);
                setContent('');
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                }
              }
            }}
            className={`p-2 rounded-lg transition-colors flex items-center justify-center
              ${isStreaming 
                ? 'bg-danger text-white hover:bg-danger/90' 
                : content.trim() 
                  ? 'bg-brand-500 text-white hover:bg-brand-600' 
                  : 'bg-card text-text-tertiary'}`}
          >
            {isStreaming ? <Square className="w-4 h-4 fill-current" /> : <ArrowUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="text-center mt-2">
        <span className="text-[11px] text-text-tertiary">CampusGPT can make mistakes. Verify important information.</span>
      </div>
    </div>
  );
}
