import { Link, useLocation } from 'wouter';
import { 
  MessageSquarePlus, 
  Search, 
  Book, 
  GraduationCap, 
  Calendar, 
  Bell, 
  Settings, 
  Mic, 
  Map, 
  Moon, 
  Sun,
  LayoutDashboard
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export function Sidebar() {
  const [location] = useLocation();
  const { sidebarCollapsed, theme, setTheme } = useAppStore();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Home', href: '/' },
    { icon: Book, label: 'Documents', href: '/documents', badge: 12 },
    { icon: GraduationCap, label: 'Academic Planner', href: '/planner' },
    { icon: Calendar, label: 'Timetable', href: '/timetable' },
    { icon: Bell, label: 'Notifications', href: '/notifications', badge: 5 },
  ];

  return (
    <aside 
      className={`h-full bg-sidebar border-r border-sidebar-border transition-all duration-220 ease-out flex flex-col ${
        sidebarCollapsed ? 'w-[56px]' : 'w-[280px]'
      }`}
    >
      {/* Header */}
      <div className="p-4 flex items-center h-[72px]">
        {!sidebarCollapsed && (
          <span className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-indigo-500 flex-1">
            CampusGPT
          </span>
        )}
        {sidebarCollapsed && (
          <div className="w-full flex justify-center">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-brand-500 to-indigo-500" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-6">
        {/* Actions */}
        <div className="px-3 flex flex-col gap-1">
          <Link href="/chat/new">
            <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent cursor-pointer text-sm font-medium">
              <MessageSquarePlus className="w-4 h-4 text-sidebar-foreground" />
              {!sidebarCollapsed && <span>New Chat</span>}
            </div>
          </Link>
          <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent cursor-pointer text-sm font-medium">
            <Search className="w-4 h-4 text-sidebar-foreground" />
            {!sidebarCollapsed && <span>Search</span>}
          </div>
        </div>

        {/* Pinned & Recent (only when open) */}
        {!sidebarCollapsed && (
          <>
            <div className="px-6 flex flex-col gap-1">
              <h3 className="text-xs font-semibold text-text-tertiary mb-2 uppercase tracking-wider">Pinned</h3>
              <div className="text-sm text-sidebar-foreground hover:text-text-primary cursor-pointer py-1 truncate">• Capstone planning</div>
              <div className="text-sm text-sidebar-foreground hover:text-text-primary cursor-pointer py-1 truncate">• Internship search</div>
            </div>

            <div className="px-6 flex flex-col gap-1">
              <h3 className="text-xs font-semibold text-text-tertiary mb-2 uppercase tracking-wider">Recent</h3>
              <div className="text-sm text-sidebar-foreground hover:text-text-primary cursor-pointer py-1 truncate">• Differential eq HW</div>
              <div className="text-sm text-sidebar-foreground hover:text-text-primary cursor-pointer py-1 truncate">• Hall reapplication</div>
              <div className="text-sm text-text-tertiary hover:text-text-primary cursor-pointer py-1 mt-1">See all →</div>
            </div>
          </>
        )}

        {/* My Campus */}
        <div className="px-3 flex flex-col gap-1">
          {!sidebarCollapsed && <h3 className="text-xs font-semibold text-text-tertiary px-3 mb-2 uppercase tracking-wider">My Campus</h3>}
          {navItems.map(item => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-sm font-medium ${
                location === item.href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent text-sidebar-foreground'
              }`}>
                <item.icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="bg-brand-50 text-brand-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border flex flex-col gap-1">
        <Link href="/settings">
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
