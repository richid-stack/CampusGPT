import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { ContextPanel } from './ContextPanel';
import { CommandPalette } from './CommandPalette';
import { useAppStore } from '../../store/appStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  useKeyboardShortcuts();
  const { rightPanelOpen } = useAppStore();

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      {rightPanelOpen && <ContextPanel />}
      
      <CommandPalette />
    </div>
  );
}
