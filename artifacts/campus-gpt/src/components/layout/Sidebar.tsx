import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  MessageSquarePlus, Settings, Moon, Sun, X,
  Pin, Clock, Search, ChevronDown,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useGetRecentThreads, useGetPinnedThreads } from '@workspace/api-client-react';

interface SidebarProps {
  onNavClick?: () => void;
}

// ── Skeleton thread row ───────────────────────────────────────────────────────
function ThreadSkeleton() {
  return (
    <div className="px-3 py-1.5 flex items-center gap-2">
      <div className="h-3 rounded-full animate-shimmer flex-1" style={{ background: 'var(--card)', maxWidth: '80%' }} />
    </div>
  );
}

// ── Date-group helper ─────────────────────────────────────────────────────────
function getGroup(date: string | Date | null | undefined): string {
  if (!date) return 'Older';
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((today.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff <= 7) return 'Last 7 days';
  return 'Older';
}

const GROUP_ORDER = ['Today', 'Yesterday', 'Last 7 days', 'Older'];

export function Sidebar({ onNavClick }: SidebarProps) {
  const [location] = useLocation();
  const { sidebarCollapsed, theme, setTheme, setCommandPaletteOpen } = useAppStore();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const { data: recentThreads,  isLoading: loadingRecent  } = useGetRecentThreads();
  const { data: pinnedThreads,  isLoading: loadingPinned  } = useGetPinnedThreads();

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // Search the full conversation corpus, including message bodies.
  useEffect(() => {
    const query = search.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    fetch(`/api/threads/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(res => res.ok ? res.json() : [])
      .then(data => setSearchResults(Array.isArray(data) ? data : []))
      .catch(err => { if (err?.name !== 'AbortError') setSearchResults([]); })
      .finally(() => setSearching(false));
    return () => controller.abort();
  }, [search]);

  // Filter by search
  const q = search.toLowerCase().trim();
  const filteredRecent  = useMemo(() =>
    q ? searchResults : (recentThreads  ?? []),
    [recentThreads, searchResults, q]
  );
  const filteredPinned  = useMemo(() =>
    q ? (pinnedThreads  ?? []).filter(t => t.title?.toLowerCase().includes(q)) : (pinnedThreads  ?? []),
    [pinnedThreads, q]
  );

  // Group recent by date
  const groupedRecent = useMemo(() => {
    const groups: Record<string, typeof filteredRecent> = {};
    for (const t of filteredRecent) {
      const g = getGroup((t as any).lastMessageAt ?? (t as any).createdAt);
      if (!groups[g]) groups[g] = [];
      groups[g].push(t);
    }
    return groups;
  }, [filteredRecent]);

  return (
    <aside
      className={`h-full bg-sidebar border-r border-sidebar-border transition-all duration-200 ease-out flex flex-col ${
        sidebarCollapsed ? 'w-[56px]' : 'w-[280px]'
      }`}
    >
      {/* Logo header */}
      <div className="px-4 flex items-center h-[64px] shrink-0 gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-500 shrink-0" />
        {!sidebarCollapsed && (
          <>
            <span className="font-semibold text-[15px] bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-indigo-500 flex-1">
              CampusGPT
            </span>
            {onNavClick && (
              <button onClick={onNavClick} className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-text-tertiary">
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Search + New Chat */}
      {!sidebarCollapsed && (
        <div className="px-3 pb-2 flex flex-col gap-1.5 shrink-0">
          {/* Search */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-150 ${
            searchFocused
              ? 'border-brand-500/40 bg-background ring-1 ring-brand-500/20'
              : 'border-border bg-card'
          }`}>
            <Search className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search conversations…"
              className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-tertiary outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-text-tertiary hover:text-text-primary">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* New Chat */}
          <Link href="/chat/new" onClick={onNavClick}>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-sidebar-accent cursor-pointer text-[13px] font-medium text-sidebar-foreground transition-colors group">
              <MessageSquarePlus className="w-4 h-4 shrink-0 group-hover:text-brand-500 transition-colors" />
              <span>New Chat</span>
              <kbd className="ml-auto text-[10px] text-text-tertiary bg-background border border-border px-1.5 py-0.5 rounded-md font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                ⌘N
              </kbd>
            </div>
          </Link>
        </div>
      )}

      {/* Collapsed: icon-only new chat */}
      {sidebarCollapsed && (
        <div className="px-3 pb-2 shrink-0">
          <Link href="/chat/new" onClick={onNavClick}>
            <div className="flex justify-center p-2 rounded-xl hover:bg-sidebar-accent cursor-pointer transition-colors">
              <MessageSquarePlus className="w-4 h-4 text-sidebar-foreground" />
            </div>
          </Link>
        </div>
      )}

      {/* Thread lists */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 py-1">

        {/* Pinned */}
        {!sidebarCollapsed && (
          <div className="px-3 mb-1">
            <SectionHeader icon={<Pin className="w-3 h-3" />} label="Pinned" />
            {loadingPinned ? (
              <>{[0,1].map(i => <ThreadSkeleton key={i} />)}</>
            ) : filteredPinned.length === 0 ? (
              <EmptySection message={search ? 'No matches' : 'No pinned chats yet'} />
            ) : (
              filteredPinned.map(t => (
                <ThreadLink key={t.id} id={t.id} title={t.title} active={location === `/chat/${t.id}`} onNavClick={onNavClick} />
              ))
            )}
          </div>
        )}

        {/* Recent — grouped by date */}
        {!sidebarCollapsed && (
          <div className="px-3">
            <SectionHeader icon={<Clock className="w-3 h-3" />} label="Recent" />
            {loadingRecent || searching ? (
              <>{[0,1,2,3].map(i => <ThreadSkeleton key={i} />)}</>
            ) : filteredRecent.length === 0 ? (
              <EmptySection message={search ? 'No matches' : 'No conversations yet'} />
            ) : (
              GROUP_ORDER.filter(g => groupedRecent[g]?.length).map(group => (
                <div key={group} className="mb-2">
                  <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-3 py-1">
                    {group}
                  </p>
                  {groupedRecent[group].map(t => (
                    <ThreadLink key={t.id} id={t.id} title={t.title} active={location === `/chat/${t.id}`} onNavClick={onNavClick} />
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border flex flex-col gap-0.5 shrink-0">
        {!sidebarCollapsed && (
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-sidebar-accent text-[13px] font-medium text-sidebar-foreground transition-colors group"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">Search</span>
            <kbd className="text-[10px] text-text-tertiary bg-background border border-border px-1.5 py-0.5 rounded-md font-mono">
              ⌘K
            </kbd>
          </button>
        )}
        <Link href="/settings" onClick={onNavClick}>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sidebar-accent cursor-pointer text-[13px] font-medium text-sidebar-foreground transition-colors">
            <Settings className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Settings</span>}
          </div>
        </Link>
        <div
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sidebar-accent cursor-pointer text-[13px] font-medium text-sidebar-foreground transition-colors"
        >
          {theme === 'light' ? <Moon className="w-4 h-4 shrink-0" /> : <Sun className="w-4 h-4 shrink-0" />}
          {!sidebarCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </div>
      </div>
    </aside>
  );
}

// ── Small sub-components ──────────────────────────────────────────────────────
function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <h3 className="text-[10px] font-semibold text-text-tertiary px-3 mb-1 uppercase tracking-wider flex items-center gap-1.5">
      {icon} {label}
    </h3>
  );
}

function EmptySection({ message }: { message: string }) {
  return (
    <p className="px-3 py-1.5 text-[12px] text-text-tertiary italic">{message}</p>
  );
}

function ThreadLink({
  id, title, active, onNavClick,
}: { id: number; title?: string | null; active: boolean; onNavClick?: () => void }) {
  return (
    <Link href={`/chat/${id}`} onClick={onNavClick}>
      <div className={`text-[13px] cursor-pointer py-1.5 px-3 rounded-xl truncate transition-all duration-150 ${
        active
          ? 'bg-brand-500/10 text-brand-500 font-medium'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-text-primary'
      }`}>
        {title || 'Untitled'}
      </div>
    </Link>
  );
}
