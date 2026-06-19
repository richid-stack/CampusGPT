import { Link, useLocation } from 'wouter';
import { 
  MessageSquarePlus, 
  Book, 
  GraduationCap, 
  Calendar, 
  Bell, 
  Settings, 
  Moon, 
  Sun,
  LayoutDashboard,
  X,
  Pin,
  Clock,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useGetRecentThreads, useGetPinnedThreads } from '@workspace/api-client-react';

interface SidebarProps {
  onNavClick?: () => void;
}

export function Sidebar({ onNavClick }: SidebarProps) {
  const [location] = useLocation();
  const { sidebarCollapsed, theme, setTheme } = useAppStore();
  const { data: recentThreads, isLoading: loadingRecent } = useGetRecentThreads();
  const { data: pinnedThreads, isLoading: loadingPinned } = useGetPinnedThreads();

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const navItems = [
    { icon: LayoutDashboard, label: 'Home', href: '/' },
    { icon: Book, label: 'Documents', href: '/documents' },
    { icon: GraduationCap, label: 'Academic Planner', href: '/planner' },
    { icon: Calendar, label: 'Timetable', href: '/timetable' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
  ];

  return (
    <aside 
      className={`h-full bg-sidebar border-r border-sidebar-border transition-all duration-220 ease-out flex flex-col ${
        sidebarCollapsed ? 'w-[56px]' : 'w-[280px]'
      }`}
    >
      {/* Header */}
      <div className="p-4 flex items-center h-[64px] shrink-0">
        {!sidebarCollapsed && (
          <>
            <span className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-indigo-500 flex-1">
              CampusGPT
            </span>
            {onNavClick && (
              <button
                onClick={onNavClick}
                className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-text-tertiary ml-2"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        )}
        {sidebarCollapsed && (
          <div className="w-full flex justify-center">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-brand-500 to-indigo-500" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-4">
        {/* New Chat */}
        <div className="px-3">
          <Link href="/chat/new" onClick={onNavClick}>
            <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent cursor-pointer text-sm font-medium text-sidebar-foreground">
              <MessageSquarePlus className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>New Chat</span>}
            </div>
          </Link>
        </div>

        {/* Pinned threads */}
        {!sidebarCollapsed && (
          <div className="px-3 flex flex-col gap-0.5">
            <h3 className="text-xs font-semibold text-text-tertiary px-3 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Pin className="w-3 h-3" /> Pinned
            </h3>
            {loadingPinned && (
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-tertiary">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading…
              </div>
            )}
            {!loadingPinned && (!pinnedThreads || pinnedThreads.length === 0) && (
              <p className="px-3 py-1 text-xs text-text-tertiary">No pinned chats yet</p>
            )}
            {pinnedThreads?.map(t => (
              <Link key={t.id} href={`/chat/${t.id}`} onClick={onNavClick}>
                <div className={`text-sm cursor-pointer py-1.5 px-3 rounded-md truncate transition-colors ${
                  location === `/chat/${t.id}` ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-text-primary'
                }`}>
                  {t.title || 'Untitled'}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Recent threads */}
        {!sidebarCollapsed && (
          <div className="px-3 flex flex-col gap-0.5">
            <h3 className="text-xs font-semibold text-text-tertiary px-3 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Recent
            </h3>
            {loadingRecent && (
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-tertiary">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading…
              </div>
            )}
            {!loadingRecent && (!recentThreads || recentThreads.length === 0) && (
              <p className="px-3 py-1 text-xs text-text-tertiary">No recent chats yet</p>
            )}
            {recentThreads?.map(t => (
              <Link key={t.id} href={`/chat/${t.id}`} onClick={onNavClick}>
                <div className={`text-sm cursor-pointer py-1.5 px-3 rounded-md truncate transition-colors ${
                  location === `/chat/${t.id}` ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-text-primary'
                }`}>
                  {t.title || 'Untitled'}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* My Campus */}
        <div className="px-3 flex flex-col gap-1 mt-auto pt-2 border-t border-sidebar-border">
          {!sidebarCollapsed && <h3 className="text-xs font-semibold text-text-tertiary px-3 mb-1.5 uppercase tracking-wider">My Campus</h3>}
          {navItems.map(item => (
            <Link key={item.href} href={item.href} onClick={onNavClick}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-sm font-medium ${
                location === item.href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent text-sidebar-foreground'
              }`}>
                <item.icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span className="flex-1 truncate">{item.label}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border flex flex-col gap-1 shrink-0">
        <Link href="/settings" onClick={onNavClick}>
          <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent cursor-pointer text-sm font-medium text-sidebar-foreground">
            <Settings className="w-4 h-4" />
            {!sidebarCollapsed && <span>Settings</span>}
          </div>
        </Link>
        <div onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent cursor-pointer text-sm font-medium text-sidebar-foreground">
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          {!sidebarCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </div>
      </div>
    </aside>
  );
}
