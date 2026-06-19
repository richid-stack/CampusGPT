import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Search } from 'lucide-react';
import { useLocation } from 'wouter';

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-background/80 backdrop-blur-sm animate-in">
      <div 
        className="fixed inset-0" 
        onClick={() => setCommandPaletteOpen(false)}
      />
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden relative z-10 animate-in">
        <div className="flex items-center px-4 py-3 border-b border-border gap-3">
          <Search className="w-5 h-5 text-text-tertiary" />
          <input 
            autoFocus
            type="text" 
            placeholder="Ask anything, search documents, or jump to..."
            className="flex-1 bg-transparent border-none outline-none text-text-primary text-base placeholder:text-text-tertiary"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="text-xs text-text-tertiary bg-background px-2 py-1 rounded border border-border">Esc</div>
        </div>
        
        <div className="p-2 max-h-[60vh] overflow-y-auto">
          <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider px-3 py-2">Quick Actions</div>
          <div className="flex flex-col gap-1">
            <button 
              className="flex items-center w-full px-3 py-2 text-sm text-text-primary rounded-md hover:bg-background hover:text-brand-600 transition-colors text-left"
              onClick={() => {
                setLocation('/chat/new');
                setCommandPaletteOpen(false);
              }}
            >
              New Chat
            </button>
            <button className="flex items-center w-full px-3 py-2 text-sm text-text-primary rounded-md hover:bg-background hover:text-brand-600 transition-colors text-left">
              Open Academic Planner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
