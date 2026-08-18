import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import {
  Search, MessageSquarePlus, Settings, Calendar, BookOpen,
  Clock, ChevronRight, Hash, ArrowRight,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useGetRecentThreads } from '@workspace/api-client-react';

interface Action {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'chat' | 'thread';
}

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: recentThreads } = useGetRecentThreads();

  const close = useCallback(() => {
    setCommandPaletteOpen(false);
    setQuery('');
    setSelected(0);
  }, [setCommandPaletteOpen]);

  const navigate = useCallback((path: string) => {
    setLocation(path);
    close();
  }, [setLocation, close]);

  // Static quick actions
  const staticActions: Action[] = [
    {
      id: 'new-chat', label: 'New Chat', description: 'Start a fresh conversation',
      icon: <MessageSquarePlus className="w-4 h-4" />, shortcut: '⌘N',
      action: () => navigate('/chat/new'), category: 'chat',
    },
    {
      id: 'planner', label: 'Academic Planner', description: 'View tasks and deadlines',
      icon: <Calendar className="w-4 h-4" />,
      action: () => navigate('/planner'), category: 'navigation',
    },
    {
      id: 'timetable', label: 'Timetable', description: 'Your class schedule',
      icon: <Clock className="w-4 h-4" />,
      action: () => navigate('/timetable'), category: 'navigation',
    },
    {
      id: 'documents', label: 'Documents', description: 'Your uploaded files',
      icon: <BookOpen className="w-4 h-4" />,
      action: () => navigate('/documents'), category: 'navigation',
    },
    {
      id: 'settings', label: 'Settings', description: 'Profile and preferences',
      icon: <Settings className="w-4 h-4" />, shortcut: '⌘,',
      action: () => navigate('/settings'), category: 'navigation',
    },
  ];

  // Thread-based actions from history
  const threadActions: Action[] = (recentThreads ?? []).slice(0, 20).map(t => ({
    id: `thread-${t.id}`,
    label: t.title || 'Untitled',
    icon: <Hash className="w-4 h-4 text-text-tertiary" />,
    action: () => navigate(`/chat/${t.id}`),
    category: 'thread' as const,
  }));

  // Filter by query
  const filteredStatic = query
    ? staticActions.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.description?.toLowerCase().includes(query.toLowerCase())
      )
    : staticActions;

  const filteredThreads = query
    ? threadActions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))
    : threadActions.slice(0, 5);

  const allItems: Action[] = [...filteredStatic, ...filteredThreads];

  // Keyboard navigation
  useEffect(() => {
    if (!commandPaletteOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected(s => Math.min(s + 1, allItems.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(s => Math.max(s - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        allItems[selected]?.action();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, allItems, selected, close]);

  // Reset selection on query change
  useEffect(() => setSelected(0), [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${selected}"]`) as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!commandPaletteOpen) return null;

  const categoryLabel: Record<string, string> = {
    chat: 'Actions',
    navigation: 'Go to',
    thread: 'Recent Conversations',
  };

  // Group items
  const groups: { label: string; items: Action[] }[] = [];
  const seenCategories = new Set<string>();
  for (const action of allItems) {
    const cat = action.category;
    if (!seenCategories.has(cat)) {
      seenCategories.add(cat);
      groups.push({ label: categoryLabel[cat] ?? cat, items: [] });
    }
    groups[groups.length - 1].items.push(action);
  }

  let globalIdx = 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[8vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={close}
      />

      {/* Palette */}
      <div className="relative w-full max-w-[580px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden fade-scale-in">
        {/* Search input */}
        <div className="flex items-center px-4 gap-3 border-b border-border h-14">
          <Search className="w-4.5 h-4.5 text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            placeholder="Search conversations, go to page, or ask…"
            className="flex-1 bg-transparent border-none outline-none text-text-primary text-[15px] placeholder:text-text-tertiary"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <kbd className="text-[11px] text-text-tertiary bg-background border border-border px-1.5 py-0.5 rounded-md font-mono shrink-0">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[min(60vh,400px)] overflow-y-auto p-2">
          {allItems.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-text-tertiary">No results for "{query}"</p>
            </div>
          ) : (
            groups.map(group => (
              <div key={group.label} className="mb-2">
                <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider px-3 py-1.5">
                  {group.label}
                </p>
                {group.items.map(item => {
                  const idx = globalIdx++;
                  return (
                    <button
                      key={item.id}
                      data-idx={idx}
                      onClick={item.action}
                      onMouseEnter={() => setSelected(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        selected === idx
                          ? 'bg-brand-500 text-white'
                          : 'text-text-primary hover:bg-background'
                      }`}
                    >
                      <span className={`shrink-0 ${selected === idx ? 'text-white' : 'text-text-tertiary'}`}>
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium truncate">{item.label}</p>
                        {item.description && (
                          <p className={`text-[12px] truncate ${selected === idx ? 'text-white/70' : 'text-text-tertiary'}`}>
                            {item.description}
                          </p>
                        )}
                      </div>
                      {item.shortcut && (
                        <kbd className={`text-[11px] px-1.5 py-0.5 rounded-md font-mono shrink-0 border ${
                          selected === idx
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'bg-background border-border text-text-tertiary'
                        }`}>
                          {item.shortcut}
                        </kbd>
                      )}
                      {!item.shortcut && selected === idx && (
                        <ArrowRight className="w-3.5 h-3.5 text-white/70 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-background/50">
          <span className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
            <kbd className="bg-card border border-border px-1 py-0.5 rounded text-[10px] font-mono">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
            <kbd className="bg-card border border-border px-1 py-0.5 rounded text-[10px] font-mono">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
            <kbd className="bg-card border border-border px-1 py-0.5 rounded text-[10px] font-mono">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
