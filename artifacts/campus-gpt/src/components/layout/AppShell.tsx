import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useAppStore } from '../../store/appStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  useKeyboardShortcuts();
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useAppStore();

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      {/* Desktop: slides away when collapsed */}
      <div
        className={`hidden h-full shrink-0 overflow-hidden transition-[width] duration-200 ease-out md:block ${
          sidebarCollapsed ? 'w-0' : 'w-[280px]'
        }`}
        aria-hidden={sidebarCollapsed}
        // Keep hidden links out of the tab order.
        inert={sidebarCollapsed}
      >
        <Sidebar />
      </div>

      {/* Phone: slide-in menu */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[300px] max-w-[85vw] border-r border-sidebar-border bg-sidebar p-0 [&>button]:hidden">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Navigate CampusGPT</SheetDescription>
          <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="relative flex h-full min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </main>

      <CommandPalette />
    </div>
  );
}
