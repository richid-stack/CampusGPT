import type { ReactNode } from 'react';
import { PanelLeft } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { cn } from '@/lib/utils';

/** Opens the menu on phones, and brings the sidebar back on larger screens once it was hidden. */
export function SidebarToggle({ className }: { className?: string }) {
  const { sidebarCollapsed, setSidebarCollapsed, setMobileSidebarOpen } = useAppStore();
  return (
    <>
      <button
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open menu"
        className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-card md:hidden', className)}
      >
        <PanelLeft className="h-5 w-5" />
      </button>
      {sidebarCollapsed && (
        <button
          type="button"
          onClick={() => setSidebarCollapsed(false)}
          aria-label="Show sidebar"
          className={cn('hidden h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-card md:flex', className)}
        >
          <PanelLeft className="h-5 w-5" />
        </button>
      )}
    </>
  );
}

interface PageHeaderProps {
  title?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  /** Transparent, no divider — for the home screen. */
  bare?: boolean;
  children?: ReactNode;
}

/** The bar at the top of every screen. */
export function PageHeader({ title, icon, actions, bare, children }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'z-10 flex h-14 shrink-0 items-center gap-2 px-3 md:px-4',
        bare ? 'bg-transparent' : 'sticky top-0 border-b border-border bg-background/80 backdrop-blur-sm',
      )}
    >
      <SidebarToggle />
      {icon}
      {title && <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">{title}</h1>}
      {children}
      {actions && <div className="ml-auto flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  );
}
