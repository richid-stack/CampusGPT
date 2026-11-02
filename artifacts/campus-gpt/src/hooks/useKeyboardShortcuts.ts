import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAppStore } from '../store/appStore';

/** App-wide shortcuts. The list shown in Settings must match this. */
export function useKeyboardShortcuts() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.altKey) return;
      const key = e.key.toLowerCase();
      const store = useAppStore.getState();

      // ⌘K — command palette
      if (key === 'k' && !e.shiftKey) {
        e.preventDefault();
        store.setCommandPaletteOpen(!store.commandPaletteOpen);
        return;
      }
      // ⌘\ — show or hide the sidebar
      if (e.key === '\\') {
        e.preventDefault();
        store.setSidebarCollapsed(!store.sidebarCollapsed);
        return;
      }
      // ⇧⌘O — new chat (⌘N is taken by the browser)
      if (key === 'o' && e.shiftKey) {
        e.preventDefault();
        setLocation('/chat/new');
        return;
      }
      // ⌘, — settings
      if (e.key === ',') {
        e.preventDefault();
        setLocation('/settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setLocation]);
}
