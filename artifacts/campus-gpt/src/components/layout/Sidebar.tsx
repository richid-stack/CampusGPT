import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Bell, CalendarClock, CalendarDays, FolderOpen, ListChecks, PanelLeftClose,
  Pin, Search, Settings2, SquarePen, X,
} from 'lucide-react';
import { useGetPinnedThreads, useGetRecentThreads, useGetUserProfile } from '@workspace/api-client-react';
import { useAppStore } from '../../store/appStore';
import { cn } from '@/lib/utils';

interface SidebarProps {
  /** Called after any link is followed (closes the phone menu). */
  onNavigate?: () => void;
}

const NAV = [
  { href: '/timetable', label: 'Timetable', icon: CalendarClock },
  { href: '/planner', label: 'Planner', icon: ListChecks },
  { href: '/documents', label: 'Documents', icon: FolderOpen },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/notifications', label: 'Notifications', icon: Bell },
] as const;

// ── Date grouping for the history list ───────────────────────────────────────
function getGroup(date: string | Date | null | undefined): string {
  if (!date) return 'Older';
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((today.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff <= 7) return 'Previous 7 days';
  return 'Older';
}
const GROUP_ORDER = ['Today', 'Yesterday', 'Previous 7 days', 'Older'];

type ThreadLike = { id: number; title?: string | null; lastMessageAt?: string | Date | null; createdAt?: string | Date | null };

export function Sidebar({ onNavigate }: SidebarProps) {
  const [location] = useLocation();
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ThreadLike[]>([]);
  const [searching, setSearching] = useState(false);

  const { data: recentThreads, isLoading: loadingRecent } = useGetRecentThreads();
  const { data: pinnedThreads } = useGetPinnedThreads();
  const { data: profile } = useGetUserProfile();

  // Search the full conversation corpus, including message bodies.
  const query = search.trim();
  useEffect(() => {
    if (!query) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    // Wait for a pause in typing so we don't query on every keystroke.
    const timer = setTimeout(() => {
      fetch(`/api/threads/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setSearchResults(Array.isArray(data) ? data : []))
        .catch((err) => { if (err?.name !== 'AbortError') setSearchResults([]); })
        .finally(() => { if (!controller.signal.aborted) setSearching(false); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  const pinned = (pinnedThreads ?? []) as ThreadLike[];
  const recent = (query ? searchResults : (recentThreads ?? [])) as ThreadLike[];
  const pinnedIds = useMemo(() => new Set(pinned.map((t) => t.id)), [pinned]);

  const grouped = useMemo(() => {
    const groups: Record<string, ThreadLike[]> = {};
    for (const t of recent) {
      if (!query && pinnedIds.has(t.id)) continue; // already shown under Pinned
      (groups[getGroup(t.lastMessageAt ?? t.createdAt)] ??= []).push(t);
    }
    return groups;
  }, [recent, pinnedIds, query]);

  const hasRecent = GROUP_ORDER.some((g) => grouped[g]?.length);
  const name = profile?.name?.trim() || 'Student';
  const initial = name.charAt(0).toUpperCase();

  return (
    <aside className="flex h-full w-full min-w-[280px] flex-col bg-sidebar md:border-r md:border-sidebar-border" aria-label="Sidebar">
      {/* Brand + collapse */}
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <Link href="/" onClick={onNavigate} className="text-[17px] font-semibold tracking-tight text-foreground">
          Campus<span className="text-muted-foreground">GPT</span>
        </Link>
        <button
          type="button"
          onClick={() => (onNavigate ? onNavigate() : setSidebarCollapsed(true))}
          aria-label={onNavigate ? 'Close menu' : 'Hide sidebar'}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
        >
          {onNavigate ? <X className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
        </button>
      </div>

      {/* New chat + search */}
      <div className="flex shrink-0 flex-col gap-2 px-3 pb-2">
        <Link
          href="/chat/new"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card"
        >
          <SquarePen className="h-4 w-4 shrink-0" aria-hidden /> New chat
        </Link>
        <label className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm transition-shadow focus-within:ring-1 focus-within:ring-foreground/20">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>
      </div>

      {/* Scrollable: shortcuts + history */}
      <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-2" aria-label="Main">
        {!query && (
          <Section label="Campus">
            {NAV.map(({ href, label, icon: Icon }) => (
              <RowLink key={href} href={href} active={location === href} onClick={onNavigate}>
                <Icon className="h-4 w-4 shrink-0" aria-hidden /> {label}
              </RowLink>
            ))}
          </Section>
        )}

        {!query && pinned.length > 0 && (
          <Section label="Pinned" icon={<Pin className="h-3 w-3" aria-hidden />}>
            {pinned.map((t) => (
              <RowLink key={t.id} href={`/chat/${t.id}`} active={location === `/chat/${t.id}`} onClick={onNavigate}>
                <span className="truncate">{t.title || 'Untitled'}</span>
              </RowLink>
            ))}
          </Section>
        )}

        {loadingRecent || searching ? (
          <div className="flex flex-col gap-2 px-3" aria-busy>
            {[80, 60, 72, 50].map((w, i) => (
              <div key={i} className="h-3.5 animate-shimmer rounded-full" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : !hasRecent ? (
          <p className="px-3 text-[13px] text-muted-foreground">{query ? 'No chats match that search.' : 'Your chats will appear here.'}</p>
        ) : (
          GROUP_ORDER.filter((g) => grouped[g]?.length).map((group) => (
            <Section key={group} label={query ? 'Results' : group}>
              {grouped[group].map((t) => (
                <RowLink key={t.id} href={`/chat/${t.id}`} active={location === `/chat/${t.id}`} onClick={onNavigate}>
                  <span className="truncate">{t.title || 'Untitled'}</span>
                </RowLink>
              ))}
            </Section>
          ))
        )}
      </nav>

      {/* Account */}
      <div className="shrink-0 border-t border-sidebar-border p-2">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-card',
            location === '/settings' && 'bg-card',
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background" aria-hidden>
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">{profile?.email ?? 'Settings'}</span>
          </span>
          <Settings2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Settings" />
        </Link>
      </div>
    </aside>
  );
}

function Section({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-0.5">
      <h3 className="flex items-center gap-1.5 px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
        {icon} {label}
      </h3>
      {children}
    </section>
  );
}

function RowLink({ href, active, onClick, children }: { href: string; active: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[14px] transition-colors',
        active ? 'bg-card font-medium text-foreground' : 'text-muted-foreground hover:bg-card/70 hover:text-foreground',
      )}
    >
      {children}
    </Link>
  );
}
