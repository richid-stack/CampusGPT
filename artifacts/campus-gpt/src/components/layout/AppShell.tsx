import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { ContextPanel } from './ContextPanel';
import { CommandPalette } from './CommandPalette';
import { MobileNav } from './MobileNav';
import { useAppStore } from '../../store/appStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { Menu, X } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  useKeyboardShortcuts();
  const { rightPanelOpen } = useAppStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 h-full">
            <Sidebar onNavClick={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Mobile header bar */}
        <div className="flex md:hidden items-center gap-3 px-4 h-14 border-b border-border bg-background/90 backdrop-blur-sm shrink-0 z-10">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-card transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-text-secondary" />
          </button>
          <span className="font-semibold text-base bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-indigo-500">
            CampusGPT
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </div>

        {/* Mobile bottom navigation */}
        <div className="md:hidden">
          <MobileNav />
        </div>
      </main>

      {rightPanelOpen && (
        <div className="hidden lg:flex">
          <ContextPanel />
        </div>
      )}

      <CommandPalette />
    </div>
  );
}
