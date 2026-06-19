import { Link, useLocation } from 'wouter';
import { LayoutDashboard, MessageSquarePlus, Book, GraduationCap, Bell } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/' },
  { icon: MessageSquarePlus, label: 'Chat', href: '/chat/new' },
  { icon: Book, label: 'Docs', href: '/documents' },
  { icon: GraduationCap, label: 'Planner', href: '/planner' },
  { icon: Bell, label: 'Alerts', href: '/notifications' },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border flex items-center justify-around h-16 safe-bottom">
      {navItems.map(item => {
        const active = location === item.href || (item.href !== '/' && location.startsWith(item.href.split('/')[1] ? `/${item.href.split('/')[1]}` : '___'));
        return (
          <Link key={item.href} href={item.href}>
            <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px] ${
              active ? 'text-brand-500' : 'text-text-tertiary'
            }`}>
              <item.icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
