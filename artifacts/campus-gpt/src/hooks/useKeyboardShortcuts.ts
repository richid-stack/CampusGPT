import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

export function useKeyboardShortcuts() {
  const { 
    sidebarCollapsed, 
    setSidebarCollapsed,
    setCommandPaletteOpen,
    commandPaletteOpen
  } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘\ to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
      
      // ⌘K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      
      // ⌘N to trigger new chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        // Only prevent default if we're actually going to handle it
        // We'll let the Link handle the actual navigation or trigger a programmatic redirect
        // For now just logging, the actual implementation might need router access
      }
      
      // Esc to close palette/overlays
      if (e.key === 'Escape') {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed, setSidebarCollapsed, setCommandPaletteOpen, commandPaletteOpen]);
}
